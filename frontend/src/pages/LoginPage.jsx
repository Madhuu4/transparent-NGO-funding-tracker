import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const seedAndLogin = async () => {
    setLoading(true);
    try { await api.seed(); await login('madhumitha@gmail.com', 'donor123'); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(124,92,252,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 70% 80%, rgba(0,229,176,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: 420 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #00e5b0, #7c5cfc)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 900, color: 'white',
            boxShadow: '0 8px 32px rgba(0,229,176,0.3)',
          }}>🌱</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, background: 'linear-gradient(135deg, #00e5b0, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NGO Tracker</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Transparent funding for a better world</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #101c35, #162040)', border: '1.5px solid #2a3f7a' }}>
          <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 700 }}>Sign In</h2>
          {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }} disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 13 }}>
            No account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register</Link>
          </div>
        </div>

        {/* Demo */}
        <div style={{ marginTop: 14, background: 'rgba(0,229,176,0.05)', border: '1.5px solid rgba(0,229,176,0.2)', borderRadius: 'var(--radius)', padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            🚀 <strong style={{ color: '#e8f0ff' }}>Quick Demo</strong> — Seed sample data and auto-login as a donor
          </p>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={seedAndLogin} disabled={loading}>
            {loading ? <><span className="spinner" /> Loading...</> : 'Load Demo Data & Login'}
          </button>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', lineHeight: 2, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <span style={{ color: '#ffb547', fontWeight: 600 }}>NGO:</span> ngo@greenearth.org / ngo123<br />
            <span style={{ color: '#00e5b0', fontWeight: 600 }}>Donor:</span> madhumitha@gmail.com / donor123
          </div>
        </div>
      </div>
    </div>
  );
}