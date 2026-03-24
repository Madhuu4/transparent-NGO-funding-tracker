import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../api';

const NAV_DONOR = [
  { to: '/',              label: 'Dashboard',     icon: '◈' },
  { to: '/projects',      label: 'Projects',      icon: '◉' },
  { to: '/donate',        label: 'Donate',        icon: '♡' },
  { to: '/my-donations',  label: 'My Donations',  icon: '◎' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/export',        label: 'Export',        icon: '⬇' },
  { to: '/audit',         label: 'Audit Trail',   icon: '⊞' },
];
const NAV_NGO = [
  { to: '/',         label: 'Dashboard',      icon: '◈' },
  { to: '/projects', label: 'Manage Projects',icon: '◉' },
  { to: '/export',   label: 'Export',         icon: '⬇' },
  { to: '/audit',    label: 'Audit Trail',    icon: '⊞' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const nav = user?.role === 'ngo' ? NAV_NGO : NAV_DONOR;

  useEffect(() => {
    if (user?.role === 'donor') {
      api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {});
      const interval = setInterval(() => {
        api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: 'linear-gradient(180deg, #0c1428 0%, #101c35 100%)',
        borderRight: '1.5px solid #1f3060',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 100, overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1f3060', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'linear-gradient(135deg, #00e5b0, #7c5cfc)',
            borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, fontWeight: 900,
            color: 'white', boxShadow: '0 4px 12px rgba(0,229,176,0.3)',
          }}>🌱</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15, color: '#e8f0ff', whiteSpace: 'nowrap' }}>NGO Tracker</div>
              <div style={{ fontSize: 10, color: '#5a7299', whiteSpace: 'nowrap', marginTop: 1 }}>Transparent Funding</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
          {nav.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: '9px', marginBottom: 4,
              fontSize: 14, fontWeight: 500,
              color: isActive ? '#00e5b0' : '#5a7299',
              background: isActive ? 'linear-gradient(90deg, rgba(0,229,176,0.12), transparent)' : 'transparent',
              borderLeft: isActive ? '3px solid #00e5b0' : '3px solid transparent',
              textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
              position: 'relative',
            })}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {!collapsed && label}
              {/* Unread badge on notifications */}
              {to === '/notifications' && unread > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'linear-gradient(135deg, #ff5f87, #ff3e6c)',
                  color: 'white', borderRadius: 10, padding: '1px 7px',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #1f3060' }}>
          {!collapsed && (
            <div style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid #1f3060' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f0ff' }}>{user?.name}</div>
              <div style={{ marginTop: 4 }}>
                <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}
            onClick={() => { logout(); navigate('/login'); }}>
            <span>⏻</span>{!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Toggle */}
      <button onClick={() => setCollapsed(c => !c)} style={{
        position: 'fixed', left: collapsed ? 50 : 226, top: 22, zIndex: 200,
        background: '#162040', border: '1.5px solid #1f3060', borderRadius: 6,
        width: 24, height: 24, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 11, color: '#5a7299',
        transition: 'left 0.25s', cursor: 'pointer',
      }}>{collapsed ? '›' : '‹'}</button>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.25s', padding: '36px 40px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}