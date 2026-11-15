import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSeed } from './seed';
import {
  addDays,
  itemTitle,
  nowTimeStr,
  todayStr,
  toDateTime,
  uid,
} from './utils';

const STORAGE_KEY = 'techmate-care:v1';
const DUE_WINDOW_MIN = 60; // chỉ báo "đến giờ" cho mục trong vòng 60 phút gần nhất
const MISSED_AFTER_MIN = 120; // quá 2 giờ mà chưa thực hiện => tự chuyển "Bỏ lỡ"
const CHECK_INTERVAL_MS = 20000;
const MAX_NOTIFICATIONS = 200;

const AppContext = createContext(null);

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return { ...createSeed(), ...parsed };
    }
  } catch {
    /* bỏ qua, dùng dữ liệu mẫu */
  }
  return createSeed();
}

const makeNotification = (kind, message, itemId) => ({
  id: uid(),
  kind,
  message,
  itemId,
  createdAt: new Date().toISOString(),
  read: false,
});

const dueMessage = (item) => {
  if (item.type === 'medicine') return { kind: 'medicine', message: `Đã đến giờ uống thuốc: ${item.name}${item.dosage ? ` – ${item.dosage}` : ''}.` };
  if (item.category === 'exercise') return { kind: 'exercise', message: `Đã đến giờ tập thể dục: ${item.title}.` };
  if (item.category === 'checkup') return { kind: 'checkup', message: `Đến giờ tái khám: ${item.title}.` };
  if (item.category === 'rest') return { kind: 'schedule', message: `Đã đến giờ nghỉ ngơi: ${item.title}.` };
  return { kind: 'schedule', message: `Đã đến giờ thực hiện: ${item.title}.` };
};

/**
 * Quét lịch trình và sinh thông báo tự động (thuần, không side effect).
 * Trả về null nếu không có gì thay đổi.
 */
