from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import hashlib, json
import models, schemas


# ── Audit helpers ─────────────────────────────────────────────────────────────

def _last_hash(db: Session) -> str:
    last = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).first()
    return last.hash_chain if last else "GENESIS"


def _make_hash(prev_hash: str, action: str, details: str, ts: str) -> str:
    raw = f"{prev_hash}|{action}|{details}|{ts}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _audit(db: Session, action: str, entity_type: str, entity_id: int,
           actor_id: int, actor_name: str, details: str):
    ts = datetime.utcnow().isoformat()
    prev = _last_hash(db)
    h = _make_hash(prev, action, details, ts)
    log = models.AuditLog(
        action=action, entity_type=entity_type, entity_id=entity_id,
        actor_id=actor_id, actor_name=actor_name, details=details,
        timestamp=datetime.utcnow(), hash_chain=h
    )
    db.add(log)
    db.commit()


# ── Users ─────────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(
        name=user.name, email=user.email,
        hashed_password=hashed_password, role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    _audit(db, "USER_REGISTERED", "user", db_user.id, db_user.id,
           db_user.name, f"New {user.role} registered: {user.email}")
    return db_user


# ── Projects ──────────────────────────────────────────────────────────────────

def get_projects(db: Session):
    return db.query(models.Project).all()


def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    db_proj = models.Project(
        name=project.name, description=project.description,
        goal_amount=project.goal_amount, created_by=user_id
    )
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    _audit(db, "PROJECT_CREATED", "project", db_proj.id, user_id,
           user.name, f"Project '{project.name}' created with goal ₹{project.goal_amount}")
    return db_proj


# ── Donations ─────────────────────────────────────────────────────────────────

def get_donations_by_donor(db: Session, donor_id: int):
    return db.query(models.Donation).filter(models.Donation.donor_id == donor_id).all()


def get_donations_by_project(db: Session, project_id: int):
    return db.query(models.Donation).filter(models.Donation.project_id == project_id).all()


def create_donation(db: Session, donation: schemas.DonationCreate, donor_id: int):
    user = db.query(models.User).filter(models.User.id == donor_id).first()
    project = db.query(models.Project).filter(models.Project.id == donation.project_id).first()
    db_don = models.Donation(
        donor_id=donor_id, project_id=donation.project_id,
        amount=donation.amount, message=donation.message
    )
    db.add(db_don)
    db.commit()
    db.refresh(db_don)
    _audit(db, "DONATION_MADE", "donation", db_don.id, donor_id, user.name,
           f"₹{donation.amount} donated to '{project.name}' by {user.name}")
    return db_don


def get_project_total_donated(db: Session, project_id: int) -> float:
    result = db.query(func.sum(models.Donation.amount)).filter(
        models.Donation.project_id == project_id).scalar()
    return result or 0.0


def get_project_total_spent(db: Session, project_id: int) -> float:
    result = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.project_id == project_id).scalar()
    return result or 0.0


# ── Expenses ──────────────────────────────────────────────────────────────────

def get_expenses_by_project(db: Session, project_id: int):
    return db.query(models.Expense).filter(models.Expense.project_id == project_id).all()


def create_expense(db: Session, expense: schemas.ExpenseCreate, added_by: int):
    user = db.query(models.User).filter(models.User.id == added_by).first()
    project = db.query(models.Project).filter(models.Project.id == expense.project_id).first()
    db_exp = models.Expense(
        project_id=expense.project_id, purpose=expense.purpose,
        amount=expense.amount, description=expense.description,
        receipt_url=expense.receipt_url, added_by=added_by
    )
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    _audit(db, "EXPENSE_ADDED", "expense", db_exp.id, added_by, user.name,
           f"₹{expense.amount} spent on '{expense.purpose}' for project '{project.name}'")
    return db_exp


# ── Dashboard ─────────────────────────────────────────────────────────────────

def get_dashboard_summary(db: Session):
    projects = db.query(models.Project).all()
    total_donated = db.query(func.sum(models.Donation.amount)).scalar() or 0.0
    total_spent = db.query(func.sum(models.Expense.amount)).scalar() or 0.0
    total_donors = db.query(func.count(func.distinct(models.Donation.donor_id))).scalar() or 0

    project_stats = []
    for p in projects:
        donated = get_project_total_donated(db, p.id)
        spent = get_project_total_spent(db, p.id)
        project_stats.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "goal_amount": p.goal_amount,
            "total_donated": donated,
            "total_spent": spent,
            "remaining": donated - spent,
            "donor_count": db.query(func.count(models.Donation.id)).filter(
                models.Donation.project_id == p.id).scalar() or 0,
            "expense_count": db.query(func.count(models.Expense.id)).filter(
                models.Expense.project_id == p.id).scalar() or 0,
            "status": p.status,
        })

    return {
        "total_donated": total_donated,
        "total_spent": total_spent,
        "total_remaining": total_donated - total_spent,
        "total_donors": total_donors,
        "total_projects": len(projects),
        "projects": project_stats,
    }


