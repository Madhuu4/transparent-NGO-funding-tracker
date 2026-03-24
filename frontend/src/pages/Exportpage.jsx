import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

function ExportCard({ icon, title, desc, color, onExport, loading }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
      <button
        className="btn btn-secondary"
        style={{ width: '100%', justifyContent: 'center', borderColor: color, color }}
        onClick={onExport}
        disabled={loading}
      >
        {loading ? <><span className="spinner" /> Exporting...</> : '⬇ Download CSV'}
      </button>
    </div>
  );
}

export default function ExportPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadingKey, setLoadingKey] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => { api.getProjects().then(setProjects); }, []);

  const doExport = async (key, fn) => {
    setLoadingKey(key); setSuccess('');
    try {
      await fn();
      setSuccess(`${key} exported successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 6, height: 32, background: 'linear-gradient(180deg, #00e5b0, #ffb547)', borderRadius: 3 }} />
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Export Data</h1>
        </div>
        <p style={{ color: 'var(--muted)', marginLeft: 18 }}>Download records as CSV files — open in Excel, Google Sheets or any spreadsheet app</p>
      </div>

      {success && (
        <div style={{ background: 'rgba(0,229,176,0.1)', border: '1.5px solid rgba(0,229,176,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, color: '#00e5b0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }} className="fade-in">
          ✅ {success}
        </div>
      )}

      {/* General exports */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>General Reports</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 36 }}>
        <ExportCard
          icon="💚" title="Donations Report" color="#00e5b0"
          desc={user?.role === 'donor' ? "All your personal donations with project details, amounts and dates." : "All donations received across every project with donor details."}
          loading={loadingKey === 'Donations'}
          onExport={() => doExport('Donations', api.exportDonations)}
        />
        <ExportCard
          icon="🧾" title="Expenses Report" color="#ffb547"
          desc="All expenses recorded by the NGO across all projects with purposes and amounts."
          loading={loadingKey === 'Expenses'}
          onExport={() => doExport('Expenses', api.exportExpenses)}
        />
        <ExportCard
          icon="⛓️" title="Audit Trail" color="#7c5cfc"
          desc="Full immutable ledger of every action — donations, expenses, registrations — with blockchain hashes."
          loading={loadingKey === 'Audit'}
          onExport={() => doExport('Audit', api.exportAudit)}
        />
      </div>

      {/* Per-project reports */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Per-Project Reports</h2>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
        Each report includes the project summary, all donations, and all expenses in a single CSV file.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {projects.map((p, i) => {
          const colors = ['#00e5b0', '#7c5cfc', '#ffb547', '#38bdf8', '#ff5f87'];
          const c = colors[i % colors.length];
          const key = `project_${p.id}`;
          return (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${c}` }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c}15`, border: `1.5px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📁</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{p.description?.slice(0, 60)}...</div>
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ flexShrink: 0, marginLeft: 20, borderColor: c, color: c, fontSize: 13 }}
                onClick={() => doExport(key, () => api.exportProjectReport(p.id))}
                disabled={loadingKey === key}
              >
                {loadingKey === key ? <><span className="spinner" /> Exporting...</> : '⬇ Export Report'}
              </button>
            </div>
          );
        })}
      </div>

      {/* How to open */}
      <div style={{ marginTop: 32, background: 'rgba(56,189,248,0.06)', border: '1.5px solid rgba(56,189,248,0.2)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 10, fontSize: 14 }}>📊 How to open CSV files</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
          <strong style={{ color: 'var(--text2)' }}>Excel:</strong> Open Excel → File → Open → select the CSV file<br />
          <strong style={{ color: 'var(--text2)' }}>Google Sheets:</strong> sheets.google.com → File → Import → Upload the CSV<br />
          <strong style={{ color: 'var(--text2)' }}>Numbers (Mac):</strong> Double-click the CSV file
        </div>
      </div>
    </div>
  );
}