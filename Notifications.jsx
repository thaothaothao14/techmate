import { useState } from 'react';
import { BellOff, BellRing, CheckCheck, CheckCircle2, Dumbbell, Info, Mail, MailOpen, Pill, Stethoscope, Trash2, XCircle, CalendarClock } from 'lucide-react';
import { useApp, useNow } from '../store/AppContext';
import { formatDateTime, timeAgo } from '../store/utils';
import { ConfirmDialog, EmptyState, FilterChips, PageHeader } from '../components/ui';

const KIND_META = {
  medicine: { icon: Pill, label: 'Uống thuốc' },
  exercise: { icon: Dumbbell, label: 'Tập thể dục' },
  done: { icon: CheckCircle2, label: 'Hoàn thành' },
  checkup: { icon: Stethoscope, label: 'Tái khám' },
  missed: { icon: XCircle, label: 'Bỏ lỡ' },
  schedule: { icon: CalendarClock, label: 'Lịch trình' },
  system: { icon: Info, label: 'Hệ thống' },
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification, clearReadNotifications } = useApp();
  const now = useNow(30000);
  const [filter, setFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const list = notifications.filter((n) => (filter === 'unread' ? !n.read : filter === 'read' ? n.read : true));
  const readCount = notifications.length - unreadCount;

  return (
    <div className="page">
      <PageHeader
        title="Thông báo"
        subtitle="Thông báo tự động được tạo khi đến giờ thực hiện lịch trình (khi ứng dụng đang mở)."
        actions={
          <>
            <button type="button" className="btn btn-soft" onClick={markAllRead} disabled={!unreadCount}>
              <CheckCheck size={18} /> Đánh dấu đã đọc hết
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(true)} disabled={!readCount}>
              <Trash2 size={18} /> Xoá đã đọc
            </button>
          </>
        }
      />

      <section className="card">
        <FilterChips
          value={filter}
          onChange={setFilter}
          ariaLabel="Lọc thông báo"
          options={[
            { value: 'all', label: 'Tất cả', count: notifications.length },
            { value: 'unread', label: 'Chưa đọc', count: unreadCount },
            { value: 'read', label: 'Đã đọc', count: readCount },
          ]}
        />

        {list.length === 0 ? (
          <EmptyState icon={BellOff} title="Không có thông báo" text="Các thông báo mới sẽ xuất hiện tại đây." />
        ) : (
          <ul className="notif-list">
            {list.map((n) => {
              const meta = KIND_META[n.kind] || KIND_META.system;
              const Icon = meta.icon;
              return (
                <li key={n.id} className={`notif ${n.read ? 'read' : 'unread'}`}>
                  <button type="button" className="notif-main" onClick={() => markRead(n.id, true)} aria-label={n.read ? 'Thông báo đã đọc' : 'Đánh dấu đã đọc'}>
                    <span className={`notif-icon nk-${n.kind}`}>
                      <Icon size={20} />
                    </span>
                    <span className="notif-text">
                      <span className="notif-msg">{n.message}</span>
                      <span className="notif-meta">
                        <span className="notif-kind">{meta.label}</span>
                        <span title={formatDateTime(n.createdAt)}>{timeAgo(n.createdAt, now)}</span>
                        <span className="hide-sm">· {formatDateTime(n.createdAt)}</span>
                      </span>
                    </span>
                    {!n.read && <span className="unread-dot" aria-label="Chưa đọc" />}
                  </button>
                  <div className="notif-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => markRead(n.id, !n.read)}
                      aria-label={n.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                      title={n.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                    >
                      {n.read ? <Mail size={18} /> : <MailOpen size={18} />}
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => deleteNotification(n.id)} aria-label="Xoá thông báo" title="Xoá">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="footnote">
        <BellRing size={16} /> Lịch sử lưu tối đa 200 thông báo gần nhất trên thiết bị này.
      </p>

      <ConfirmDialog
        open={confirmClear}
        title="Xoá thông báo đã đọc"
        message={`Xoá ${readCount} thông báo đã đọc khỏi lịch sử? Thông báo chưa đọc vẫn được giữ lại.`}
        onConfirm={clearReadNotifications}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
