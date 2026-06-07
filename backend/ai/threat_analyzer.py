import google.genai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_threat(extracted_text: str) -> dict:
    prompt = f"""
You are a cybersecurity expert. Analyze the following threat intelligence report and return a JSON object with exactly these fields:

{{
  "summary": "2-3 sentence summary of the threat",
  "risk_score": <integer 0-100>,
  "severity": "<Critical|High|Medium|Low>",
  "threat_actor": "<name or Unknown>",
  "cves": ["CVE-XXXX-XXXX", ...],
  "iocs": {{
    "ip_addresses": ["..."],
    "domains": ["..."],
    "hashes": ["..."]
  }},
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}}

Return ONLY the JSON object. No markdown, no explanation, no code blocks.

REPORT:
{extracted_text[:8000]}
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

    return json.loads(text)