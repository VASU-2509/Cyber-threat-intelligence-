"use client";
import { useState, useEffect } from "react";
import { uploadReport, analyzeReport, getReports } from "@/services/api";

interface Report {
  id: number;
  filename: string;
  created_at: string;
}

interface Analysis {
  summary: string;
  risk_score: number;
  severity: string;
  threat_actor: string;
  cves: string[];
  iocs: { ip_addresses: string[]; domains: string[]; hashes: string[] };
  recommendations: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const data = await getReports();
    setReports(data);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysis(null);
    try {
      setStatus("[ UPLOADING ] Sending report to server...");
      const uploaded = await uploadReport(file);
      setStatus("[ ANALYZING ] Running AI threat analysis...");
      const result = await analyzeReport(uploaded.report_id);
      setAnalysis(result);
      setStatus("[ COMPLETE ] Analysis finished successfully.");
      fetchReports();
    } catch {
      setStatus("[ ERROR ] Analysis failed. Check console.");
    }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const severityColor = (s: string) => {
    if (s === "Critical") return "var(--accent-red)";
    if (s === "High") return "var(--accent-orange)";
    if (s === "Medium") return "#eab308";
    return "var(--accent-green)";
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px", maxWidth: "1100px", margin: "0 auto" }} className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p className="mono" style={{ color: "var(--accent-cyan)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "8px" }}>
          // THREAT INTELLIGENCE DASHBOARD
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.2 }}>
          Upload & Analyze
          <span style={{ color: "var(--accent-cyan)" }}> Threat Reports</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "14px" }}>
          AI-powered CVE extraction, IOC identification, and risk assessment
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

        {/* Upload Zone */}
        <div
          className="glow-card"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            padding: "28px",
            border: dragOver ? "1px solid var(--accent-cyan)" : undefined,
            boxShadow: dragOver ? "0 0 30px var(--accent-cyan-dim)" : undefined,
            transition: "all 0.3s",
          }}
        >
          <p className="mono" style={{ color: "var(--accent-cyan)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "16px" }}>
            [ UPLOAD REPORT ]
          </p>

          <div
            style={{
              border: "1px dashed var(--border-color)",
              borderRadius: "8px",
              padding: "24px",
              textAlign: "center",
              marginBottom: "16px",
              background: dragOver ? "var(--accent-cyan-dim)" : "transparent",
              transition: "all 0.3s",
            }}
          >
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>⬆</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "4px" }}>
              Drag & drop or click to select
            </p>
            <p className="mono" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              PDF · DOCX · TXT
            </p>
          </div>

          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
            id="file-input"
          />
          <label
            htmlFor="file-input"
            style={{
              display: "block",
              textAlign: "center",
              padding: "8px",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
              marginBottom: "12px",
              transition: "all 0.2s",
            }}
          >
            {file ? `✓ ${file.name}` : "Browse files"}
          </label>

          <button
            onClick={handleUploadAndAnalyze}
            disabled={!file || loading}
            className="btn-cyan"
            style={{ width: "100%", padding: "10px" }}
          >
            {loading ? "● ANALYZING..." : "▶ UPLOAD & ANALYZE"}
          </button>

          {status && (
            <p className="mono" style={{ color: "var(--accent-cyan)", fontSize: "11px", marginTop: "12px", opacity: 0.8 }}>
              {status}
            </p>
          )}
        </div>

        {/* Past Reports */}
        <div className="glow-card" style={{ padding: "28px" }}>
          <p className="mono" style={{ color: "var(--accent-cyan)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "16px" }}>
            [ REPORT HISTORY ]
          </p>
          {reports.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No reports uploaded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="glow-card card-cyan"
                  style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span className="mono" style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {r.filename}
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Risk Overview */}
          <div className="glow-card-red card-red" style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <p className="mono" style={{ color: "var(--accent-red)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  [ THREAT ANALYSIS ]
                </p>
                <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {analysis.threat_actor}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>{analysis.summary}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginLeft: "24px", flexShrink: 0 }}>
                <div
                  className="risk-ring critical-pulse"
                  style={{ borderColor: severityColor(analysis.severity), color: severityColor(analysis.severity), boxShadow: `0 0 20px ${severityColor(analysis.severity)}44` }}
                >
                  {analysis.risk_score}
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: "10px",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: `1px solid ${severityColor(analysis.severity)}`,
                    color: severityColor(analysis.severity),
                    background: `${severityColor(analysis.severity)}22`,
                  }}
                >
                  {analysis.severity}
                </span>
              </div>
            </div>
          </div>

          {/* CVEs + IOCs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* CVEs */}
            {analysis.cves.length > 0 && (
              <div className="glow-card card-red" style={{ padding: "24px" }}>
                <p className="mono" style={{ color: "var(--accent-red)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "14px" }}>
                  [ CVEs IDENTIFIED ]
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {analysis.cves.map((cve) => (
                    <span key={cve} className="tag-red mono">{cve}</span>
                  ))}
                </div>
              </div>
            )}

            {/* IOCs */}
            <div className="glow-card card-orange" style={{ padding: "24px", borderLeft: "3px solid var(--accent-orange)" }}>
              <p className="mono" style={{ color: "var(--accent-orange)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "14px" }}>
                [ INDICATORS OF COMPROMISE ]
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <p className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px" }}>IP ADDRESSES</p>
                  {analysis.iocs.ip_addresses.length > 0
                    ? analysis.iocs.ip_addresses.map((ip) => <p key={ip} className="mono" style={{ fontSize: "12px", color: "var(--accent-red)" }}>{ip}</p>)
                    : <p className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>none</p>}
                </div>
                <div>
                  <p className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px" }}>DOMAINS</p>
                  {analysis.iocs.domains.length > 0
                    ? analysis.iocs.domains.map((d) => <p key={d} className="mono" style={{ fontSize: "12px", color: "var(--accent-orange)" }}>{d}</p>)
                    : <p className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>none</p>}
                </div>
                <div>
                  <p className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px" }}>HASHES</p>
                  {analysis.iocs.hashes.length > 0
                    ? analysis.iocs.hashes.map((h) => <p key={h} className="mono" style={{ fontSize: "11px", color: "#eab308", wordBreak: "break-all" }}>{h}</p>)
                    : <p className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>none</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="glow-card card-green" style={{ padding: "24px" }}>
            <p className="mono" style={{ color: "var(--accent-green)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "14px" }}>
              [ RECOMMENDATIONS ]
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {analysis.recommendations.map((rec, i) => (
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