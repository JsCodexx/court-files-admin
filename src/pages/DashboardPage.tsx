import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/', label: 'Overview', end: true, icon: '◈' },
  { to: '/users', label: 'Users', icon: '👤' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/manual-payments', label: 'Manual pay', icon: '🏦' },
  { to: '/subscriptions', label: 'Subscriptions', icon: '⏱' },
  { to: '/plans', label: 'Pricing', icon: '◆' },
  { to: '/revenue', label: 'Revenue', icon: '📈' },
];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const current =
    nav.find((item) =>
      item.end
        ? location.pathname === '/' || location.pathname === ''
        : location.pathname.startsWith(item.to)
    )?.label ?? 'Dashboard';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden>
            CF
          </span>
          <div>
            <p className="sidebar__title">Court Files</p>
            <p className="sidebar__tag">Superadmin</p>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'nav-item nav-item--active' : 'nav-item'
              }
            >
              <span className="nav-item__icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar" aria-hidden>
              {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
            </span>
            <div className="sidebar__user-text">
              <span className="sidebar__user-name">{user?.name || 'Admin'}</span>
              <span className="sidebar__user-email">{user?.email}</span>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <header className="mobile-topbar">
          <span className="mobile-topbar__title">{current}</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