def get_project_dashboard(db: Session, project_id: int):
    project = get_project(db, project_id)
    donated = get_project_total_donated(db, project_id)
    spent = get_project_total_spent(db, project_id)

    expenses = get_expenses_by_project(db, project_id)
    expense_breakdown = [
        {"purpose": e.purpose, "amount": e.amount, "date": e.date.isoformat(),
         "description": e.description}
        for e in expenses
    ]

    donations = get_donations_by_project(db, project_id)
    donation_list = [
        {"donor": d.donor.name, "amount": d.amount,
         "date": d.date.isoformat(), "message": d.message}
        for d in donations
    ]

    return {
        "project": {"id": project.id, "name": project.name,
                    "description": project.description, "goal_amount": project.goal_amount},
        "total_donated": donated,
        "total_spent": spent,
        "remaining": donated - spent,
        "utilization_pct": round((spent / donated * 100) if donated > 0 else 0, 1),
        "expense_breakdown": expense_breakdown,
        "donations": donation_list,
    }


# ── Audit ─────────────────────────────────────────────────────────────────────

def get_audit_trail(db: Session):
    return db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(100).all()


# ── Seed ──────────────────────────────────────────────────────────────────────

def seed_demo_data(db: Session, pwd_context):
    # Check if already seeded
    if db.query(models.User).count() > 0:
        return {"message": "Already seeded"}

    # Create NGO user
    ngo = models.User(name="GreenEarth NGO", email="ngo@greenearth.org",
                      hashed_password=pwd_context.hash("ngo123"), role="ngo")
    db.add(ngo)

    # Create donors
    donors = [
        models.User(name="Madhumitha", email="madhumitha@gmail.com",
                    hashed_password=pwd_context.hash("donor123"), role="donor"),
        models.User(name="Priya Singh", email="priya@gmail.com",
                    hashed_password=pwd_context.hash("donor123"), role="donor"),
        models.User(name="Amit Shah", email="amit@gmail.com",
                    hashed_password=pwd_context.hash("donor123"), role="donor"),
    ]
    for d in donors:
        db.add(d)
    db.commit()

    ngo = db.query(models.User).filter(models.User.email == "ngo@greenearth.org").first()

    # Create projects
    projects_data = [
        ("School Education Fund", "Providing books, uniforms and infrastructure to rural schools", 50000),
        ("Clean Water Initiative", "Building water purification systems in drought-prone villages", 80000),
        ("Women Empowerment", "Skill training and microfinance for women entrepreneurs", 30000),
    ]
    project_objs = []
    for name, desc, goal in projects_data:
        p = models.Project(name=name, description=desc, goal_amount=goal, created_by=ngo.id)
        db.add(p)
        project_objs.append(p)
    db.commit()

    # Refresh
    edu = db.query(models.Project).filter(models.Project.name == "School Education Fund").first()
    water = db.query(models.Project).filter(models.Project.name == "Clean Water Initiative").first()
    women = db.query(models.Project).filter(models.Project.name == "Women Empowerment").first()
    madhu = db.query(models.User).filter(models.User.email == "madhumitha@gmail.com").first()
    priya = db.query(models.User).filter(models.User.email == "priya@gmail.com").first()
    amit = db.query(models.User).filter(models.User.email == "amit@gmail.com").first()

    # Donations
    donations = [
        (madhu.id, edu.id, 5000, "For the children!"),
        (priya.id, edu.id, 5000, "Education matters"),
        (amit.id, edu.id, 3000, "Keep it up"),
        (madhu.id, water.id, 10000, "Clean water is a right"),
        (priya.id, water.id, 8000, ""),
        (amit.id, women.id, 7000, "Empowerment first"),
    ]
    for donor_id, proj_id, amt, msg in donations:
        db.add(models.Donation(donor_id=donor_id, project_id=proj_id, amount=amt, message=msg))
    db.commit()

    # Expenses
    expenses = [
        (edu.id, "Books purchase", 2000, "Class 1-5 textbooks"),
        (edu.id, "Classroom repair", 3000, "Roof and windows"),
        (edu.id, "Uniforms", 2500, "100 sets of uniforms"),
        (water.id, "Water purifier units", 5000, "RO units installation"),
        (water.id, "Pipeline laying", 8000, "3km pipeline"),
        (women.id, "Sewing machines", 3000, "10 sewing machines"),
        (women.id, "Training materials", 1500, "Workshops and training"),
    ]
    for proj_id, purpose, amt, desc in expenses:
        db.add(models.Expense(project_id=proj_id, purpose=purpose, amount=amt,
                              description=desc, added_by=ngo.id))
    db.commit()

    return {"message": "Demo data seeded successfully"}


# ── Notifications ─────────────────────────────────────────────────────────────

def create_notification(db: Session, user_id: int, notif_type: str, subject: str, body: str):
    notif = models.Notification(user_id=user_id, type=notif_type, subject=subject, body=body)
    db.add(notif)
    db.commit()
    return notif


def notify_project_donors(db: Session, project_id: int, project_name: str, purpose: str, amount: float):
    """Notify all donors of a project when a new expense is recorded."""
    donations = get_donations_by_project(db, project_id)
    donor_ids = list(set(d.donor_id for d in donations))
    for donor_id in donor_ids:
        create_notification(db, donor_id, "expense_update",
            f"Fund update: {project_name}",
            f"The NGO has recorded a new expense of ₹{amount} for '{purpose}' under the {project_name} project. Your donation is being put to work!")


def get_notifications(db: Session, user_id: int):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()


def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == 0
    ).count()


def mark_notification_read(db: Session, notif_id: int, user_id: int):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = 1
        db.commit()


def mark_all_notifications_read(db: Session, user_id: int):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == 0
    ).update({"is_read": 1})
    db.commit()