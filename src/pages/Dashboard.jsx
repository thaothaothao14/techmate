import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, PartyPopper } from 'lucide-react';
import { useApp, useNow } from '../store/AppContext';
import {
  calcAge,
  countdown,
  formatDateLong,
  greeting,
  itemKind,
  itemSubtitle,
  itemTitle,
  nowTimeStr,
  relativeDayLabel,
  sortByDateTime,
  todayStr,
  toDateTime,
} from '../store/utils';
import { Avatar, EmptyState, KindIcon, StatusBadge } from '../components/ui';

export default function Dashboard() {
  const { profile, items, setStatus } = useApp();
  const now = useNow(1000);
  const age = calcAge(profile.dob);
  const today = todayStr();

  const scheduled = items.filter((i) => i.date && i.time).sort(sortByDateTime);
  // Nhiệm vụ tiếp theo: mục chưa hoàn thành gần nhất (đang làm, hoặc chưa làm và chưa quá giờ quá lâu)
  const pending = scheduled.filter(
    (i) => (i.status === 'todo' || i.status === 'doing') && toDateTime(i.date, i.time) >= new Date(now.getTime() - 30 * 60000),
  );
  const next = pending[0];
  const upcoming = pending.slice(1, 5);

  const todayItems = scheduled.filter((i) => i.date === today);
  const doneToday = todayItems.filter((i) => i.status === 'done').length;

  return (
    <div className="page dashboard">
      <section className="hero card">
        <div className="hero-profile">
          <Avatar src={profile.avatar} size={84} className="avatar-ring" />
          <div>
            <p className="muted">{greeting(now)},</p>
            <h1 className="hero-name">{profile.name || 'Chưa đặt tên'}</h1>
            <p className="hero-meta">
              {age !== null ? `${age} tuổi` : 'Chưa có ngày sinh'}
              {profile.gender ? ` · ${profile.gender}` : ''}
            </p>
          </div>
        </div>
        <div className="hero-clock" aria-live="off">
          <span className="clock-time">
            {nowTimeStr(now)}
            <small>:{String(now.getSeconds()).padStart(2, '0')}</small>
          </span>
          <span className="clock-date">{formatDateLong(now)}</span>
        </div>
      </section>

      <section className="card next-card">
        <div className="section-title">
          <h2>
            <Clock3 size={20} /> Nhiệm vụ tiếp theo
          </h2>
          <span className="pill">
            Hôm nay: {doneToday}/{todayItems.length} đã xong
          </span>
        </div>
        {next ? (
          <div className="next-body">
            <KindIcon kind={itemKind(next)} size={28} />
            <div className="next-info">
              <strong className="next-title">{itemTitle(next)}</strong>
              <span className="muted">{itemSubtitle(next)}</span>
              <div className="next-time">
                <span className="time-big">{next.time}</span>
                <span className="muted">{relativeDayLabel(next.date)}</span>
                <span className="countdown">{countdown(toDateTime(next.date, next.time), now)}</span>
              </div>
            </div>
            <div className="next-actions">
              {next.status === 'todo' && (
                <button type="button" className="btn btn-soft" onClick={() => setStatus(next.id, 'doing')}>
                  Bắt đầu
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => setStatus(next.id, 'done')}>
                <CheckCircle2 size={18} /> Hoàn thành
              </button>
            </div>
          </div>
        ) : (
          <EmptyState icon={PartyPopper} title="Không còn nhiệm vụ nào sắp tới" text="Bạn có thể thêm lịch mới trong mục Lịch trình." />
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>
            <CalendarClock size={20} /> Lịch trình sắp tới
          </h2>
          <Link to="/lich-trinh" className="link">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        {upcoming.length ? (
          <ul className="upcoming">
            {upcoming.map((i) => (
              <li key={i.id}>
                <span className="up-time">
                  <b>{i.time}</b>
                  <small>{relativeDayLabel(i.date)}</small>
                </span>
                <KindIcon kind={itemKind(i)} size={18} />
                <span className="up-title">
                  <strong>{itemTitle(i)}</strong>
                  <small>{itemSubtitle(i)}</small>
                </span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Chưa có lịch trình nào khác.</p>
        )}
      </section>
    </div>
  );
}
