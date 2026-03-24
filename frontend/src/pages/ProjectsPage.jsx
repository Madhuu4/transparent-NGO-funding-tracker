import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', goal_amount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => Promise.all([
    api.getProjects().then(setProjects),
    api.dashboardSummary().then(setSummary),
  ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.createProject({ ...form, goal_amount: parseFloat(form.goal_amount) || 0 });
      setShowForm(false);
      setForm({ name: '', description: '', goal_amount: '' });
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const projectStats = summary?.projects || [];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Projects</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>All active NGO funding projects</p>
        </div>
        {user?.role === 'ngo' && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {/* Create project form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 24, borderColor: 'var(--accent)', border: '1px solid var(--accent)' }}>
          <h3 style={{ marginBottom: 20 }}>Create New Project</h3>
          {error && <div style={{ background: 'rgba(247,90,90,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Project Name *</label>
              <input placeholder="School Education Fund" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Goal Amount (₹)</label>
              <input type="number" placeholder="50000" value={form.goal_amount} onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Description</label>
              <textarea rows={3} placeholder="Describe the project and its goals..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Creating...</> : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {projects.map(p => {
          const stats = projectStats.find(s => s.id === p.id) || {};
          return (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-active">{p.status}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>{p.description}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>RAISED</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmt(stats.total_donated)}</div>
                  </div>
                  {p.goal_amount > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>GOAL</div>
                      <div style={{ fontWeight: 700 }}>{fmt(p.goal_amount)}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>SPENT</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent3)' }}>{fmt(stats.total_spent)}</div>
                  </div>
                </div>
                {p.goal_amount > 0 && stats.total_donated !== undefined && (
                  <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((stats.total_donated / p.goal_amount) * 100, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
