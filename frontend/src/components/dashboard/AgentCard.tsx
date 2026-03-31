"use client";
import { memo } from "react";
import { Sparkline } from "@/components/ui/Sparkline";
import { MessageSquare, ScrollText, Wifi, WifiOff } from "lucide-react";

// Handles both mock Agent type and real API agent shape
export type AgentStatus = "running" | "idle" | "thinking" | "offline" | "error" | "paused";

const STATUS_CONFIG: Record<string, {
  label: string; dot: string; border: string; shadow: string; sparkColor: string;
}> = {
  running:  { label: "ONLINE",   dot: "#39ff14", border: "rgba(57,255,20,0.3)",   shadow: "0 0 16px rgba(57,255,20,0.15)",   sparkColor: "#39ff14" },
  online:   { label: "ONLINE",   dot: "#39ff14", border: "rgba(57,255,20,0.3)",   shadow: "0 0 16px rgba(57,255,20,0.15)",   sparkColor: "#39ff14" },
  idle:     { label: "IDLE",     dot: "#ffb347", border: "rgba(255,179,71,0.2)",  shadow: "0 0 16px rgba(255,179,71,0.08)",  sparkColor: "#ffb347" },
  thinking: { label: "THINKING", dot: "#bf5fff", border: "rgba(191,95,255,0.4)",  shadow: "0 0 16px rgba(191,95,255,0.2)",  sparkColor: "#bf5fff" },
  offline:  { label: "OFFLINE",  dot: "#445566", border: "#1e2d3d",               shadow: "none",                            sparkColor: "#445566" },
  error:    { label: "ERROR",    dot: "#ff2052", border: "rgba(255,32,82,0.5)",   shadow: "0 0 16px rgba(255,32,82,0.2)",   sparkColor: "#ff2052" },
  paused:   { label: "PAUSED",   dot: "#bf5fff", border: "rgba(191,95,255,0.3)",  shadow: "0 0 16px rgba(191,95,255,0.15)", sparkColor: "#bf5fff" },
};

function StatusDot({ status, size = 8 }: { status: string; size?: number }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["offline"];
  const pulse = ["running", "error", "thinking"].includes(status);
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: cfg.dot,
            animation: "pulseRing 2s ease-out infinite",
            opacity: 0.5,
          }}
        />
      )}
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
      />
    </span>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const AgentCard = memo(function AgentCard({ agent, wide = false }: { agent: any; wide?: boolean }) {
  // Normalize status — backend may return values not in our config
  const rawStatus = (agent.status || "offline").toLowerCase();
  const status = STATUS_CONFIG[rawStatus] ? rawStatus : "offline";
  const cfg = STATUS_CONFIG[status];
  const offline = status === "offline";
  const thinking = status === "thinking";

  // Build sparkline from metrics or generate random-ish from uptime
  const sparkData: number[] = agent.activity ||
    (agent.metrics?.tasks_completed_24h
      ? Array.from({ length: 20 }, (_, i) => Math.max(0, Math.floor(Math.random() * (agent.metrics.tasks_completed_24h + 1))))
      : Array(20).fill(0));

  return (
    <div
      className={`relative rounded-lg p-3 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group
        ${offline ? "opacity-50" : "opacity-100"}
        ${thinking ? "thinking-shimmer" : ""}
      `}
      style={{
        background: "#0d1117",
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.shadow,
        gridColumn: wide ? "span 2" : "span 1",
      }}
    >
      {/* Error flash bar */}
      {status === "error" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg animate-pulse" style={{ background: "#ff2052" }} />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="font-mono font-bold" style={{ color: "#e8eaed", fontSize: "0.75rem", letterSpacing: "0.02em" }}>
            {agent.emoji || "◈"} {agent.name?.toUpperCase()}
          </span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded font-mono font-bold"
          style={{
            background: `${cfg.dot}15`,
            color: cfg.dot,
            border: `1px solid ${cfg.dot}30`,
            fontSize: "0.52rem",
            letterSpacing: "0.1em",
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Role */}
      <div className="font-mono truncate" style={{ color: "#8899aa", fontSize: "0.6rem", letterSpacing: "0.02em" }}>
        {agent.role?.split("—").pop()?.trim() || agent.role || "—"}
      </div>

      {/* Current task */}
      <div
        className="rounded px-2 py-1.5 min-h-[2.5rem] flex items-center"
        style={{ background: "#111820", border: "1px solid #1e2d3d" }}
      >
        {agent.current_task ? (
          <span style={{ color: "#00e5ff", fontSize: "0.68rem", fontFamily: "JetBrains Mono" }}>
            {agent.current_task}
          </span>
        ) : (
          <span style={{ color: "#445566", fontSize: "0.68rem", fontFamily: "JetBrains Mono" }}>
            {offline ? "— OFFLINE —" : "— IDLE —"}
          </span>
        )}
      </div>

      {/* Metrics row */}
      {agent.metrics && (
        <div className="flex gap-3">
          {[
            { label: "TASKS/24H", value: agent.metrics.tasks_completed_24h ?? "—" },
            { label: "LAST SEEN", value: timeAgo(agent.health?.last_seen || agent.metrics?.last_seen) },
            { label: "UPTIME",    value: agent.health?.uptime_percent != null ? `${agent.health.uptime_percent}%` : "—" },
          ].map(m => (
            <div key={m.label}>
              <div className="font-mono" style={{ fontSize: "0.5rem", color: "#445566", letterSpacing: "0.08em" }}>{m.label}</div>
              <div className="font-mono font-bold" style={{ fontSize: "0.62rem", color: cfg.sparkColor }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sparkline */}
      <div>
        <div className="font-mono mb-0.5" style={{ fontSize: "0.5rem", color: "#445566", letterSpacing: "0.08em" }}>ACTIVITY</div>
        <Sparkline data={sparkData} color={cfg.sparkColor} />
      </div>

      {/* Hover actions */}
      <div className="flex gap-1.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded font-mono transition-all"
          style={{ background: "rgba(255,179,71,0.08)", color: "#ffb347", border: "1px solid rgba(255,179,71,0.2)", fontSize: "0.55rem", letterSpacing: "0.08em" }}
        >
          <ScrollText size={9} /> LOGS
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded font-mono transition-all"
          style={{ background: "rgba(0,229,255,0.08)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.2)", fontSize: "0.55rem", letterSpacing: "0.08em" }}
        >
          <MessageSquare size={9} /> MSG
        </button>
        <button
          className="flex items-center justify-center gap-1 px-2 py-1 rounded font-mono transition-all"
          style={{ background: offline ? "rgba(255,32,82,0.08)" : "rgba(57,255,20,0.08)", color: offline ? "#ff2052" : "#39ff14", border: `1px solid ${offline ? "rgba(255,32,82,0.2)" : "rgba(57,255,20,0.2)"}`, fontSize: "0.55rem" }}
        >
          {offline ? <WifiOff size={9} /> : <Wifi size={9} />}
        </button>
      </div>
    </div>
  );
});
