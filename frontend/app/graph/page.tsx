"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface Node {
  id: string;
  name: string;
  type: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface Report {
  id: number;
  filename: string;
}

const NODE_COLORS: Record<string, string> = {
  ThreatActor: "#ff3b3b",
  CVE: "#f97316",
  IOC: "#eab308",
  Mitigation: "#00ff88",
  Unknown: "#475569",
};

export default function GraphPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [graph, setGraph] = useState<{ nodes: Node[]; links: GraphLink[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    axios.get("http://localhost:8000/api/reports").then((res) => setReports(res.data));
  }, []);

  useEffect(() => {
    if (!graph || !canvasRef.current) return;
    drawGraph();
  }, [graph, hoveredNode]);

  const drawGraph = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = "#1e293b44";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (!graph) return;
    const nodeCount = graph.nodes.length;
    const positions: Record<string, { x: number; y: number }> = {};

    // Position threat actor in center, others in circle
    graph.nodes.forEach((node, i) => {
      if (node.type === "ThreatActor") {
        positions[node.id] = { x: W / 2, y: H / 2 };
      } else {
        const otherNodes = graph.nodes.filter(n => n.type !== "ThreatActor");
        const idx = otherNodes.findIndex(n => n.id === node.id);
        const angle = (2 * Math.PI * idx) / otherNodes.length - Math.PI / 2;
        const radius = Math.min(W, H) * 0.38;
        positions[node.id] = {
          x: W / 2 + radius * Math.cos(angle),
          y: H / 2 + radius * Math.sin(angle),
        };
      }
    });
    positionsRef.current = positions;

    // Draw links
    graph.links.forEach((link) => {
      const src = positions[typeof link.source === "string" ? link.source : (link.source as any).id];
      const tgt = positions[typeof link.target === "string" ? link.target : (link.target as any).id];
      if (!src || !tgt) return;

      const gradient = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
      gradient.addColorStop(0, "#ff3b3b66");
      gradient.addColorStop(1, "#00d4ff66");

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Link type label
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      ctx.fillStyle = "#475569";
      ctx.font = "9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(link.type, mx, my - 4);
    });

    // Draw nodes
    graph.nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;
      const color = NODE_COLORS[node.type] || "#475569";
      const isHovered = hoveredNode === node.id;
      const radius = node.type === "ThreatActor" ? 38 : isHovered ? 32 : 28;

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = isHovered ? 24 : 12;

      // Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color + "22";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Type label
      ctx.fillStyle = color;
      ctx.font = `bold ${node.type === "ThreatActor" ? 11 : 10}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(node.type, pos.x, pos.y - 5);

      // Name label
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `${node.type === "ThreatActor" ? 11 : 9}px JetBrains Mono, monospace`;
      const label = node.name.length > 16 ? node.name.slice(0, 16) + "…" : node.name;
      ctx.fillText(label, pos.x, pos.y + 10);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let found: string | null = null;
    for (const [id, pos] of Object.entries(positionsRef.current)) {
      const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
      if (dist < 35) { found = id; break; }
    }
    setHoveredNode(found);
  };

  const loadGraph = async (reportId: number) => {
    setSelectedReport(reportId);
    setLoading(true);
    setGraph(null);
    try {
      const res = await axios.get(`http://localhost:8000/api/graph/${reportId}`);
      setGraph(res.data);
    } catch { console.error("Failed to load graph"); }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px", maxWidth: "1100px", margin: "0 auto" }} className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <p className="mono" style={{ color: "var(--accent-purple)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "8px" }}>
          // ATTACK GRAPH VISUALIZATION
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
          Threat <span style={{ color: "var(--accent-purple)" }}>Relationship</span> Map
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
          Neo4j-powered attack path visualization
        </p>
      </div>

      {/* Report selector */}
      <div className="glow-card" style={{ padding: "20px", marginBottom: "20px" }}>
        <p className="mono" style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "12px" }}>
          SELECT REPORT TO VISUALIZE
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => loadGraph(r.id)}
              className={selectedReport === r.id ? "btn-cyan" : ""}
              style={selectedReport !== r.id ? {
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s",
              } : {}}
            >
              {r.filename}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        {Object.entries(NODE_COLORS).filter(([k]) => k !== "Unknown").map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>{type}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="glow-card" style={{ padding: "4px", position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <p className="mono" style={{ color: "var(--accent-cyan)", fontSize: "12px" }}>[ LOADING GRAPH... ]</p>
          </div>
        )}
        {!loading && !graph && (
          <div style={{ height: "500px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="mono" style={{ color: "var(--text-muted)", fontSize: "12px" }}>&gt; SELECT A REPORT TO VISUALIZE</p>
          </div>
        )}
        {!loading && graph && graph.nodes.length === 0 && (
          <div style={{ height: "500px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="mono" style={{ color: "var(--text-muted)", fontSize: "12px" }}>&gt; NO GRAPH DATA. RE-ANALYZE THE REPORT.</p>
          </div>
        )}
        {!loading && graph && graph.nodes.length > 0 && (
          <canvas
            ref={canvasRef}
            width={1060}
            height={520}
            onMouseMove={handleMouseMove}
            style={{ width: "100%", borderRadius: "10px", cursor: hoveredNode ? "pointer" : "default" }}
          />
        )}
      </div>
    </main>
  );
}