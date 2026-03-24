import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function DonatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project_id: location.state?.projectId?.toString() || '',
    amount: '',
    message: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => { api.getProjects().then(setProjects); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await api.donate({ ...form, project_id: parseInt(form.project_id), amount: parseFloat(form.amount) });
      setSuccess(res);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (success) {
    const proj = projects.find(p => p.id === success.project_id);
    return (
      <div className="fade-in" style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Thank You!</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Your donation of <strong style={{ color: 'var(--accent)' }}>{fmt(success.amount)}</strong> to <strong>{proj?.name}</strong> has been recorded.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/projects/${success.project_id}`)}>View Project</button>
          <button className="btn btn-secondary" onClick={() => { setSuccess(null); setForm({ project_id: '', amount: '', message: '' }); }}>Donate Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Make a Donation</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>100% of your contribution goes directly to the project</p>

      <div className="card">
        {error && <div style={{ background: 'rgba(247,90,90,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Select Project *</label>
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} required>
              <option value="">Choose a project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Amount (₹) *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} type="button" className={`btn ${form.amount === String(a) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 13, padding: '6px 14px' }}
                  onClick={() => setForm(f => ({ ...f, amount: String(a) }))}>
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <input type="number" placeholder="Or enter custom amount" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="1" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Message (optional)</label>
            <textarea rows={3} placeholder="Leave a message of support..." value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>

          {form.amount && parseFloat(form.amount) > 0 && (
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>You are donating </span>
              <strong style={{ color: 'var(--accent)', fontSize: 18 }}>{fmt(parseFloat(form.amount) || 0)}</strong>
              {form.project_id && <span style={{ fontSize: 14, color: 'var(--muted)' }}> to {projects.find(p => String(p.id) === form.project_id)?.name}</span>}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px 24px', fontSize: 16 }} disabled={saving}>
            {saving ? <><span className="spinner" /> Processing...</> : '♡ Donate Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
