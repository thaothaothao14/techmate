import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Bell, CalendarCheck, HeartPulse, LayoutDashboard, Salad, UserRound } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { calcAge } from '../store/utils';
import { Avatar, Toasts } from './ui';

export const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/lich-trinh', label: 'Lịch trình & Quản lý', short: 'Lịch trình', icon: CalendarCheck },
  { to: '/thong-bao', label: 'Thông báo', short: 'Thông báo', icon: Bell, badge: true },
  { to: '/dinh-duong', label: 'Dinh dưỡng', short: 'Dinh dưỡng', icon: Salad },
  { to: '/ho-so', label: 'Hồ sơ', short: 'Hồ sơ', icon: UserRound },
];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Techmate Care – Trang chủ">
      <span className="brand-mark">
        <HeartPulse size={20} strokeWidth={2.4} />
      </span>
      <span className="brand-text">
        Techmate <b>Care</b>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { profile, unreadCount } = useApp();
  const { pathname } = useLocation();
  const age = calcAge(profile.dob);

  // Cuộn lên đầu khi chuyển trang
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app-shell">
      {/* Sidebar máy tính / máy tính bảng */}
      <aside className="sidebar">
        <Brand />
        <nav className="side-nav" aria-label="Điều hướng chính">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className="side-link" title={label}>
              <Icon size={21} />
              <span className="side-label">{label}</span>
              {badge && unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </NavLink>
          ))}
        </nav>
        <Link to="/ho-so" className="side-profile" title="Hồ sơ người cao tuổi">
          <Avatar src={profile.avatar} size={42} />
          <span className="side-profile-text">
            <strong>{profile.name || 'Chưa đặt tên'}</strong>
            <small>{age !== null ? `${age} tuổi` : 'Chưa có ngày sinh'}</small>
          </span>
        </Link>
      </aside>

      {/* Header điện thoại */}
      <header className="mobile-header">
        <Brand />
        <Link to="/thong-bao" className="icon-btn bell" aria-label={`Thông báo, ${unreadCount} chưa đọc`}>
          <Bell size={22} />
          {unreadCount > 0 && <span className="dot-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>
      </header>

      <main className="content">
        <Outlet />
      </main>

      {/* Thanh điều hướng dưới cùng trên điện thoại */}
      <nav className="bottom-nav" aria-label="Điều hướng">
        {NAV_ITEMS.map(({ to, short, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className="bottom-link">
            <span className="bottom-icon">
              <Icon size={22} />
              {badge && unreadCount > 0 && <span className="dot-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </span>
            <span>{short}</span>
          </NavLink>
        ))}
      </nav>

      <Toasts />
    </div>
  );
}
