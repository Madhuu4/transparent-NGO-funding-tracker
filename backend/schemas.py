from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "donor"   # "donor" | "ngo"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    goal_amount: Optional[float] = 0.0

class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    goal_amount: float
    created_by: int
    created_at: datetime
    status: str
    class Config:
        from_attributes = True


# ── Donations ─────────────────────────────────────────────────────────────────

class DonationCreate(BaseModel):
    project_id: int
    amount: float
    message: Optional[str] = ""

class DonationOut(BaseModel):
    id: int
    donor_id: int
    project_id: int
    amount: float
    message: Optional[str]
    date: datetime
    donor: Optional[UserOut]
    project: Optional[ProjectOut]
    class Config:
        from_attributes = True


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    project_id: int
    purpose: str
    amount: float
    description: Optional[str] = ""
    receipt_url: Optional[str] = ""

class ExpenseOut(BaseModel):
    id: int
    project_id: int
    purpose: str
    amount: float
    description: Optional[str]
    date: datetime
    receipt_url: Optional[str]
    added_by_user: Optional[UserOut]
    project: Optional[ProjectOut]
    class Config:
        from_attributes = True


# ── Audit ─────────────────────────────────────────────────────────────────────

class AuditOut(BaseModel):
    id: int
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    actor_name: Optional[str]
    details: Optional[str]
    timestamp: datetime
    hash_chain: Optional[str]
    class Config:
        from_attributes = True


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    type: str
    subject: str
    body: str
    is_read: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Email Broadcast ───────────────────────────────────────────────────────────

class BroadcastRequest(BaseModel):
    project_id: Optional[int] = None
    subject: str
    message: str