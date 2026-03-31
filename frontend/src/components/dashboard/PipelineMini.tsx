"use client";
import type { IdeaStage } from "@/lib/mock-data";
import Link from "next/link";

const IDEA_ROOM_STAGES: { key: IdeaStage; label: string; color: string }[] = [
  { key: "raw",           label: "RAW",   color: "#ffb347" },
  { key: "research",      label: "RSRCH", color: "#00e5ff" },
  { key: "validation",    label: "VALID", color: "#bf5fff" },
  { key: "business_plan", label: "BPLAN", color: "#39ff14" },
  { key: "approved",      label: "APRVD", color: "#22c55e" },
];

const DEV_ROOM_STAGES: { key: IdeaStage; label: string; color: string }[] = [
  { key: "queue",       label: "QUEUE", color: "#ffb347" },
  { key: "design",      label: "DESGN", color: "#ff2d8a" },
  { key: "development", label: "DEVLP", color: "#2979ff" },
  { key: "testing",     label: "TEST",  color: "#f59e0b" },
  { key: "launched",    label: "LNCHD", color: "#22c55e" },
];

function StageBar({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 8 : 0) : 0;
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-mono shrink-0"
        style={{ fontSize: "0.58rem", color: count > 0 ? color : "#2a3a4a", letterSpacing: "0.06em", width: "2.8rem" }}
      >
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#111820" }}>
        {count > 0 && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: color,
              boxShadow: `0 0 5px ${color}50`,
            }}
          />
        )}
      </div>
      <span
        className="font-mono shrink-0 text-right"
        style={{ fontSize: "0.58rem", color: count > 0 ? color : "#2a3a4a", width: "1rem" }}
      >
        {count}
      </span>
    </div>
  );
}

function RoomLabel({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 font-mono mt-2 mb-1.5"
      style={{ fontSize: "0.55rem", letterSpacing: "0.1em", color }}
    >
      <span>{emoji}</span>
      <span style={{ color: "#445566" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "#1e2d3d", marginLeft: "4px" }} />
    </div>
  );
}

export function PipelineMini({ pipeline }: { pipeline: Record<IdeaStage, number> }) {
  const ideaRoomTotal = IDEA_ROOM_STAGES.reduce((a, s) => a + (pipeline[s.key] || 0), 0);
  const devRoomTotal  = DEV_ROOM_STAGES.reduce((a, s)  => a + (pipeline[s.key] || 0), 0);
  const grandTotal    = ideaRoomTotal + devRoomTotal;

  // Find the "hottest" idea — highest count in most advanced stage
  let hotStage: string | null = null;
  let hotLabel = "";
  // Walk dev stages first (more exciting), then idea stages backward
  const allStages = [...DEV_ROOM_STAGES, ...IDEA_ROOM_STAGES].reverse();
  for (const s of allStages) {
    if ((pipeline[s.key] || 0) > 0) {
      hotStage = s.key;
      hotLabel = s.label;
      break;
    }
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-2 h-full"
      style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono" style={{ color: "#ffb347", fontSize: "0.65rem", letterSpacing: "0.06em" }}>
            ◈ IDEA PIPELINE
          </span>
          <span
            className="font-mono px-1 py-0.5 rounded flex items-center gap-1"
            style={{
              background: "rgba(0,229,255,0.08)",
              color: "#00e5ff",
              border: "1px solid rgba(0,229,255,0.15)",
              fontSize: "0.5rem",
              letterSpacing: "0.06em",
            }}
            title="Auto-advance enabled — ideas advance automatically when all required fields are complete"
          >
            ⚡ AUTO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,179,71,0.08)",
              color: "#ffb347",
              border: "1px solid rgba(255,179,71,0.15)",
              fontSize: "0.55rem",
            }}
          >
            {grandTotal} ACTIVE
          </span>
          <Link href="/ideas" className="font-mono hover:opacity-80 transition-opacity" style={{ fontSize: "0.55rem", color: "#445566" }}>
            VIEW ALL →
          </Link>
        </div>
      </div>

      {/* IDEA ROOM */}
      <RoomLabel emoji="💡" label="IDEA ROOM" color="#ffb347" />
      <div className="flex flex-col gap-1.5">
        {IDEA_ROOM_STAGES.map(({ key, label, color }) => (
          <StageBar
            key={key}
            label={label}
            count={pipeline[key] || 0}
            color={color}
            total={ideaRoomTotal || 1}
          />
        ))}
      </div>

      {/* DEV ROOM */}
      <RoomLabel emoji="🔧" label="DEV ROOM" color="#2979ff" />
      <div className="flex flex-col gap-1.5">
        {DEV_ROOM_STAGES.map(({ key, label, color }) => (
          <StageBar
            key={key}
            label={label}
            count={pipeline[key] || 0}
            color={color}
            total={devRoomTotal || 1}
          />
        ))}
      </div>

      {/* Hot idea */}
      <div
        className="rounded p-2 mt-auto"
        style={{ background: "#111820", border: "1px solid rgba(255,179,71,0.1)" }}
      >
        <div className="font-mono mb-1" style={{ fontSize: "0.5rem", color: "#445566", letterSpacing: "0.08em" }}>
          HOT
        </div>
        <div className="font-mono truncate" style={{ color: "#ffb347", fontSize: "0.68rem" }}>
          ⚡ Van Ads Booking System → {hotLabel || "DESIGN"}
        </div>
      </div>
    </div>
  );
}
