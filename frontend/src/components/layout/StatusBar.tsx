"use client";
import { useState, useEffect } from "react";

export function StatusBar({
  agentCount   = 0,
  activeAgents = 0,
  ideasCount   = 0,
  toolsCount   = 0,
  pollingInterval = 15,
}: {
  agentCount?: number;
  activeAgents?: number;
  ideasCount?: number;
  toolsCount?: number;
  pollingInterval?: number;
}) {
  const [uptime, setUptime] = useState("");
  const [pulse, setPulse]   = useState(false);

  useEffect(() => {
    const start = new Date("2026-03-01T00:00:00Z").getTime();
    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      setUptime(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Poll indicator
  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    }, pollingInterval * 1000);
    return () => clearInterval(id);
  }, [pollingInterval]);

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        height: 28,
        paddingLeft: "1rem",
        paddingRight: "1rem",
        background: "rgba(8,11,15,0.98)",
        borderTop: "1px solid #1e2d3d",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.06em",
      }}
    >
      {/* Left: system status */}
      <div className="flex items-center gap-4">
        <span style={{ color: "#39ff14", textShadow: "0 0 6px rgba(57,255,20,0.4)" }}>
          ● SYSTEM: ONLINE
        </span>
        <span style={{ color: "#1e2d3d" }}>|</span>
        <span style={{ color: "#445566" }}>
          UPTIME {uptime}
        </span>
      </div>

      {/* Center: live counts */}
      <div className="flex items-center gap-5">
        <span>
          <span style={{ color: "#39ff14" }}>{activeAgents}</span>
          <span style={{ color: "#445566" }}>/{agentCount} AGENTS</span>
        </span>
        <span>
          <span style={{ color: "#ffb347" }}>{ideasCount}</span>
          <span style={{ color: "#445566" }}> IDEAS</span>
        </span>
        <span>
          <span style={{ color: "#bf5fff" }}>{toolsCount}</span>
          <span style={{ color: "#445566" }}> TOOLS</span>
        </span>
      </div>

      {/* Right: model + poll indicator */}
      <div className="flex items-center gap-3">
        <span style={{ color: "#445566" }}>claude-sonnet-4-6</span>
        <span
          className="flex items-center gap-1"
          style={{ color: pulse ? "#00e5ff" : "#445566", transition: "color 0.2s" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: pulse ? "#00e5ff" : "#445566", boxShadow: pulse ? "0 0 4px #00e5ff" : "none", transition: "all 0.2s" }}
          />
          POLL/{pollingInterval}s
        </span>
      </div>
    </footer>
  );
}
