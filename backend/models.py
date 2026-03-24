from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="donor")   # "donor" | "ngo"
    created_at = Column(DateTime, default=datetime.utcnow)

    donations = relationship("Donation", back_populates="donor")
    projects = relationship("Project", back_populates="created_by_user")
    expenses = relationship("Expense", back_populates="added_by_user")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    goal_amount = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")   # active | completed | paused

    created_by_user = relationship("User", back_populates="projects")
    donations = relationship("Donation", back_populates="project")
    expenses = relationship("Expense", back_populates="project")


class Donation(Base):
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    amount = Column(Float, nullable=False)
    message = Column(Text, default="")
    date = Column(DateTime, default=datetime.utcnow)

    donor = relationship("User", back_populates="donations")
    project = relationship("Project", back_populates="donations")


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    purpose = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, default="")
    added_by = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    receipt_url = Column(String, default="")

    project = relationship("Project", back_populates="expenses")
    added_by_user = relationship("User", back_populates="expenses")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    entity_type = Column(String)
    entity_id = Column(Integer)
    actor_id = Column(Integer, ForeignKey("users.id"))
    actor_name = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    hash_chain = Column(String, default="")   # blockchain-style


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)          # "donation" | "expense_update" | "goal_reached"
    subject = Column(String)
    body = Column(Text)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="notifications")