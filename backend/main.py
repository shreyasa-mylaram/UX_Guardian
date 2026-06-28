import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import engine, SessionLocal
import os
from dotenv import load_dotenv
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm


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

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str

class AuditRequest(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"message": "UX Guardian API is running"}

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

import asyncio
from browser_agent import run_browser_scan
from audit_engine import generate_ai_analysis

async def process_audit(audit_id: int, url: str):
    db_session = SessionLocal()
    try:
        # Run the browser scan
        scan_results = await run_browser_scan(url)
        
        if "error" in scan_results:
            print("Browser scan failed, falling back to AI mock mode...")
            scan_results["dom_path"] = "missing.html"
            scan_results["screenshot_path"] = "missing.png"
            scan_results["axe_results"] = []
            
        # Run AI Analysis
        analysis_result = generate_ai_analysis(
            scan_results["dom_path"], 
            scan_results["screenshot_path"], 
            scan_results["axe_results"]
        )
        
        industry = analysis_result.get("industry", "General") if isinstance(analysis_result, dict) else "General"
        issues = analysis_result.get("issues", []) if isinstance(analysis_result, dict) else analysis_result
        
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
                business_impact=issue_data.get("business_impact", "Medium"),
                confidence_score=issue_data.get("confidence_score", 85),
                estimated_fix_time=issue_data.get("estimated_fix_time", "Unknown"),
                recommendation=issue_data.get("recommendation", ""),
                selector=issue_data.get("selector", ""),
                code_snippet=issue_data.get("code_snippet", ""),
                fixed_code=issue_data.get("fixed_code", "")
            )
            db_session.add(db_issue)
            
        # Process performance metrics from Playwright
        perf = scan_results.get("performance", {})
        load_time_ms = perf.get("loadTime", 0)
        if load_time_ms > 3000:
            overall_score -= 10
            perf_issue = models.Issue(
                audit_id=audit_id,
                category="Performance",
                severity="high" if load_time_ms > 6000 else "medium",
                title="High Page Load Time",
                description=f"The page took {load_time_ms / 1000:.2f} seconds to load. Slow pages lead to higher bounce rates and worse SEO rankings.",
                business_impact="High",
                confidence_score=100,
                estimated_fix_time="1-2 hours",
                recommendation="Optimize images, minify CSS/JS, and leverage browser caching to improve load times.",
                selector="",
                code_snippet="",
                fixed_code=""
            )
            db_session.add(perf_issue)
            
        overall_score = max(0, overall_score)
        
        # Update Audit status
        db_session.query(models.Audit).filter(models.Audit.id == audit_id).update({
            "status": "completed",
            "overall_score": overall_score,
            "dom_path": scan_results.get("dom_path", ""),
            "industry": industry
        })
        db_session.commit()
    finally:
        db_session.close()

