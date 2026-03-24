import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'donor' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.register(form);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 400 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#0a0e1a', marginBottom: 16 }}>N</div>
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 800 }}>Join NGO Tracker</h1>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 24, fontSize: 20 }}>Create Account</h2>
          {error && <div style={{ background: 'rgba(247,90,90,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Full Name</label>
              <input placeholder="Ravi Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>I am a</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="donor">Donor</option>
                <option value="ngo">NGO / Organisation</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? <><span className="spinner" /> Creating...</> : 'Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 13 }}>
            Have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
