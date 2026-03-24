# 🌱 Transparent NGO Funding Tracker

A full-stack web application for transparent NGO fund management. Donors can track exactly where their contributions go, and NGOs can record expenses with full accountability — backed by a blockchain-style immutable audit trail.

---

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Backend    | Python 3.10+, FastAPI          |
| Database   | SQLite (via SQLAlchemy ORM)    |
| Auth       | JWT (python-jose + passlib)    |
| Frontend   | React 18, Vite, React Router   |
| Styling    | Pure CSS (design system)       |

---

## Project Structure

```
ngo-tracker/
├── start.sh                   # One-command launcher (backend + frontend)
├── README.md
│
├── backend/
│   ├── main.py                # FastAPI app, all routes, JWT middleware
│   ├── database.py            # SQLite engine + session factory
│   ├── models.py              # SQLAlchemy ORM models
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── crud.py                # All DB operations + blockchain audit trail
│   └── requirements.txt
│
└── frontend/
    ├── index.html             # Vite HTML entry point
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx           # React DOM entry
        ├── App.jsx            # Router + ProtectedRoute
        ├── AuthContext.jsx    # JWT auth state (React Context)
        ├── api.js             # Typed fetch wrapper for all API calls
        ├── index.css          # Full design system (CSS variables, components)
        ├── components/
        │   └── Layout.jsx     # Collapsible sidebar navigation shell
        └── pages/
            ├── LoginPage.jsx          # Login + demo seed button
            ├── RegisterPage.jsx       # Donor / NGO registration
            ├── DashboardPage.jsx      # Global stats + project cards
            ├── ProjectsPage.jsx       # Project list + NGO create form
            ├── ProjectDetailPage.jsx  # Tabbed: overview / expenses / donors
            ├── DonatePage.jsx         # Quick-amount donation form
            ├── MyDonationsPage.jsx    # Donor personal history
            └── AuditPage.jsx         # Blockchain-style immutable ledger
```

### 1. Backend Setup

```bash
cd ngo-tracker/backend

# Create and activate virtual environment (recommended)
python -m venv venv

Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd ngo-tracker/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Demo Data

On the Login page, click **"Load Demo Data & Login"** to seed the database with:

- 1 NGO account: `ngo@greenearth.org` / `ngo123`
- 3 donor accounts: `ravi@gmail.com`, `priya@gmail.com`, `amit@gmail.com` (all password: `donor123`)
- 3 projects: School Education Fund, Clean Water Initiative, Women Empowerment
- Sample donations and expenses across all projects

---

## Features

### Donor
- Register/login as a donor
- Browse all NGO projects
- Donate with quick-select amounts or custom amount
- Leave a message with donation
- View personal donation history with project links
- See full spending transparency per project

### NGO
- Register/login as an NGO
- Create and manage projects with funding goals
- Record expenses against projects (validated against available balance)
- All actions logged immutably in the audit trail

### Transparency Dashboard
- Global stats: total donated, spent, remaining, donor count
- Per-project: goal progress, utilisation %, spending breakdown
- Visual progress bars for all metrics

### Audit Trail (Blockchain-style)
Every action in the system creates an audit log entry containing:
- Action type, actor, details, timestamp
- A SHA-256 hash chained to the previous entry's hash

Hash formula:
```
hash = SHA-256(prev_hash | action | details | timestamp)
```

This means if any historical record is altered, all subsequent hashes become invalid — making tampering immediately detectable. Click any audit entry to inspect its hash.

---

## API Endpoints

| Method | Endpoint                      | Description              | Auth Required |
|--------|-------------------------------|--------------------------|---------------|
| POST   | `/register`                   | Register user            | No            |
| POST   | `/token`                      | Login (get JWT)          | No            |
| GET    | `/me`                         | Get current user         | Yes           |
| POST   | `/seed`                       | Seed demo data           | No            |
| GET    | `/projects`                   | List all projects        | No            |
| POST   | `/projects`                   | Create project           | NGO only      |
| POST   | `/donations`                  | Make a donation          | Yes           |
| GET    | `/donations/my`               | My donation history      | Yes           |
| GET    | `/donations/project/{id}`     | Donations for project    | No            |
| POST   | `/expenses`                   | Add expense              | NGO only      |
| GET    | `/expenses/project/{id}`      | Expenses for project     | No            |
| GET    | `/dashboard/summary`          | Global dashboard stats   | No            |
| GET    | `/dashboard/project/{id}`     | Per-project dashboard    | No            |
| GET    | `/audit`                      | Full audit trail         | Yes           |

---

## Database Schema

```
users          → id, name, email, hashed_password, role, created_at
projects       → id, name, description, goal_amount, created_by, status, created_at
donations      → id, donor_id, project_id, amount, message, date
expenses       → id, project_id, purpose, amount, description, added_by, receipt_url, date
audit_logs     → id, action, entity_type, entity_id, actor_id, actor_name, details, timestamp, hash_chain
```

---

## Stretch Goals (Implemented)

- ✅ **Blockchain-style immutable ledger** — SHA-256 hash chaining on every audit entry
- ✅ **NGO vs Donor role system** — role-based UI and API access control
- ✅ **Balance validation** — server rejects expenses exceeding available funds
- ✅ **Spending visualisation** — per-expense breakdown with proportional bars

### To-do (not yet implemented)
- [ ] Email notifications to donors when funds are allocated
- [ ] NGO verification/approval system
- [ ] CSV export of audit trail
- [ ] Multi-currency support

---

## Running in Production

```bash
# Backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend
npm run build
# Serve the dist/ folder with nginx or any static host
```

For production, replace the `SECRET_KEY` in `main.py` with a long random string stored in an environment variable.
