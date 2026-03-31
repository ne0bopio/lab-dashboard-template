"use client";
import { useQuery } from "@tanstack/react-query";
import { getAgents } from "@/lib/api";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageTitle } from "@/components/ui/PageTitle";

export default function AgentsPage() {
  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: getAgents,
  });

  const list = Array.isArray(agents) ? agents : [];

  return (
    <PageTransition>
    <div className="p-4">
      <PageTitle title="Agents" />
      <h1 className="font-mono text-lg font-bold mb-2" style={{ fontFamily: "Orbitron, monospace", color: "#ffb347", fontSize: "1rem" }}>
        ◈ AGENT ROSTER
      </h1>
      <p className="font-mono text-xs mb-6" style={{ color: "#445566", fontSize: "0.65rem" }}>
        {list.length} AGENTS REGISTERED
      </p>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a: any) => (
          <div key={a.id || a.slug} className="p-3 rounded transition-all hover:-translate-y-0.5" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{a.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-mono font-bold text-xs" style={{ color: "#e8eaed" }}>{a.name}</div>
                <div className="font-mono text-xs truncate" style={{ color: "#8899aa", fontSize: "0.65rem" }}>{a.role}</div>
              </div>
              <span
                className="px-1.5 py-0.5 rounded font-mono shrink-0"
                style={{
                  background: a.status === "running" ? "rgba(57,255,20,0.1)" : a.status === "idle" ? "rgba(255,179,71,0.1)" : "rgba(68,85,102,0.1)",
                  color: a.status === "running" ? "#39ff14" : a.status === "idle" ? "#ffb347" : "#445566",
                  border: `1px solid ${a.status === "running" ? "rgba(57,255,20,0.2)" : a.status === "idle" ? "rgba(255,179,71,0.2)" : "#1e2d3d"}`,
                  fontSize: "0.5rem",
                  letterSpacing: "0.1em",
                }}
              >
                {(a.status || "offline").toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </PageTransition>
  );
}
