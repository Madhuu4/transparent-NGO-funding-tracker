import { useEffect, useState } from 'react';
import { api } from '../api';

function fdate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const ACTION_COLORS = {
  DONATION_MADE: 'var(--accent)',
  EXPENSE_ADDED: 'var(--accent3)',
  PROJECT_CREATED: 'var(--accent2)',
  USER_REGISTERED: '#b06ef7',
};

const ACTION_ICONS = {
  DONATION_MADE: '💚',
  EXPENSE_ADDED: '🧾',
  PROJECT_CREATED: '📁',
  USER_REGISTERED: '👤',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.auditTrail().then(setLogs).finally(() => setLoading(false));
  }, []);

  const actionTypes = ['ALL', ...Array.from(new Set(logs.map(l => l.action)))];
  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.action === filter);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Audit Trail</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>
          Immutable, blockchain-style ledger of every transaction. Each entry is SHA-256 hashed and chained to the previous.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
      }}>
        <span style={{ fontSize: 20 }}>⛓️</span>
        <div>
          <strong style={{ color: 'var(--accent2)' }}>Blockchain-style integrity</strong>
          <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
            Every record includes a SHA-256 hash derived from its content and the previous entry's hash.
            Any tampering would break the chain and be immediately detectable.
          </span>
        </div>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {actionTypes.map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '6px 14px' }}>
            {type === 'ALL' ? 'All Events' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {Object.entries(ACTION_ICONS).map(([action, icon]) => {
          const count = logs.filter(l => l.action === action).length;
          return (
            <div key={action} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${ACTION_COLORS[action]}` }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 800, color: ACTION_COLORS[action] }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{action.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      {/* Log entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.map((log, i) => {
          const isExpanded = expanded === log.id;
          const color = ACTION_COLORS[log.action] || 'var(--muted)';
          const icon = ACTION_ICONS[log.action] || '◉';

          return (
            <div key={log.id} style={{ display: 'flex', gap: 0 }}>
              {/* Chain line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: `${color}18`,
                  border: `2px solid ${color}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1,
                  marginTop: i === 0 ? 20 : 0,
                }}>{icon}</div>
                {i < filtered.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 16 }} />
                )}
              </div>

              {/* Card */}
              <div style={{ flex: 1, paddingBottom: 12, paddingLeft: 12, paddingTop: i === 0 ? 8 : 0 }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  onClick={() => setExpanded(isExpanded ? null : log.id)}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                          color, background: `${color}15`, padding: '2px 8px',
                          borderRadius: 4,
                        }}>{log.action.replace(/_/g, ' ')}</span>
                        {log.actor_name && (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>by <strong style={{ color: 'var(--text)' }}>{log.actor_name}</strong></span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)' }}>{log.details}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginLeft: 16, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fdate(log.timestamp)}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>#{log.id}</span>
                    </div>
                  </div>

                  {/* Expanded hash */}
                  {isExpanded && (
                    <div className="fade-in" style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12 }}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ color: 'var(--muted)' }}>Entry ID:  </span>
                          <span style={{ color: 'var(--text)' }}>{log.id}</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ color: 'var(--muted)' }}>Entity:    </span>
                          <span style={{ color: 'var(--accent2)' }}>{log.entity_type} #{log.entity_id}</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ color: 'var(--muted)' }}>Timestamp: </span>
                          <span style={{ color: 'var(--text)' }}>{log.timestamp}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: 'var(--muted)', flexShrink: 0 }}>SHA-256:   </span>
                          <span style={{
                            color: 'var(--accent)', wordBreak: 'break-all',
                            background: 'rgba(0,212,170,0.06)',
                            padding: '2px 8px', borderRadius: 4,
                          }}>{log.hash_chain}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                        This hash is computed from: <code style={{ color: 'var(--accent2)' }}>prev_hash | action | details | timestamp</code>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          No audit logs yet
        </div>
      )}
    </div>
  );
}
