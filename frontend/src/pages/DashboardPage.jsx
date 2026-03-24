import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

function StatCard({ label, value, sub, colorClass, icon }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 26, fontFamily: 'var(--font-head)', fontWeight: 800 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, cls }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="progress-track" style={{ height: 7, marginTop: 8 }}>
      <div className={`progress-fill ${cls}`} style={{ width: `${pct}%`, height: '100%' }} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.dashboardSummary().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 6, height: 32, background: 'linear-gradient(180deg, #00e5b0, #7c5cfc)', borderRadius: 3 }} />
          <h1 style={{ fontSize: 34, fontWeight: 800 }}>Dashboard</h1>
        </div>
        <p style={{ color: 'var(--muted)', marginLeft: 18 }}>Welcome back, <strong style={{ color: '#e8f0ff' }}>{user?.name}</strong> — here's the live funding picture.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard label="Total Donated"   value={fmt(data?.total_donated)}   colorClass="green"  icon="💚" />
        <StatCard label="Total Spent"     value={fmt(data?.total_spent)}     colorClass="gold"   icon="🧾" />
        <StatCard label="Total Remaining" value={fmt(data?.total_remaining)} colorClass="sky"    icon="🏦" />
        <StatCard label="Total Donors"    value={data?.total_donors}         colorClass="violet" icon="👥" sub="unique contributors" />
        <StatCard label="Active Projects" value={data?.total_projects}       colorClass="rose"   icon="📁" />
      </div>

      {/* Projects */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Project Breakdown</h2>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {data?.projects?.map((p, i) => {
          const colors = [
            { bar: 'progress-green', accent: '#00e5b0' },
            { bar: 'progress-violet', accent: '#7c5cfc' },
            { bar: 'progress-gold', accent: '#ffb547' },
          ];
          const c = colors[i % colors.length];
          return (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', height: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 0 20px ${c.accent}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: '#e8f0ff' }}>{p.name}</div>
                  <span className="badge badge-active">{p.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'DONATED', val: fmt(p.total_donated), color: '#00e5b0' },
                    { label: 'SPENT',   val: fmt(p.total_spent),   color: '#ffb547' },
                    { label: 'BALANCE', val: fmt(p.remaining),     color: '#38bdf8' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontWeight: 800, color: s.color, fontSize: 15, marginTop: 3, fontFamily: 'var(--font-head)' }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                    <span>Fund utilisation</span>
                    <span style={{ color: c.accent, fontWeight: 600 }}>
                      {p.total_donated > 0 ? Math.round((p.total_spent / p.total_donated) * 100) : 0}%
                    </span>
                  </div>
                  <ProgressBar value={p.total_spent} max={p.total_donated} cls={c.bar} />
                </div>

                {p.goal_amount > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      <span>Goal progress</span>
                      <span>{Math.round((p.total_donated / p.goal_amount) * 100)}% of {fmt(p.goal_amount)}</span>
                    </div>
                    <ProgressBar value={p.total_donated} max={p.goal_amount} cls="progress-green" />
                  </div>
                )}

                <div style={{ marginTop: 14, display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span>👥 {p.donor_count} donors</span>
                  <span>🧾 {p.expense_count} expenses</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}