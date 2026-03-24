from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import models, schemas, crud
from database import engine, get_db
import email_service
import csv, io

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NGO Funding Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "ngo-tracker-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    return user


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(user.password)
    return crud.create_user(db, user, hashed)


@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name}


@app.get("/me", response_model=schemas.UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user


# ── Projects ──────────────────────────────────────────────────────────────────

@app.get("/projects", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return crud.get_projects(db)


@app.post("/projects", response_model=schemas.ProjectOut)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can create projects")
    return crud.create_project(db, project, current_user.id)


# ── Donations ─────────────────────────────────────────────────────────────────

@app.post("/donations", response_model=schemas.DonationOut)
def donate(donation: schemas.DonationCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = crud.get_project(db, donation.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    result = crud.create_donation(db, donation, current_user.id)

    # In-app notification
    crud.create_notification(db, current_user.id, "donation",
        f"Donation confirmed — ₹{donation.amount} to {project.name}",
        f"Your donation of ₹{donation.amount} to '{project.name}' was recorded successfully.")

    # Real email
    email_service.send_donation_confirmation(
        current_user.email, current_user.name, project.name, donation.amount)

    return result


@app.get("/donations/my", response_model=List[schemas.DonationOut])
def my_donations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_donations_by_donor(db, current_user.id)


@app.get("/donations/project/{project_id}", response_model=List[schemas.DonationOut])
def project_donations(project_id: int, db: Session = Depends(get_db)):
    return crud.get_donations_by_project(db, project_id)


# ── Expenses ──────────────────────────────────────────────────────────────────

@app.post("/expenses", response_model=schemas.ExpenseOut)
def add_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can add expenses")
    project = crud.get_project(db, expense.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    total_donated = crud.get_project_total_donated(db, expense.project_id)
    total_spent = crud.get_project_total_spent(db, expense.project_id)
    if total_spent + expense.amount > total_donated:
        raise HTTPException(status_code=400, detail="Expense exceeds available balance")
    result = crud.create_expense(db, expense, current_user.id)

    remaining = total_donated - total_spent - expense.amount

    # In-app notify + real email to each donor
    donations = crud.get_donations_by_project(db, expense.project_id)
    seen = set()
    for d in donations:
        crud.create_notification(db, d.donor_id, "expense_update",
            f"Fund update: {project.name}",
            f"₹{expense.amount} was spent on '{expense.purpose}'. Remaining balance: ₹{remaining:,.0f}")
        if d.donor.email not in seen:
            seen.add(d.donor.email)
            email_service.send_expense_update(
                d.donor.email, d.donor.name,
                project.name, expense.purpose, expense.amount, remaining)

    return result


@app.get("/expenses/project/{project_id}", response_model=List[schemas.ExpenseOut])
def project_expenses(project_id: int, db: Session = Depends(get_db)):
    return crud.get_expenses_by_project(db, project_id)


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db)


@app.get("/dashboard/project/{project_id}")
def project_dashboard(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.get_project_dashboard(db, project_id)


# ── Audit Trail ───────────────────────────────────────────────────────────────

@app.get("/audit", response_model=List[schemas.AuditOut])
def audit_trail(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_audit_trail(db)


# ── Notifications ─────────────────────────────────────────────────────────────

@app.get("/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_notifications(db, current_user.id)


@app.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    crud.mark_notification_read(db, notif_id, current_user.id)
    return {"message": "Marked as read"}


@app.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    crud.mark_all_notifications_read(db, current_user.id)
    return {"message": "All marked as read"}


@app.get("/notifications/unread-count")
def unread_count(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return {"count": crud.get_unread_count(db, current_user.id)}


# ── NGO Email Broadcast ───────────────────────────────────────────────────────

class BroadcastRequest(BaseModel):
    project_id: Optional[int] = None   # None = all donors
    subject: str
    message: str


@app.post("/email/broadcast")
def broadcast_email(req: BroadcastRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can send broadcasts")

    if req.project_id:
        donations = crud.get_donations_by_project(db, req.project_id)
        emails = list(set((d.donor.email, d.donor.name, d.donor_id) for d in donations))
    else:
        all_donations = db.query(models.Donation).all()
        seen = {}
        for d in all_donations:
            seen[d.donor.email] = (d.donor.email, d.donor.name, d.donor_id)
        emails = list(seen.values())

    if not emails:
        raise HTTPException(status_code=400, detail="No donors found to email")

    # Save in-app notification for each donor
    for email, name, donor_id in emails:
        crud.create_notification(db, donor_id, "ngo_broadcast", req.subject, req.message)

    # Send real emails
    to_list = [e[0] for e in emails]
    results = email_service.send_ngo_broadcast(to_list, req.subject, req.message, current_user.name)

    # Audit log
    crud._audit(db, "EMAIL_BROADCAST", "broadcast", 0, current_user.id, current_user.name,
        f"Broadcast '{req.subject}' sent to {len(to_list)} donors")

    return {
        "total": len(to_list),
        "sent": len(results["sent"]),
        "failed": len(results["failed"]),
        "emails_configured": email_service._is_configured(),
        "message": f"Notified {len(to_list)} donors in-app. Emails sent: {len(results['sent'])}"
    }


@app.get("/email/config-status")
def email_config_status(current_user=Depends(get_current_user)):
    return email_service.get_email_config_status()


@app.get("/email/project-donors/{project_id}")
def get_project_donor_list(project_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "ngo":
        raise HTTPException(status_code=403, detail="NGO only")
    donations = crud.get_donations_by_project(db, project_id)
    seen = {}
    for d in donations:
        seen[d.donor.email] = {"name": d.donor.name, "email": d.donor.email}
    return list(seen.values())


# ── CSV Export ────────────────────────────────────────────────────────────────

@app.get("/export/donations")
def export_donations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    donations = crud.get_donations_by_donor(db, current_user.id) if current_user.role == "donor" else db.query(models.Donation).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Donation ID", "Donor Name", "Donor Email", "Project", "Amount (INR)", "Message", "Date"])
    for d in donations:
        writer.writerow([d.id, d.donor.name, d.donor.email, d.project.name, d.amount, d.message or "", d.date.strftime("%Y-%m-%d %H:%M")])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=donations_{datetime.now().strftime('%Y%m%d')}.csv"})


@app.get("/export/expenses")
def export_expenses(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    expenses = db.query(models.Expense).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Expense ID", "Project", "Purpose", "Amount (INR)", "Description", "Added By", "Date"])
    for e in expenses:
        writer.writerow([e.id, e.project.name, e.purpose, e.amount, e.description or "", e.added_by_user.name, e.date.strftime("%Y-%m-%d %H:%M")])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=expenses_{datetime.now().strftime('%Y%m%d')}.csv"})


@app.get("/export/audit")
def export_audit(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    logs = crud.get_audit_trail(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Action", "Entity Type", "Entity ID", "Actor", "Details", "Timestamp", "Hash"])
    for log in logs:
        writer.writerow([log.id, log.action, log.entity_type or "", log.entity_id or "", log.actor_name or "", log.details or "", log.timestamp.strftime("%Y-%m-%d %H:%M:%S"), log.hash_chain or ""])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_{datetime.now().strftime('%Y%m%d')}.csv"})


@app.get("/export/project/{project_id}/report")
def export_project_report(project_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    data = crud.get_project_dashboard(db, project_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["PROJECT REPORT"])
    writer.writerow(["Project", data["project"]["name"]])
    writer.writerow(["Total Donated", f"Rs {data['total_donated']}"]);  writer.writerow(["Total Spent", f"Rs {data['total_spent']}"])
    writer.writerow(["Remaining", f"Rs {data['remaining']}"]);          writer.writerow(["Utilisation", f"{data['utilization_pct']}%"])
    writer.writerow([])
    writer.writerow(["DONATIONS"]); writer.writerow(["Donor", "Amount", "Message", "Date"])
    for d in data["donations"]: writer.writerow([d["donor"], d["amount"], d["message"] or "", d["date"][:10]])
    writer.writerow([])
    writer.writerow(["EXPENSES"]); writer.writerow(["Purpose", "Amount", "Description", "Date"])
    for e in data["expense_breakdown"]: writer.writerow([e["purpose"], e["amount"], e["description"] or "", e["date"][:10]])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=project_{project_id}_report.csv"})


# ── Seed ──────────────────────────────────────────────────────────────────────

@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    return crud.seed_demo_data(db, pwd_context)