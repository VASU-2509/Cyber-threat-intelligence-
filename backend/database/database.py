from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./threat_intel.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False)
    summary = Column(Text)
    risk_score = Column(Float)
    severity = Column(String)
    threat_actor = Column(String)
    cves = Column(Text)
    iocs = Column(Text)
    recommendations = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)