from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    status = Column(String, default="pending")  # pending, running, completed, failed
    overall_score = Column(Integer, nullable=True)
    accessibility_score = Column(Integer, nullable=True)
    ux_score = Column(Integer, nullable=True)
    seo_score = Column(Integer, nullable=True)
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
