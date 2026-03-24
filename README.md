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

---





