"use client";
import { useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";

const AGENT_COLORS: Record<string, string> = {
  orchestrator:    "#ffb347",
  euge:      "#ff6b9d",
  frida:     "#bf5fff",
  kirby:     "#00e5ff",
  midas:     "#39ff14",
  anonymous: "#ff6b35",
  anon:      "#ff6b35",
  atlas:     "#4ecdc4",
  kronos:    "#a29bfe",
  smarty:    "#60a5fa",
  vault:     "#8899aa",
  einstein:  "#74b9ff",
};

const EVENT_ICONS: Record<string, string> = {
  stage_advanced:  "→",
  stage_blocked:   "✗",
  idea_created:    "⚡",
  idea_archived:   "◻",
  agent_assigned:  "◈",
  comment_added:   "·",
  score_updated:   "▲",
};

function toHHMMSS(iso: string): string {
  try { return new Date(iso).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  catch { return "—"; }
}

function timeAgo(iso: string): string {
  try {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m`;
    return `${Math.floor(s/3600)}h`;
  } catch { return "—"; }
}

// Normalize backend event (pipeline event) or mock activity event
function normalizeEvent(ev: any): { id: string; ts: string; agent: string; action: string } {
  // Backend pipeline event
  if (ev.event_type) {
    const icon = EVENT_ICONS[ev.event_type] || "·";
    let action = ev.notes || ev.event_type.replace(/_/g, " ");
    if (ev.from_stage && ev.to_stage && ev.from_stage !== ev.to_stage) {
      action = `Idea ${ev.from_stage} → ${ev.to_stage}`;
    }
    return { id: ev.id, ts: ev.timestamp, agent: ev.triggered_by || "system", action: `${icon} ${action}` };
  }
  // Mock activity event
  return { id: ev.id, ts: ev.timestamp, agent: ev.agent_slug || "system", action: `${ev.agent_emoji || ""} ${ev.action}` };
}

export function ActivityFeed({ events }: { events: any[] }) {
  const [paused, setPaused] = useState(false);
  const [items, setItems]   = useState<any[]>(events);

  // Sync with parent when not paused
  if (!paused && JSON.stringify(events.map(e=>e.id)) !== JSON.stringify(items.map(e=>e.id))) {
    setItems(events);
  }

  const normalized = items.map(normalizeEvent);

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold" style={{ color: "#ffb347", fontSize: "0.65rem", letterSpacing: "0.12em" }}>
            ◈ LIVE ACTIVITY
          </span>
          {!paused && (
            <span className="flex items-center gap-1" style={{ color: "#39ff14" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#39ff14", boxShadow: "0 0 4px #39ff14", animation: "pulse 1.5s ease-in-out infinite" }} />
              <span className="font-mono" style={{ fontSize: "0.52rem", letterSpacing: "0.08em" }}>LIVE</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className="flex items-center gap-1 px-2 py-0.5 rounded font-mono transition-all"
            style={{ background: "rgba(255,179,71,0.06)", color: "#445566", border: "1px solid #1e2d3d", fontSize: "0.58rem" }}
          >
            {paused ? <Play size={8} /> : <Pause size={8} />}
            <span>{paused ? "RESUME" : "PAUSE"}</span>
          </button>
          <button
            onClick={() => setItems([])}
            className="flex items-center gap-1 px-2 py-0.5 rounded font-mono transition-all"
            style={{ background: "rgba(255,32,82,0.06)", color: "#445566", border: "1px solid #1e2d3d", fontSize: "0.58rem" }}
          >
            <Trash2 size={8} />
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 200 }}>
        {normalized.length === 0 ? (
          <div className="font-mono text-center py-6" style={{ color: "#445566", fontSize: "0.62rem", letterSpacing: "0.08em" }}>
            NO ACTIVITY
          </div>
        ) : (
          normalized.map(ev => {
            const agentColor = AGENT_COLORS[ev.agent.toLowerCase()] || "#8899aa";
            return (
              <div
                key={ev.id}
                className="flex items-center gap-2 py-1 px-2 rounded transition-colors hover:bg-bg-raised"
                style={{ borderBottom: "1px solid rgba(30,45,61,0.4)" }}
              >
                <span className="font-mono shrink-0 tabular-nums" style={{ fontSize: "0.58rem", color: "#445566", width: 54 }}>
                  {toHHMMSS(ev.ts)}
                </span>
                <span className="font-mono shrink-0 font-semibold" style={{ fontSize: "0.62rem", color: agentColor, width: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.agent.toUpperCase()}
                </span>
                <span className="font-mono flex-1 truncate" style={{ color: "#8899aa", fontSize: "0.68rem" }}>
                  {ev.action}
                </span>
                <span className="font-mono shrink-0" style={{ fontSize: "0.52rem", color: "#445566" }}>
                  {timeAgo(ev.ts)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