@app.post("/api/audits")
def create_audit(audit_req: AuditRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = models.Audit(url=audit_req.url, status="running", user_id=current_user.id)
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    
    # Trigger background Playwright/Audit task
    background_tasks.add_task(process_audit, db_audit.id, audit_req.url)
    
    return {"audit_id": db_audit.id, "status": "running"}

@app.get("/api/audits/history")
def get_audit_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    audits = db.query(models.Audit).filter(models.Audit.user_id == current_user.id).order_by(models.Audit.created_at.desc()).all()
    return {"history": audits}

@app.get("/api/audits/{audit_id}")
def get_audit(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    issues = db.query(models.Issue).filter(models.Issue.audit_id == audit_id).all()
    
    return {"audit": audit, "issues": issues}

class ChatRequest(BaseModel):
    message: str
    persona: str | None = "developer"

@app.post("/api/audits/{audit_id}/chat")
def post_chat(audit_id: int, chat_req: ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify audit exists
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
        
    # Save user message
    user_msg = models.ChatMessage(audit_id=audit_id, role="user", content=chat_req.message)
    db.add(user_msg)
    db.commit()
    
    # Get history
    history = db.query(models.ChatMessage).filter(models.ChatMessage.audit_id == audit_id).order_by(models.ChatMessage.created_at).all()
    
    # Build context from issues
    issues = db.query(models.Issue).filter(models.Issue.audit_id == audit_id).all()
    context = "\n".join([f"- {i.title} ({i.severity}): {i.description}" for i in issues])
    
    # Generate response
    from audit_engine import generate_chat_response
    ai_response_text = generate_chat_response(chat_req.message, history[:-1], context, chat_req.persona)
    
    # Save model message
    model_msg = models.ChatMessage(audit_id=audit_id, role="model", content=ai_response_text)
    db.add(model_msg)
    db.commit()
    
    return {"role": "model", "content": ai_response_text}

@app.get("/api/audits/{audit_id}/chat")
def get_chat(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    history = db.query(models.ChatMessage).filter(models.ChatMessage.audit_id == audit_id).order_by(models.ChatMessage.created_at).all()
    return {"history": history}

@app.get("/api/audits/{audit_id}/export")
def export_audit_pdf(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
        
    issues = db.query(models.Issue).filter(models.Issue.audit_id == audit_id).all()
    
    from fastapi.responses import Response
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    import io
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, f"UX Guardian Audit Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"URL: {audit.url}")
    c.drawString(50, height - 90, f"Overall Score: {audit.overall_score}/100")
    
    y = height - 130
    for issue in issues:
        if y < 100:
            c.showPage()
            y = height - 50
            
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, f"[{issue.severity.upper()}] {issue.title}")
        y -= 20
        c.setFont("Helvetica", 10)
        
        # Simple text wrapping could be added here, but for MVP we truncate or let it run
        desc = (issue.description[:100] + '..') if len(issue.description) > 100 else issue.description
        c.drawString(70, y, desc)
        y -= 30
        
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=audit_{audit_id}.pdf"
    })

@app.post("/api/audits/{audit_id}/issues/{issue_id}/apply")
def apply_issue_fix(audit_id: int, issue_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id, models.Audit.user_id == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
        
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id, models.Issue.audit_id == audit_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    issue.is_applied = True
    db.commit()
    
    return {"status": "success", "issue_id": issue_id, "is_applied": True}

from fastapi.responses import HTMLResponse
from bs4 import BeautifulSoup
import os

@app.get("/api/audits/{audit_id}/issues/{issue_id}/preview/original")
def preview_original(audit_id: int, issue_id: int, db: Session = Depends(get_db)):
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if not audit or not audit.dom_path or not os.path.exists(audit.dom_path):
        return HTMLResponse("<html><body><div style='padding:20px;font-family:sans-serif;'>DOM snapshot not found</div></body></html>", status_code=404)
        
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id, models.Issue.audit_id == audit_id).first()
    if not issue:
        return HTMLResponse("<html><body><div style='padding:20px;font-family:sans-serif;'>Issue not found</div></body></html>", status_code=404)

    with open(audit.dom_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # Inject a script to scroll to the element
    if issue.selector:
        safe_sel = issue.selector.replace("`", "\\`")
        script = f"<script>setTimeout(() => {{ const el = document.querySelector(`{safe_sel}`); if(el) {{ el.scrollIntoView({{behavior: 'smooth', block: 'center'}}); el.style.boxShadow = '0 0 0 4px red'; el.style.transition = 'box-shadow 0.3s ease'; }} }}, 500);</script>"
        html = html.replace("</body>", f"{script}</body>")
        
    return HTMLResponse(html)

@app.get("/api/audits/{audit_id}/issues/{issue_id}/preview/fixed")
def preview_fixed(audit_id: int, issue_id: int, db: Session = Depends(get_db)):
    audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if not audit or not audit.dom_path or not os.path.exists(audit.dom_path):
        return HTMLResponse("<html><body><div style='padding:20px;font-family:sans-serif;'>DOM snapshot not found</div></body></html>", status_code=404)
        
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id, models.Issue.audit_id == audit_id).first()
    if not issue:
        return HTMLResponse("<html><body><div style='padding:20px;font-family:sans-serif;'>Issue not found</div></body></html>", status_code=404)

    with open(audit.dom_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    if issue.selector and issue.fixed_code:
        try:
            soup = BeautifulSoup(html, 'lxml')
            el = soup.select_one(issue.selector)
            if el:
                fixed_soup = BeautifulSoup(issue.fixed_code, 'lxml')
                if fixed_soup.body and fixed_soup.body.contents:
                    new_tag = fixed_soup.body.contents[0]
                    el.replace_with(new_tag)
                    html = str(soup)
                    
                    safe_sel = issue.selector.replace("`", "\\`")
                    script = f"<script>setTimeout(() => {{ const el = document.querySelector(`{safe_sel}`); if(el) {{ el.scrollIntoView({{behavior: 'smooth', block: 'center'}}); el.style.boxShadow = '0 0 0 4px #10b981'; el.style.transition = 'box-shadow 0.3s ease'; }} }}, 500);</script>"
                    if "</body>" in html:
                        html = html.replace("</body>", f"{script}</body>")
                    else:
                        html += script
        except Exception as e:
            print(f"Failed to inject fixed code: {e}")
            
    return HTMLResponse(html)