function runScheduler(data, now = new Date()) {
  const keys = { ...data.notifiedKeys };
  const created = [];
  let changed = false;
  const today = todayStr();
  const tomorrow = addDays(today, 1);

  const items = data.items.map((item) => {
    if (!item.time || !item.date) return item;
    const at = toDateTime(item.date, item.time);
    const diffMin = (now - at) / 60000;
    let next = item;

    // 1) Đến giờ thực hiện
    const dueKey = `due:${item.id}:${item.date}T${item.time}`;
    if (!keys[dueKey] && diffMin >= 0 && diffMin <= DUE_WINDOW_MIN && (item.status === 'todo' || item.status === 'doing')) {
      keys[dueKey] = 1;
      const { kind, message } = dueMessage(item);
      created.push(makeNotification(kind, message, item.id));
    }

    // 2) Nhắc lịch tái khám trước 1 ngày / trong ngày
    if (item.category === 'checkup' && item.status !== 'done' && (item.date === today || item.date === tomorrow) && diffMin < 0) {
      const remindKey = `remind:${item.id}:${item.date}`;
      if (!keys[remindKey]) {
        keys[remindKey] = 1;
        const when = item.date === today ? 'hôm nay' : 'ngày mai';
        created.push(makeNotification('checkup', `Nhắc nhở: ${item.title} vào ${item.time} ${when}.`, item.id));
      }
    }

    // 3) Quá lâu chưa làm => Bỏ lỡ (chỉ tự động một lần cho mỗi mốc giờ)
    const missKey = `missed:${item.id}:${item.date}T${item.time}`;
    if (!keys[missKey] && item.status === 'todo' && diffMin > MISSED_AFTER_MIN) {
      keys[missKey] = 1;
      next = { ...item, status: 'missed', updatedAt: now.toISOString() };
      changed = true;
      created.push(makeNotification('missed', `Bỏ lỡ: ${itemTitle(item)} (${item.time}).`, item.id));
    }
    return next;
  });

  const keysChanged = Object.keys(keys).length !== Object.keys(data.notifiedKeys).length;
  if (!created.length && !changed && !keysChanged) return null;

  return {
    data: {
      ...data,
      items,
      notifiedKeys: keys,
      notifications: [...created.reverse(), ...data.notifications].slice(0, MAX_NOTIFICATIONS),
    },
    created,
  };
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const initial = loadData();
    // Khi mở app: đánh dấu các mốc đã quá hạn từ trước là "đã xử lý" để không bắn hàng loạt thông báo cũ
    const result = runScheduler(initial);
    return result ? result.data : initial;
  });
  const [toasts, setToasts] = useState([]);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Lưu localStorage mỗi khi dữ liệu đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Không thể lưu dữ liệu', e);
    }
  }, [data]);

  // Đồng bộ giữa nhiều tab trình duyệt
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismissToast = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const showToast = useCallback(
    (message, tone = 'info') => {
      const id = uid();
      setToasts((ts) => [...ts.slice(-2), { id, message, tone }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  // Bộ hẹn giờ: tự tạo thông báo khi đến giờ (khi ứng dụng đang mở)
  useEffect(() => {
    const tick = () => {
      const result = runScheduler(dataRef.current);
      if (!result) return;
      dataRef.current = result.data;
      setData(result.data);
      result.created.forEach((n) => showToast(n.message, n.kind === 'missed' ? 'danger' : 'info'));
    };
    tick();
    const timer = setInterval(tick, CHECK_INTERVAL_MS);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [showToast]);

  /** Cập nhật dữ liệu rồi chạy lại bộ hẹn giờ (vd: thêm mục đúng giờ hiện tại) */
  const commit = useCallback((updater) => {
    const next = updater(dataRef.current);
    const result = runScheduler(next);
    const final = result ? result.data : next;
    dataRef.current = final;
    setData(final);
    return result ? result.created : [];
  }, []);

  // ===== Hành động =====
  const actions = useMemo(() => {
    const pushNote = (d, kind, message, itemId) => ({
      ...d,
      notifications: [makeNotification(kind, message, itemId), ...d.notifications].slice(0, MAX_NOTIFICATIONS),
    });

    return {
      updateProfile(patch) {
        commit((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
      },

      /** Thêm thuốc / tác vụ; repeatDays > 1 sẽ tạo nhiều mục theo các ngày liên tiếp */
      addItem(item, repeatDays = 1) {
        const n = Math.max(1, Number(repeatDays) || 1);
        const groupId = n > 1 ? uid() : undefined;
        const created = Array.from({ length: n }, (_, i) => ({
          ...item,
          id: uid(),
          groupId,
          date: item.date ? addDays(item.date, i) : item.date,
          status: item.status || 'todo',
          createdAt: new Date().toISOString(),
        }));
        const notes = commit((d) => ({ ...d, items: [...d.items, ...created] }));
        notes.forEach((x) => showToast(x.message));
        return created;
      },

      updateItem(id, patch) {
        const notes = commit((d) => {
          const prev = d.items.find((i) => i.id === id);
          let next = {
            ...d,
            items: d.items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i)),
          };
          if (prev && patch.status === 'done' && prev.status !== 'done') {
            next = pushNote(next, 'done', `Đã hoàn thành: ${itemTitle({ ...prev, ...patch })}.`, id);
          }
          return next;
        });
        notes.forEach((x) => showToast(x.message));
      },

      setStatus(id, status) {
        const prev = dataRef.current.items.find((i) => i.id === id);
        commit((d) => {
          let next = {
            ...d,
            items: d.items.map((i) => (i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i)),
          };
          if (prev && status === 'done' && prev.status !== 'done') {
            next = pushNote(next, 'done', `Đã hoàn thành: ${itemTitle(prev)}${prev.time ? ` (${prev.time})` : ''}.`, id);
          }
          return next;
        });
        if (prev && status === 'done' && prev.status !== 'done') showToast(`Tuyệt vời! Đã hoàn thành “${itemTitle(prev)}”.`, 'success');
      },

      deleteItem(id) {
        commit((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
      },

      // Thông báo
      markRead(id, read = true) {
        commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read } : n)) }));
      },
      markAllRead() {
        commit((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));
      },
      deleteNotification(id) {
        commit((d) => ({ ...d, notifications: d.notifications.filter((n) => n.id !== id) }));
      },
      clearReadNotifications() {
        commit((d) => ({ ...d, notifications: d.notifications.filter((n) => !n.read) }));
      },
      addSystemNotification(message) {
        commit((d) => pushNote(d, 'system', message));
      },

      // Dinh dưỡng
      updateDiet(diet) {
        commit((d) => ({ ...d, diet: { ...d.diet, ...diet } }));
      },
      addDish(dish) {
        commit((d) => ({ ...d, menu: [...d.menu, { ...dish, id: uid() }] }));
      },
      updateDish(id, patch) {
        commit((d) => ({ ...d, menu: d.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
      },
      deleteDish(id) {
        commit((d) => ({ ...d, menu: d.menu.filter((m) => m.id !== id) }));
      },

      resetDemo() {
        const fresh = createSeed();
        const result = runScheduler(fresh);
        const final = result ? result.data : fresh;
        dataRef.current = final;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
        } catch {
          /* ignore */
        }
        setData(final);
      },
    };
  }, [commit, showToast]);

  const value = useMemo(
    () => ({ ...data, ...actions, toasts, showToast, dismissToast, unreadCount: data.notifications.filter((n) => !n.read).length }),
    [data, actions, toasts, showToast, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp phải dùng bên trong AppProvider');
  return ctx;
};

/** Đồng hồ dùng chung, cập nhật theo chu kỳ */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export { nowTimeStr };
