"use client";
import { AgentCard } from "./AgentCard";
import { Plus, RefreshCw } from "lucide-react";

export function AgentGrid({ agents, onRefresh }: { agents: any[]; onRefresh?: () => void }) {
  const active  = agents.filter(a => a.status === "running").length;
  const idle    = agents.filter(a => a.status === "idle").length;
  const offline = agents.filter(a => a.status === "offline").length;
  const errored = agents.filter(a => a.status === "error").length;

  return (
    <div className="rounded-lg p-4" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold" style={{ color: "#ffb347", fontSize: "0.65rem", letterSpacing: "0.12em" }}>
            ◈ AGENT GRID
          </span>
          <div className="flex items-center gap-2">
            {active > 0 && (
              <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.2)", fontSize: "0.55rem" }}>
                {active} ACTIVE
              </span>
            )}
            {idle > 0 && (
              <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,179,71,0.08)", color: "#ffb347", border: "1px solid rgba(255,179,71,0.2)", fontSize: "0.55rem" }}>
                {idle} IDLE
              </span>
            )}
            {offline > 0 && (
              <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(68,85,102,0.1)", color: "#445566", border: "1px solid #1e2d3d", fontSize: "0.55rem" }}>
                {offline} OFFLINE
              </span>
            )}
            {errored > 0 && (
              <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,32,82,0.1)", color: "#ff2052", border: "1px solid rgba(255,32,82,0.3)", fontSize: "0.55rem" }}>
                {errored} ERROR
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono" style={{ fontSize: "0.55rem", color: "#445566" }}>
            {agents.length} REGISTERED
          </span>
          {onRefresh && (
            <button onClick={onRefresh} className="p-1 rounded transition-opacity hover:opacity-70" style={{ color: "#445566" }}>
              <RefreshCw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Grid — Orchestrator is 2-wide */}
      <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.id || agent.slug}
            agent={agent}
            wide={false /* Orchestrator 2x only on xl - handled by CSS */}
          />
        ))}

        {/* Ghost add-agent slot */}
        <div
          className="rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer opacity-30 hover:opacity-60 transition-opacity"
          style={{ border: "1px dashed #1e2d3d", minHeight: 120 }}
        >
          <Plus size={16} style={{ color: "#445566" }} />
          <span className="font-mono" style={{ fontSize: "0.55rem", color: "#445566", letterSpacing: "0.08em" }}>
            ADD AGENT
          </span>
        </div>
      </div>
    </div>
  );
}
