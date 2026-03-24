const BASE = 'http://localhost:8000';

function getToken() { return localStorage.getItem('ngo_token'); }

function headers(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function req(method, path, body) {
  const opts = { method, headers: headers(body !== undefined) };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

async function download(path, filename) {
  const res = await fetch(BASE + path, { headers: headers(false) });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  register: (d) => req('POST', '/register', d),
  login: async (email, password) => {
    const form = new URLSearchParams({ username: email, password });
    const res = await fetch(BASE + '/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },
  me: () => req('GET', '/me'),
  seed: () => req('POST', '/seed'),

  getProjects: () => req('GET', '/projects'),
  createProject: (d) => req('POST', '/projects', d),

  donate: (d) => req('POST', '/donations', d),
  myDonations: () => req('GET', '/donations/my'),
  projectDonations: (id) => req('GET', `/donations/project/${id}`),

  addExpense: (d) => req('POST', '/expenses', d),
  projectExpenses: (id) => req('GET', `/expenses/project/${id}`),

  dashboardSummary: () => req('GET', '/dashboard/summary'),
  projectDashboard: (id) => req('GET', `/dashboard/project/${id}`),

  auditTrail: () => req('GET', '/audit'),

  // Notifications
  getNotifications: () => req('GET', '/notifications'),
  getUnreadCount: () => req('GET', '/notifications/unread-count'),
  markRead: (id) => req('POST', `/notifications/${id}/read`),
  markAllRead: () => req('POST', '/notifications/read-all'),

  // CSV Exports
  exportDonations: () => download('/export/donations', 'donations.csv'),
  exportExpenses: () => download('/export/expenses', 'expenses.csv'),
  exportAudit: () => download('/export/audit', 'audit_trail.csv'),
  exportProjectReport: (id) => download(`/export/project/${id}/report`, `project_${id}_report.csv`),
};

// append these to existing api object — replace the closing }; with these lines first