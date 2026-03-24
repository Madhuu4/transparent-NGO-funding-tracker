import { useEffect, useState } from 'react';
import { api } from '../api';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

const TEMPLATES = [
  {
    label: 'Monthly Progress Update',
    subject: 'Monthly Progress Update — NGO Funding Tracker',
    message: `Dear Donor,

We wanted to share a quick update on the progress of our projects this month. Thanks to your generous support, we have been able to make significant strides towards our goals.

Your contribution is directly making a difference in the lives of the people we serve. We will continue to keep you informed as we allocate funds and record expenses.

Thank you for being part of this journey with us.

With gratitude,
GreenEarth NGO`
  },
  {
    label: 'Goal Reached Announcement',
    subject: '🎯 Funding Goal Reached! Thank You!',
    message: `Dear Supporter,

We are thrilled to announce that we have reached our funding goal for this project! This would not have been possible without your generous contribution.

The funds are now being allocated and work is already underway. You can track every rupee spent on the project dashboard — full transparency is our promise to you.

Thank you from the bottom of our hearts.

Warm regards,
GreenEarth NGO`
  },
  {
    label: 'Thank You Note',
    subject: 'A heartfelt thank you from GreenEarth NGO',
    message: `Dear Donor,

We just wanted to take a moment to express our sincere gratitude for your continued support. Every donation, big or small, helps us move closer to creating a better world.

Your trust in our mission means everything to us, and we are committed to using every rupee with the utmost transparency and care.

Thank you for believing in us.

With love,
GreenEarth NGO`
  },
];

export default function EmailCenterPage() {
  const [projects, setProjects] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null);
  const [form, setForm] = useState({ project_id: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);

  useEffect(() => {
    api.getProjects().then(setProjects);
    api.getEmailStatus().then(setEmailStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.project_id) {
      setLoadingDonors(true);
      api.getProjectDonors(parseInt(form.project_id))
        .then(setDonors)
        .finally(() => setLoadingDonors(false));
    } else {
      setDonors([]);
    }
  }, [form.project_id]);

  const applyTemplate = (t) => {
    setForm(f => ({ ...f, subject: t.subject, message: t.message }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Subject and message are required'); return;
    }
    setSending(true); setError(''); setResult(null);
    try {
      const payload = {
        subject: form.subject,
        message: form.message,
        project_id: form.project_id ? parseInt(form.project_id) : null,
      };
      const res = await api.broadcastEmail(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 6, height: 32, background: 'linear-gradient(180deg, #7c5cfc, #38bdf8)', borderRadius: 3 }} />
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Email Center</h1>
        </div>
        <p style={{ color: 'var(--muted)', marginLeft: 18 }}>Send real emails to your donors directly from the NGO dashboard</p>
      </div>

      {/* Email config status */}
      {emailStatus && (
        <div style={{
          background: emailStatus.configured ? 'rgba(0,229,176,0.07)' : 'rgba(255,181,71,0.07)',
          border: `1.5px solid ${emailStatus.configured ? 'rgba(0,229,176,0.25)' : 'rgba(255,181,71,0.25)'}`,
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 22 }}>{emailStatus.configured ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontWeight: 700, color: emailStatus.configured ? '#00e5b0' : '#ffb547', marginBottom: 4 }}>
              {emailStatus.configured ? 'Gmail SMTP Active' : 'Email Not Configured'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              {emailStatus.configured
                ? `Sending from: ${emailStatus.email_user}. Donors will receive real emails.`
                : <>
                    Set environment variables to enable real email sending:<br />
                    <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: '#ffb547', fontSize: 12 }}>
                      NGO_EMAIL_USER=your@gmail.com
                    </code>
                    {' '}
                    <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: '#ffb547', fontSize: 12 }}>
                      NGO_EMAIL_PASS=your_app_password
                    </code>
                    <br />
                    <span style={{ color: '#5a7299' }}>In-app notifications are still sent to donors even without email configured.</span>
                  </>
              }
            </div>
            {!emailStatus.configured && (
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#38bdf8' }}>
                → Get a Gmail App Password ↗
              </a>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Compose form */}
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📨 Compose Email</h2>

          {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

          {result && (
            <div style={{ background: 'rgba(0,229,176,0.08)', border: '1.5px solid rgba(0,229,176,0.25)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', marginBottom: 16 }} className="fade-in">
              <div style={{ fontWeight: 700, color: '#00e5b0', marginBottom: 8 }}>✅ Sent Successfully!</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
                <strong style={{ color: '#e8f0ff' }}>{result.total}</strong> donors notified in-app<br />
                {result.emails_configured
                  ? <><strong style={{ color: '#e8f0ff' }}>{result.sent}</strong> real emails sent</>
                  : <span>Enable Gmail SMTP to send real emails too</span>
                }
              </div>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Recipient */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Send To
              </label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                <option value="">All Donors (every project)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} donors only</option>)}
              </select>
              {/* Donor preview */}
              {form.project_id && (
                <div style={{ marginTop: 8 }}>
                  {loadingDonors ? (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}><span className="spinner" style={{ width: 12, height: 12 }} /> Loading donors...</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {donors.map(d => (
                        <span key={d.email} style={{ background: 'rgba(0,229,176,0.1)', border: '1px solid rgba(0,229,176,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#00e5b0' }}>
                          {d.name} &lt;{d.email}&gt;
                        </span>
                      ))}
                      {donors.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>No donors for this project yet</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</label>
              <input placeholder="e.g. Monthly Progress Update" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
            </div>

            {/* Message */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
              <textarea rows={10} placeholder="Write your message to donors here..." value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                style={{ resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.7 }} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px', fontSize: 15 }} disabled={sending}>
              {sending ? <><span className="spinner" /> Sending...</> : '📧 Send Email to Donors'}
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Templates */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TEMPLATES.map((t, i) => (
                <button key={i} className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: 13, padding: '10px 14px', textAlign: 'left' }}
                  onClick={() => applyTemplate(t)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ background: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.2)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 12 }}>How it works</h3>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
              <div>📬 Donors receive <strong style={{ color: '#e8f0ff' }}>in-app notifications</strong> immediately</div>
              <div>📧 Real emails sent via <strong style={{ color: '#e8f0ff' }}>Gmail SMTP</strong> if configured</div>
              <div>📋 Every broadcast is <strong style={{ color: '#e8f0ff' }}>logged in Audit Trail</strong></div>
              <div>🎯 Target <strong style={{ color: '#e8f0ff' }}>specific project donors</strong> or all donors</div>
            </div>
          </div>

          {/* Gmail setup */}
          {!emailStatus?.configured && (
            <div className="card" style={{ background: 'rgba(124,92,252,0.05)', borderColor: 'rgba(124,92,252,0.2)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7c5cfc', marginBottom: 12 }}>Enable Real Emails</h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
                1. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#7c5cfc' }}>Google App Passwords ↗</a><br />
                2. Create a password for "Mail"<br />
                3. In your backend terminal run:<br />
                <code style={{ display: 'block', background: '#0c1428', padding: '8px 10px', borderRadius: 6, marginTop: 6, color: '#00e5b0', fontSize: 11, lineHeight: 1.8 }}>
                  set NGO_EMAIL_USER=you@gmail.com<br />
                  set NGO_EMAIL_PASS=xxxx xxxx xxxx xxxx
                </code>
                4. Restart the backend server
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}