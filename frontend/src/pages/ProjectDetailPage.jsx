import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fdate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ purpose: '', amount: '', description: '', receipt_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  const load = () => api.projectDashboard(id).then(setData).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleExpense = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.addExpense({ project_id: parseInt(id), ...expForm, amount: parseFloat(expForm.amount) });
      setShowExpForm(false);
      setExpForm({ purpose: '', amount: '', description: '', receipt_url: '' });
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;
  if (!data) return <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--muted)' }}>Project not found</div>;

  const utilPct = data.total_donated > 0 ? Math.round((data.total_spent / data.total_donated) * 100) : 0;
  const goalPct = data.project.goal_amount > 0 ? Math.round((data.total_donated / data.project.goal_amount) * 100) : 0;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 8 }}>
        <Link to="/projects" style={{ fontSize: 13, color: 'var(--muted)' }}>← Projects</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>{data.project.name}</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4, maxWidth: 600 }}>{data.project.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user?.role === 'donor' && (
            <Link to="/donate" state={{ projectId: parseInt(id) }}>
              <button className="btn btn-primary">♡ Donate</button>
            </Link>
          )}
          {user?.role === 'ngo' && (
            <button className="btn btn-primary" onClick={() => setShowExpForm(s => !s)}>
              {showExpForm ? '✕ Cancel' : '+ Add Expense'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'DONATED', value: fmt(data.total_donated), color: 'var(--accent)' },
          { label: 'SPENT', value: fmt(data.total_spent), color: 'var(--accent3)' },
          { label: 'BALANCE', value: fmt(data.remaining), color: 'var(--accent2)' },
          { label: 'UTILISATION', value: utilPct + '%', color: utilPct > 80 ? 'var(--success)' : 'var(--muted)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-head)', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--muted)' }}>Funds utilised</span>
            <span>{fmt(data.total_spent)} of {fmt(data.total_donated)}</span>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${utilPct}%`, height: '100%', background: 'var(--accent3)', borderRadius: 6, transition: 'width 0.8s ease' }} />
          </div>
        </div>
        {data.project.goal_amount > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Goal progress</span>
              <span>{fmt(data.total_donated)} of {fmt(data.project.goal_amount)} ({goalPct}%)</span>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(goalPct, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 6, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Add expense form */}
      {showExpForm && (
        <div className="card fade-in" style={{ marginBottom: 24, borderColor: 'var(--accent3)', borderWidth: 2 }}>
          <h3 style={{ marginBottom: 16 }}>Record Expense</h3>
          {error && <div style={{ background: 'rgba(247,90,90,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <form onSubmit={handleExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Purpose *</label>
              <input placeholder="Books purchase" value={expForm.purpose} onChange={e => setExpForm(f => ({ ...f, purpose: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Amount (₹) *</label>
              <input type="number" placeholder="2000" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} required min="1" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Description</label>
              <input placeholder="Details about this expense" value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Receipt URL</label>
              <input placeholder="https://..." value={expForm.receipt_url} onChange={e => setExpForm(f => ({ ...f, receipt_url: e.target.value }))} />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : 'Record Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['overview', 'expenses', 'donors'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', padding: '10px 18px', fontSize: 14,
            color: tab === t ? 'var(--accent)' : 'var(--muted)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div className="fade-in">
          {data.expense_breakdown.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 0' }}>No expenses recorded yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.expense_breakdown.map((e, i) => (
                <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.purpose}</div>
                    {e.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{e.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{fdate(e.date)}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--accent3)' }}>{fmt(e.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Donors tab */}
      {tab === 'donors' && (
        <div className="fade-in">
          {data.donations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 0' }}>No donations yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.donations.map((d, i) => (
                <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.donor}</div>
                    {d.message && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>"{d.message}"</div>}
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{fdate(d.date)}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{fmt(d.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Spending Breakdown</h3>
              {data.expense_breakdown.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No expenses yet</p>
              ) : data.expense_breakdown.map((e, i) => {
                const pct = data.total_spent > 0 ? (e.amount / data.total_spent) * 100 : 0;
                const colors = ['var(--accent)', 'var(--accent3)', 'var(--accent2)', '#b06ef7', 'var(--success)'];
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{e.purpose}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(e.amount)}</span>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Donation Flow</h3>
              {data.donations.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No donations yet</p>
              ) : data.donations.slice(0, 6).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.donations.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 14 }}>
                  <span style={{ color: 'var(--muted)' }}>{d.donor}</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmt(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
