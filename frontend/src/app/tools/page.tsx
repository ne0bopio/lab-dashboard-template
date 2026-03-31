"use client";
import { useQuery } from "@tanstack/react-query";
import { getTools } from "@/lib/api";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageTitle } from "@/components/ui/PageTitle";

const STATUS_DOT: Record<string, string> = {
  active: "#39ff14", inactive: "#445566", error: "#ff2052", degraded: "#ffb347",
};

export default function ToolsPage() {
  const { data: tools } = useQuery({
    queryKey: ["tools"],
    queryFn: getTools,
  });

  const list = Array.isArray(tools) ? tools : [];

  return (
    <PageTransition>
    <div className="p-4">
      <PageTitle title="Tools" />
      <h1 className="font-mono text-lg font-bold mb-6" style={{ fontFamily: "Orbitron, monospace", color: "#ffb347", fontSize: "1rem" }}>
        ◈ TOOLS REGISTRY
      </h1>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t: any) => (
          <div key={t.id || t.slug} className="flex items-center gap-3 p-3 rounded transition-all hover:-translate-y-0.5" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[t.status] || "#445566", boxShadow: t.status === "active" ? `0 0 4px ${STATUS_DOT.active}` : "none" }} />
            <span className="text-base">{t.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-bold truncate" style={{ color: "#e8eaed" }}>{t.name}</div>
              <div className="font-mono truncate" style={{ color: "#445566", fontSize: "0.6rem" }}>{(t.type || "—").toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </PageTransition>
  );
}
