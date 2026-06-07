from langgraph.graph import StateGraph, END
from typing import TypedDict, List
import google.genai as genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class AgentState(TypedDict):
    report_text: str
    threat_actor: str
    cves: List[str]
    iocs: dict
    risk_score: int
    severity: str
    executive_summary: str
    recommendations: List[str]
    research_status: str
    risk_status: str
    report_status: str

def research_agent(state: AgentState) -> AgentState:
    prompt = f"""
You are a cybersecurity research analyst. Extract threat intelligence from this report.

Return ONLY a JSON object with these fields:
{{
  "threat_actor": "<name or Unknown>",
  "cves": ["CVE-XXXX-XXXX"],
  "iocs": {{
    "ip_addresses": [],
    "domains": [],
    "hashes": []
  }}
}}

REPORT:
{state["report_text"][:5000]}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    import json
    data = json.loads(text)

    return {
        **state,
        "threat_actor": data.get("threat_actor", "Unknown"),
        "cves": data.get("cves", []),
        "iocs": data.get("iocs", {}),
        "research_status": "complete"
    }

def risk_agent(state: AgentState) -> AgentState:
    prompt = f"""
You are a cybersecurity risk analyst. Based on the threat intelligence below, assess the risk.

Threat Actor: {state["threat_actor"]}
CVEs: {state["cves"]}
IOCs: {state["iocs"]}

Return ONLY a JSON object:
{{
  "risk_score": <integer 0-100>,
  "severity": "<Critical|High|Medium|Low>"
}}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    import json
    data = json.loads(text)

    return {
        **state,
        "risk_score": data.get("risk_score", 50),
        "severity": data.get("severity", "Medium"),
        "risk_status": "complete"
    }

def report_agent(state: AgentState) -> AgentState:
    prompt = f"""
You are a cybersecurity report writer. Generate an executive summary and recommendations.

Threat Actor: {state["threat_actor"]}
CVEs: {state["cves"]}
Risk Score: {state["risk_score"]}
Severity: {state["severity"]}

Return ONLY a JSON object:
{{
  "executive_summary": "<2-3 sentence executive summary>",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    import json
    data = json.loads(text)

    return {
        **state,
        "executive_summary": data.get("executive_summary", ""),
        "recommendations": data.get("recommendations", []),
        "report_status": "complete"
    }

def build_agent_graph():
    graph = StateGraph(AgentState)
    graph.add_node("research", research_agent)
    graph.add_node("risk", risk_agent)
    graph.add_node("report", report_agent)
    graph.set_entry_point("research")
    graph.add_edge("research", "risk")
    graph.add_edge("risk", "report")
    graph.add_edge("report", END)
    return graph.compile()

def run_agent_workflow(report_text: str) -> dict:
    app = build_agent_graph()
    initial_state: AgentState = {
        "report_text": report_text,
        "threat_actor": "",
        "cves": [],
        "iocs": {},
        "risk_score": 0,
        "severity": "",
        "executive_summary": "",
        "recommendations": [],
        "research_status": "pending",
        "risk_status": "pending",
        "report_status": "pending"
    }
    result = app.invoke(initial_state)
    return {
        "threat_actor": result["threat_actor"],
        "cves": result["cves"],
        "iocs": result["iocs"],
        "risk_score": result["risk_score"],
        "severity": result["severity"],
        "executive_summary": result["executive_summary"],
        "recommendations": result["recommendations"],
        "research_status": result["research_status"],
        "risk_status": result["risk_status"],
        "report_status": result["report_status"]
    }