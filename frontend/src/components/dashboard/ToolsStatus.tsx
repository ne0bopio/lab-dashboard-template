"use client";

const STATUS_COLOR: Record<string, { dot: string; label: string }> = {
  active:   { dot: "#39ff14", label: "#39ff14" },
  inactive: { dot: "#445566", label: "#445566" },
  error:    { dot: "#ff2052", label: "#ff2052" },
  degraded: { dot: "#ffb347", label: "#ffb347" },
};
const FALLBACK_COLOR = { dot: "#445566", label: "#445566" };

export function ToolsStatus({ tools }: { tools: any[] }) {
  return (
    <div
      className="rounded-lg p-4 h-full"
      style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="mono-label" style={{ color: "#ffb347", fontSize: "0.65rem" }}>
          ◈ TOOLS STATUS
        </span>
        <span className="mono-label" style={{ fontSize: "0.55rem", color: "#445566" }}>
          {tools.filter(t => t.status === "active").length}/{tools.length} ACTIVE
        </span>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
      >
        {tools.map(tool => {
          const sc = STATUS_COLOR[tool.status] || FALLBACK_COLOR;
          return (
            <div
              key={tool.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-bg-raised"
              style={{ border: "1px solid rgba(30,45,61,0.5)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: sc.dot, boxShadow: tool.status === "active" ? `0 0 4px ${sc.dot}` : "none" }}
              />
              <span
                className="font-mono truncate"
                style={{ fontSize: "0.65rem", color: tool.status === "active" ? "#8899aa" : "#445566" }}
              >
                {tool.emoji} {tool.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
