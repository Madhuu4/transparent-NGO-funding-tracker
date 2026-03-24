import { useEffect, useState } from 'react';
import { api } from '../api';

function fdate(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TYPE_CONFIG = {
  donation:       { icon: '💚', color: '#00e5b0', label: 'Donation Confirmed' },
  expense_update: { icon: '🧾', color: '#ffb547', label: 'Fund Update' },
  goal_reached:   { icon: '🎯', color: '#7c5cfc', label: 'Goal Reached' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = () => api.getNotifications().then(setNotifs).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    setMarking(true);
    await api.markAllRead();
    load();
    setMarking(false);
  };

  const markOne = async (id) => {
    await api.markRead(id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: 1 } : x));
  };

  const unread = notifs.filter(n => !n.is_read).length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 6, height: 32, background: 'linear-gradient(180deg, #7c5cfc, #38bdf8)', borderRadius: 3 }} />
            <h1 style={{ fontSize: 32, fontWeight: 800 }}>Notifications</h1>
            {unread > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #ff5f87, #ff3e6c)', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                {unread} new
              </div>
            )}
          </div>
          <p style={{ color: 'var(--muted)', marginLeft: 18 }}>Email-style alerts for donations and fund updates</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAll} disabled={marking} style={{ fontSize: 13 }}>
            {marking ? <><span className="spinner" /> Marking...</> : '✓ Mark all as read'}
          </button>
        )}
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(124,92,252,0.07)', border: '1.5px solid rgba(124,92,252,0.2)', borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontSize: 20 }}>📧</span>
        <div>
          <strong style={{ color: '#7c5cfc' }}>Simulated Email Notifications</strong>
          <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
            In production these would be sent to your email. Here they are stored and shown in-app. Donors are notified on every donation and every expense recorded against their projects.
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total',    val: notifs.length,                            color: '#38bdf8' },
          { label: 'Unread',   val: unread,                                   color: '#ff5f87' },
          { label: 'Read',     val: notifs.filter(n => n.is_read).length,     color: '#00e5b0' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-head)', fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Notification list */}
      {notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔔</div>
          <p style={{ fontSize: 16 }}>No notifications yet</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Make a donation or wait for the NGO to record an expense</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifs.map(n => {
            const cfg = TYPE_CONFIG[n.type] || { icon: '🔔', color: '#5a7299', label: n.type };
            return (
              <div key={n.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${cfg.color}`,
                  background: n.is_read ? 'var(--surface)' : 'var(--surface2)',
                  opacity: n.is_read ? 0.75 : 1,
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => !n.is_read && markOne(n.id)}
                onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.borderColor = cfg.color; }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${cfg.color}15`, border: `1.5px solid ${cfg.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{cfg.icon}</div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
                          {cfg.label}
                        </span>
                        {!n.is_read && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: '#ff5f87', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>NEW</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginLeft: 16 }}>{fdate(n.created_at)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#e8f0ff' }}>{n.subject}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{n.body}</div>
                    {!n.is_read && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>Click to mark as read</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}