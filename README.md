# Cyber Threat Intelligence Platform

AI-powered full-stack platform that transforms unstructured cybersecurity reports into actionable threat intelligence.

## Features
- AI Threat Analysis (Gemini 2.5) — risk scoring, CVE extraction, IOC identification
- RAG Chat — natural language querying over uploaded reports (LangChain + Qdrant)
- Attack Graph — Neo4j visualization of threat relationships
- Multi-Agent Workflow — LangGraph pipeline with Research, Risk, and Report agents
- Dark/Light Mode — cybersecurity terminal aesthetic

## Tech Stack
Next.js · FastAPI · Gemini 2.5 · LangChain · Qdrant · Neo4j · LangGraph · SQLite

## Setup
1. Start Docker containers: Qdrant (port 6333) and Neo4j (port 7687)
2. Backend: cd backend && pip install -r requirements.txt && uvicorn main:app --reload
3. Frontend: cd frontend && npm install && npm run dev
4. Add .env with your GEMINI_API_KEY

## Architecture
PDF/DOCX/TXT → FastAPI → Gemini AI Analysis → Qdrant RAG → Neo4j Graph → LangGraph Agents
