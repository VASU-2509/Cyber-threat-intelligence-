"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface Report {
  id: number;
  filename: string;
}

interface AgentResult {
  threat_actor: string;
  cves: string[];
  iocs: { ip_addresses: string[]; domains: string[]; hashes: string[] };
  risk_score: number;
  severity: string;
  executive_summary: string;
  recommendations: string[];
  research_status: string;
  risk_status: string;
  report_status: string;
}

type AgentStatus = "pending" | "running" | "complete";

const AgentCard = ({
  number,
  name,
  role,
  output,
  status,
}: {
  number: number;
  name: string;
  role: string;
  output?: string;
  status: AgentStatus;
}) => {
  const borderColor =
    status === "complete" ? "var(--accent-green)" :
    status === "running" ? "var(--accent-cyan)" :
    "var(--border-color)";

  const bgColor =
    status === "complete" ? "var(--accent-green-dim)" :
    status === "running" ? "var(--accent-cyan-dim)" :
    "var(--bg-card)";

  return (
    <div
      className={status === "running" ? "agent-running" : ""}
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "20px",
        background: bgColor,
        transition: "all 0.4s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Status bar at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: status === "complete"
            ? "var(--accent-green)"
            : status === "running"
            ? "linear-gradient(90deg, transparent, var(--accent-cyan), transparent)"
            : "transparent",
          transition: "all 0.4s",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: "700",
              background: status === "complete" ? "var(--accent-green)" :
                          status === "running" ? "var(--accent-cyan)" : "var(--bg-secondary)",
              color: status !== "pending" ? "var(--bg-primary)" : "var(--text-muted)",
              transition: "all 0.4s",
            }}
          >
            {status === "complete" ? "✓" : number}
          </div>
          <div>
            <h3 className="mono" style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
              {name}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{role}</p>
          </div>
        </div>

        <span
          className="mono"
          style={{
            fontSize: "10px",
            padding: "4px 10px",
            borderRadius: "4px",
            border: `1px solid ${borderColor}`,
            color: borderColor,
            background: bgColor,
          }}
        >
          {status === "complete" ? "✓ COMPLETE" : status === "running" ? "⚡ RUNNING" : "⏳ PENDING"}
        </span>
      </div>

      {output && status === "complete" && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 12px",
            background: "var(--bg-primary)",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
          }}
        >
          <p className="mono" style={{ fontSize: "11px", color: "var(--accent-green)", opacity: 0.8 }}>{output}</p>
        </div>
      )}
    </div>
  );
};

export default function AgentsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<{
    research: AgentStatus; risk: AgentStatus; report: AgentStatus;
  }>({ research: "pending", risk: "pending", report: "pending" });

  useEffect(() => {
    axios.get("http://localhost:8000/api/reports").then((res) => setReports(res.data));
  }, []);

  const runWorkflow = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setResult(null);
    setAgentStatuses({ research: "running", risk: "pending", report: "pending" });

    try {
      const res = await axios.post(`http://localhost:8000/api/agents/run/${selectedReport}`);
      setAgentStatuses({ research: "complete", risk: "running", report: "pending" });
      await new Promise((r) => setTimeout(r, 900));
      setAgentStatuses({ research: "complete", risk: "complete", report: "running" });
      await new Promise((r) => setTimeout(r, 900));
      setAgentStatuses({ research: "complete", risk: "complete", report: "complete" });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setAgentStatuses({ research: "pending", risk: "pending", report: "pending" });
    }
    setLoading(false);
  };

  const severityColor = (s: string) => {
    if (s === "Critical") return "var(--accent-red)";
    if (s === "High") return "var(--accent-orange)";
    if (s === "Medium") return "#eab308";
    return "var(--accent-green)";
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px", maxWidth: "960px", margin: "0 auto" }} className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <p className="mono" style={{ color: "var(--accent-green)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "8px" }}>
          // MULTI-AGENT WORKFLOW
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
          AI Agent <span style={{ color: "var(--accent-green)" }}>Pipeline</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
          Three specialized agents analyze your report sequentially via LangGraph
        </p>
      </div>

      {/* Report selector + run button */}
      <div className="glow-card" style={{ padding: "20px", marginBottom: "24px" }}>
        <p className="mono" style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "12px" }}>
          SELECT REPORT TO ANALYZE
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={selectedReport === r.id ? "btn-green" : ""}
              style={selectedReport !== r.id ? {
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              } : {}}
            >
              {r.filename}
            </button>
          ))}
        </div>
        <button
          onClick={runWorkflow}
          disabled={!selectedReport || loading}
          className="btn-green"
          style={{ padding: "10px 24px" }}
        >
          {loading ? "⚡ AGENTS RUNNING..." : "▶ RUN AGENT WORKFLOW"}
        </button>
      </div>

      {/* Agent pipeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
        <AgentCard
          number={1}
          name="Research Agent"
          role="Reads report → Extracts threat actor, CVEs, and IOCs"
          output={result ? `Threat Actor: ${result.threat_actor} | CVEs: ${result.cves.join(", ")}` : undefined}
          status={agentStatuses.research}
        />
        <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
          <div style={{ width: "1px", height: "20px", background: "var(--border-color)", position: "relative" }}>
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", color: "var(--text-muted)", fontSize: "12px" }}>↓</div>
          </div>
        </div>
        <AgentCard
          number={2}
          name="Risk Agent"
          role="Receives research output → Calculates risk score and severity"
          output={result ? `Risk Score: ${result.risk_score}/100 | Severity: ${result.severity}` : undefined}
          status={agentStatuses.risk}
        />
        <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
          <div style={{ width: "1px", height: "20px", background: "var(--border-color)", position: "relative" }}>
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", color: "var(--text-muted)", fontSize: "12px" }}>↓</div>
          </div>
        </div>
        <AgentCard
          number={3}
          name="Report Agent"
          role="Receives all data → Generates executive summary and recommendations"
          output={result ? `Generated ${result.recommendations.length} recommendations` : undefined}
          status={agentStatuses.report}
        />
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="glow-card-green card-green" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <p className="mono" style={{ color: "var(--accent-green)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  [ EXECUTIVE SUMMARY ]
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7 }}>
                  {result.executive_summary}
                </p>
                <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                  Threat Actor: <span className="mono" style={{ color: "var(--accent-cyan)" }}>{result.threat_actor}</span>
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginLeft: "24px", flexShrink: 0 }}>
                <div
                  className="risk-ring"
                  style={{
                    borderColor: severityColor(result.severity),
                    color: severityColor(result.severity),
                    boxShadow: `0 0 20px ${severityColor(result.severity)}44`,
                  }}
                >
                  {result.risk_score}
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: "10px",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: `1px solid ${severityColor(result.severity)}`,
                    color: severityColor(result.severity),
                    background: `${severityColor(result.severity)}22`,
                  }}
                >
                  {result.severity}
                </span>
              </div>
            </div>
          </div>

          {result.cves.length > 0 && (
            <div className="glow-card card-red" style={{ padding: "20px" }}>
              <p className="mono" style={{ color: "var(--accent-red)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "12px" }}>
                [ CVEs EXTRACTED ]
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {result.cves.map((cve) => (
                  <span key={cve} className="tag-red mono">{cve}</span>
                ))}
              </div>
            </div>
          )}

          <div className="glow-card card-green" style={{ padding: "20px" }}>
            <p className="mono" style={{ color: "var(--accent-green)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "12px" }}>
              [ RECOMMENDATIONS ]
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span className="mono" style={{ color: "var(--accent-green)", fontSize: "12px", flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}