// ===== Tiện ích ngày giờ & hằng số dùng chung =====

const pad = (n) => String(n).padStart(2, '0');

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Chuỗi YYYY-MM-DD theo giờ địa phương */
export const toDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toDateStr(new Date());

export const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return toDateStr(dt);
};

/** Ghép ngày + giờ thành đối tượng Date (giờ địa phương) */
export const toDateTime = (dateStr, timeStr = '00:00') => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

export const nowTimeStr = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const formatDateLong = (d = new Date()) =>
  `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

/** "Hôm nay", "Ngày mai", "Hôm qua" hoặc Thứ, dd/mm */
export const relativeDayLabel = (dateStr) => {
  const t = todayStr();
  if (dateStr === t) return 'Hôm nay';
  if (dateStr === addDays(t, 1)) return 'Ngày mai';
  if (dateStr === addDays(t, -1)) return 'Hôm qua';
  const dt = toDateTime(dateStr);
  return `${WEEKDAYS[dt.getDay()]}, ${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`;
};

export const formatDateTime = (iso) => {
  const d = new Date(iso);
  const day = toDateStr(d);
  return `${nowTimeStr(d)} · ${relativeDayLabel(day)}`;
};

export const timeAgo = (iso, now = new Date()) => {
  const diff = Math.round((now - new Date(iso)) / 60000);
  if (diff < 1) return 'Vừa xong';
  if (diff < 60) return `${diff} phút trước`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
};

/** Khoảng thời gian tới mốc: "còn 25 phút", "còn 2 giờ 10 phút" */
export const countdown = (target, now = new Date()) => {
  const mins = Math.round((target - now) / 60000);
  if (mins <= 0) return 'Đến giờ rồi';
  if (mins < 60) return `Còn ${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return `Còn ${h} giờ${m ? ` ${m} phút` : ''}`;
  return `Còn ${Math.floor(h / 24)} ngày`;
};

export const calcAge = (dob) => {
  if (!dob) return null;
  const b = toDateTime(dob);
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) age--;
  return age >= 0 ? age : null;
};

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

// ===== Trạng thái =====
// Dùng một trường status duy nhất cho mọi mục => lịch trình & khu vực quản lý luôn đồng bộ.
export const STATUS = {
  todo: { schedule: 'Chưa thực hiện', manage: 'Cần làm', tone: 'todo' },
  doing: { schedule: 'Đang thực hiện', manage: 'Đang làm', tone: 'doing' },
  done: { schedule: 'Đã hoàn thành', manage: 'Đã xong', tone: 'done' },
  missed: { schedule: 'Bỏ lỡ', manage: 'Bỏ lỡ', tone: 'missed' },
};
export const STATUS_KEYS = ['todo', 'doing', 'done', 'missed'];
export const MANAGE_STATUS_KEYS = ['todo', 'doing', 'done'];

// ===== Loại tác vụ =====
export const TASK_CATEGORIES = {
  exercise: 'Tập thể dục',
  rest: 'Nghỉ ngơi',
  checkup: 'Tái khám',
  meal: 'Ăn uống',
  other: 'Khác',
};

export const MED_TIMINGS = ['Trước ăn', 'Sau ăn', 'Trong bữa ăn', 'Trước khi ngủ', 'Khi cần', 'Không quy định'];

export const itemTitle = (item) => (item.type === 'medicine' ? `Uống thuốc ${item.name}` : item.title);

export const itemSubtitle = (item) => {
  if (item.type === 'medicine') {
    return [item.dosage, item.timing].filter(Boolean).join(' · ');
  }
  return TASK_CATEGORIES[item.category] || 'Tác vụ';
};

export const itemKind = (item) => (item.type === 'medicine' ? 'medicine' : item.category || 'other');

export const sortByDateTime = (a, b) => {
  const ka = `${a.date || '9999'} ${a.time || '99:99'}`;
  const kb = `${b.date || '9999'} ${b.time || '99:99'}`;
  return ka.localeCompare(kb);
};

// ===== Thực đơn =====
export const MENU_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
export const MEALS = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Bữa phụ',
};
export const MEAL_KEYS = ['breakfast', 'lunch', 'snack', 'dinner'];

export const todayMenuDay = () => {
  const d = new Date().getDay(); // 0 = CN
  return MENU_DAYS[d === 0 ? 6 : d - 1];
};

/** Thu nhỏ ảnh tải lên để lưu gọn trong localStorage */
export const resizeImage = (file, max = 320) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
