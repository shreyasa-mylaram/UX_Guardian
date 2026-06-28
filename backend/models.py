from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    url = Column(String, index=True)
    status = Column(String, default="pending")  # pending, running, completed, failed
    overall_score = Column(Integer, nullable=True)
    accessibility_score = Column(Integer, nullable=True)
    ux_score = Column(Integer, nullable=True)
    seo_score = Column(Integer, nullable=True)
    dom_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, index=True)
    category = Column(String) # accessibility, ux, seo, performance
    severity = Column(String) # low, medium, high, critical
    title = Column(String)
    description = Column(Text)
    recommendation = Column(Text)
    selector = Column(String, nullable=True) # CSS selector
    code_snippet = Column(Text, nullable=True) # HTML/CSS
    fixed_code = Column(Text, nullable=True) # AI generated fix
    business_impact = Column(String, nullable=True) # High, Medium, Low
    confidence_score = Column(Integer, nullable=True) # 0-100
    estimated_fix_time = Column(String, nullable=True) # e.g. '2 minutes'
    is_applied = Column(Integer, default=0) # boolean stored as int in SQLite

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, index=True)
    role = Column(String) # 'user' or 'model'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
