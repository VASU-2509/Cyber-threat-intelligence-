"use client";
import { useState } from "react";
import { chatWithReports } from "@/services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const res = await chatWithReports(userMessage);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "[ ERROR ] Failed to get response." }]);
    }
    setLoading(false);
  };

  const suggestions = [
    "What CVEs were identified?",
    "Who is the threat actor?",
    "What are the recommendations?",
    "What IOCs were found?",
  ];

  return (
    <main style={{ minHeight: "100vh", padding: "32px", maxWidth: "860px", margin: "0 auto" }} className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <p className="mono" style={{ color: "var(--accent-cyan)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "8px" }}>
          // RAG CHAT INTERFACE
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
          Query Your <span style={{ color: "var(--accent-cyan)" }}>Reports</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
          Ask anything about your uploaded threat reports. Powered by RAG + Gemini.
        </p>
      </div>

      {/* Suggestion pills */}
      {messages.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--accent-cyan)";
                (e.target as HTMLElement).style.color = "var(--accent-cyan)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--border-color)";
                (e.target as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat window */}
      <div
        className="glow-card"
        style={{
          height: "420px",
          overflowY: "auto",
          padding: "20px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center" }}>
            <p className="mono" style={{ color: "var(--text-muted)", fontSize: "12px" }}>
              &gt; AWAITING QUERY...
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--accent-cyan-dim)",
                  border: "1px solid var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "var(--accent-cyan)",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                  marginRight: "10px",
                  marginTop: "2px",
                }}
              >
                AI
              </div>
            )}
            <div
              style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: msg.role === "user" ? "var(--accent-cyan-dim)" : "var(--bg-secondary)",
                border: msg.role === "user" ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                fontFamily: msg.role === "assistant" ? "var(--font-mono)" : "var(--font-sans)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--accent-cyan-dim)",
                border: "1px solid var(--accent-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "var(--accent-cyan)",
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
              }}
            >
              AI
            </div>
            <div style={{ display: "flex", gap: "4px", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "12px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="> Ask about your threat reports..."
          style={{
            flex: 1,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-primary)",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-cyan"
          style={{ padding: "12px 24px", whiteSpace: "nowrap" }}
        >
          SEND ▶
        </button>
      </div>
    </main>
  );
}