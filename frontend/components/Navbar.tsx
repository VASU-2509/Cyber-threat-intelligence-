"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/chat", label: "RAG Chat" },
    { href: "/graph", label: "Attack Graph" },
    { href: "/agents", label: "AI Agents" },
  ];

  return (
    <nav
      className="scanline"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--accent-cyan)",
            boxShadow: "0 0 8px var(--accent-cyan)",
          }}
        />
        <span
          className="mono"
          style={{
            color: "var(--accent-cyan)",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "0.05em",
          }}
        >
          CTI_PLATFORM
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            marginLeft: "4px",
          }}
        >
          v1.0
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                background: active ? "var(--accent-cyan-dim)" : "transparent",
                border: active ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "6px 14px",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s",
        }}
      >
        {theme === "dark" ? "☀ Light" : "⬛ Dark"}
      </button>
    </nav>
  );
}