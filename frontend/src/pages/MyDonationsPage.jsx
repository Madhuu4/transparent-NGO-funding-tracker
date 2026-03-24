import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fdate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function MyDonationsPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myDonations().then(setDonations).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>My Donations</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>Track all your contributions</p>
        </div>
        <Link to="/donate">
          <button className="btn btn-primary">♡ Donate Again</button>
        </Link>
      </div>

      {donations.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>TOTAL DONATED</div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)' }}>{fmt(total)}</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--accent2)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>DONATIONS MADE</div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent2)' }}>{donations.length}</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--accent3)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>PROJECTS SUPPORTED</div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent3)' }}>
              {new Set(donations.map(d => d.project_id)).size}
            </div>
          </div>
        </div>
      )}

      {donations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
          <p style={{ marginBottom: 20 }}>You haven't donated yet</p>
          <Link to="/donate"><button className="btn btn-primary">Make your first donation</button></Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {donations.map(d => (
            <div key={d.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Link to={`/projects/${d.project_id}`} style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text)'}>
                  {d.project?.name}
                </Link>
                {d.message && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>"{d.message}"</div>}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Donated on {fdate(d.date)}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginLeft: 24 }}>
                {fmt(d.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
