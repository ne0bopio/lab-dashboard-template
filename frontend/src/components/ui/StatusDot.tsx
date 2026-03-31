"use client";
import type { AgentStatus } from "@/lib/mock-data";

const STATUS_CONFIG: Record<AgentStatus, { color: string; label: string; pulse: boolean }> = {
  running: { color: "#39ff14", label: "ONLINE",   pulse: true  },
  idle:    { color: "#ffb347", label: "IDLE",     pulse: false },
  error:   { color: "#ff2052", label: "ERROR",    pulse: true  },
  offline: { color: "#445566", label: "OFFLINE",  pulse: false },
  paused:  { color: "#bf5fff", label: "PAUSED",   pulse: true  },
};

export function StatusDot({ status, showLabel = false, size = 8 }: {
  status: AgentStatus;
  showLabel?: boolean;
  size?: number;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-block" style={{ width: size, height: size }}>
        {cfg.pulse && (
          <span
            className="absolute inset-0 rounded-full opacity-60 status-pulse-ring"
            style={{ background: cfg.color }}
          />
        )}
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
        />
      </span>
      {showLabel && (
        <span className="mono-label" style={{ color: cfg.color, fontSize: "0.6rem" }}>
          {cfg.label}
        </span>
      )}
    </span>
  );
}
