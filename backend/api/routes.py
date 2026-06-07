from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database.database import get_db, Report, Analysis
from utils.file_extractor import extract_text
from ai.threat_analyzer import analyze_threat
from rag.rag_pipeline import index_report, query_reports
import json
import shutil
import os
import aiofiles
from graph.graph_service import create_attack_graph, get_attack_graph
from agents.threat_agents import run_agent_workflow
router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_report(file: UploadFile = File(...), db: Session = Depends(get_db)):
    allowed = [".pdf", ".docx", ".txt"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    extracted_text = extract_text(file_path, file.filename)

    report = Report(filename=file.filename, extracted_text=extracted_text)
    db.add(report)
    db.commit()
    db.refresh(report)

    return {"report_id": report.id, "filename": report.filename, "text_length": len(extracted_text)}

@router.post("/analyze/{report_id}")
async def analyze_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    result = analyze_threat(report.extracted_text)

    analysis = Analysis(
        report_id=report.id,
        summary=result.get("summary"),
        risk_score=result.get("risk_score"),
        severity=result.get("severity"),
        threat_actor=result.get("threat_actor"),
        cves=json.dumps(result.get("cves", [])),
        iocs=json.dumps(result.get("iocs", {})),
        recommendations=json.dumps(result.get("recommendations", []))
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    index_report(report.id, report.extracted_text)
    create_attack_graph(report.id, result)
    return result

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    return [{"id": r.id, "filename": r.filename, "created_at": r.created_at} for r in reports]

@router.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    analysis = db.query(Analysis).filter(Analysis.report_id == report_id).first()
    return {
        "report": {"id": report.id, "filename": report.filename},
        "analysis": {
            "summary": analysis.summary,
            "risk_score": analysis.risk_score,
            "severity": analysis.severity,
            "threat_actor": analysis.threat_actor,
            "cves": json.loads(analysis.cves) if analysis.cves else [],
            "iocs": json.loads(analysis.iocs) if analysis.iocs else {},
            "recommendations": json.loads(analysis.recommendations) if analysis.recommendations else []
        } if analysis else None
    }

@router.post("/chat")
async def chat(payload: dict, db: Session = Depends(get_db)):
    question = payload.get("question")
    report_id = payload.get("report_id")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    answer = query_reports(question, report_id)
    return {"answer": answer}
@router.get("/graph/{report_id}")
def get_graph(report_id: int):
    graph = get_attack_graph(report_id)
    return graph
@router.post("/agents/run/{report_id}")
async def run_agents(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    result = run_agent_workflow(report.extracted_text)
    return result