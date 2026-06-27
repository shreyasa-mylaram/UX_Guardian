from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import engine, SessionLocal
import os
from dotenv import load_dotenv

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="UX Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AuditRequest(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"message": "UX Guardian API is running"}

import asyncio
from browser_agent import run_browser_scan
from audit_engine import generate_ai_analysis

async def process_audit(audit_id: int, url: str, db_session: Session):
    # Run the browser scan
    scan_results = await run_browser_scan(url)
    
    if "error" in scan_results:
        db_session.query(models.Audit).filter(models.Audit.id == audit_id).update({"status": "failed"})
        db_session.commit()
        return
        
    # Run AI Analysis
    issues = generate_ai_analysis(
        scan_results["dom_path"], 
        scan_results["screenshot_path"], 
        scan_results["axe_results"]
    )
    
    overall_score = 100
    
    # Save issues to database
    for issue_data in issues:
        # Decrease score based on severity
        severity = issue_data.get("severity", "low").lower()
        if severity == "critical":
            overall_score -= 10
        elif severity == "high":
            overall_score -= 5
        elif severity == "medium":
            overall_score -= 2
        else:
            overall_score -= 1
            
        db_issue = models.Issue(
            audit_id=audit_id,
            category=issue_data.get("category", "UX"),
            severity=severity,
            title=issue_data.get("title", "Issue"),
            description=issue_data.get("description", ""),
            recommendation=issue_data.get("recommendation", ""),
            selector=issue_data.get("selector", ""),
            code_snippet=issue_data.get("code_snippet", ""),
            fixed_code=issue_data.get("fixed_code", "")
        )
        db_session.add(db_issue)
        
    overall_score = max(0, overall_score)
    
    # Update Audit status
    db_session.query(models.Audit).filter(models.Audit.id == audit_id).update({
        "status": "completed",
        "overall_score": overall_score
    })
    db_session.commit()

@app.post("/api/audits")
def create_audit(audit_req: AuditRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_audit = models.Audit(url=audit_req.url, status="running")
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    
    # Trigger background Playwright/Audit task
    background_tasks.add_task(process_audit, db_audit.id, audit_req.url, db)
    
    return {"audit_id": db_audit.id, "status": "running"}

@app.get("/api/audits/{audit_id}")
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    issues = db.query(models.Issue).filter(models.Issue.audit_id == audit_id).all()
    
    return {"audit": audit, "issues": issues}
