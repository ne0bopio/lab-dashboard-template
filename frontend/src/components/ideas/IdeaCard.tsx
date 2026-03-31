"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";

const PRIORITY_DOT: Record<string, { color: string; pulse: boolean }> = {
  low:      { color: "#445566", pulse: false },
  medium:   { color: "#ffb347", pulse: false },
  high:     { color: "#ff2052", pulse: false },
  critical: { color: "#ff2052", pulse: true  },
};

const DEV_ROOM_STAGES = new Set(["approved", "design", "development", "testing", "launched"]);

const STATUS_STYLE: Record<string, { color: string; pulse: boolean; label: string }> = {
  pending:     { color: "#445566", pulse: false, label: "pending" },
  in_progress: { color: "#f59e0b", pulse: true,  label: "in prog" },
  done:        { color: "#22c55e", pulse: false, label: "done"    },
};

function timeInStage(updated_at: string): string {
  const s = Math.floor((Date.now() - new Date(updated_at).getTime()) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return "<1h";
}

function BlueprintSection({ blueprint }: { blueprint: any }) {
  const designStyle = STATUS_STYLE[blueprint.design_status] || STATUS_STYLE.pending;
  const devStyle    = STATUS_STYLE[blueprint.dev_status]    || STATUS_STYLE.pending;

  return (
    <div
      className="mt-2 pt-2"
      style={{ borderTop: "1px solid #1e2d3d" }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Design agent status */}
        <span className="font-mono flex items-center gap-1" style={{ fontSize: "0.58rem" }}>
          <span>🎨</span>
          <span style={{ color: "#8899aa" }}>Frida:</span>
          <span
            style={{
              color: designStyle.color,
              textShadow: designStyle.pulse ? `0 0 6px ${designStyle.color}80` : "none",
            }}
          >
            {designStyle.pulse && (
              <span
                className="inline-block w-1 h-1 rounded-full mr-0.5 animate-pulse"
                style={{ background: designStyle.color, verticalAlign: "middle" }}
              />
            )}
            {designStyle.label}
          </span>
        </span>

        {/* Dev agent status */}
        <span className="font-mono flex items-center gap-1" style={{ fontSize: "0.58rem" }}>
          <span>💻</span>
          <span style={{ color: "#8899aa" }}>Kirby:</span>
          <span
            style={{
              color: devStyle.color,
              textShadow: devStyle.pulse ? `0 0 6px ${devStyle.color}80` : "none",
            }}
          >
            {devStyle.pulse && (
              <span
                className="inline-block w-1 h-1 rounded-full mr-0.5 animate-pulse"
                style={{ background: devStyle.color, verticalAlign: "middle" }}
              />
            )}
            {devStyle.label}
          </span>
        </span>
      </div>

      {/* Product type tag */}
      {blueprint.product_type && (
        <div className="mt-1">
          <span
            className="font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(41,121,255,0.1)",
              color: "#2979ff",
              border: "1px solid rgba(41,121,255,0.2)",
              fontSize: "0.52rem",
              letterSpacing: "0.06em",
            }}
          >
            📦 {blueprint.product_type}
          </span>
        </div>
      )}
    </div>
  );
}

export function IdeaCard({
  idea,
  stageColor,
  isDragging = false,
}: {
  idea: any;
  stageColor: string;
  isDragging?: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: idea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const pd = PRIORITY_DOT[idea.priority] || PRIORITY_DOT.medium;
  const showBlueprint = idea.blueprint && DEV_ROOM_STAGES.has(idea.stage);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div
        className="rounded-lg p-3 cursor-pointer transition-all hover:-translate-y-0.5 group relative"
        style={{
          background: "#0d1117",
          border: `1px solid ${stageColor}25`,
          borderLeft: `3px solid ${stageColor}`,
          boxShadow: `0 0 8px ${stageColor}08`,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${stageColor}20`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 8px ${stageColor}08`; }}
      >
        {/* Drag handle */}
        <div
          {...listeners}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity"
          style={{ color: stageColor, fontSize: "0.7rem" }}
        >
          ⠿
        </div>

        {/* Title + priority */}
        <div className="flex items-start gap-2 mb-2 pr-4">
          <div className="relative flex-shrink-0 mt-1">
            {pd.pulse && (
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: pd.color, opacity: 0.4 }} />
            )}
            <span className="relative block w-1.5 h-1.5 rounded-full" style={{ background: pd.color }} />
          </div>
          <button
            onClick={() => router.push(`/ideas/${idea.id}`)}
            className="font-mono font-bold text-left hover:underline"
            style={{ color: "#e8eaed", fontSize: "0.78rem", lineHeight: 1.4 }}
          >
            {idea.title}
          </button>
        </div>

        {/* Description */}
        {idea.description && (
          <p className="font-body text-xs mb-2 line-clamp-2" style={{ color: "#8899aa", fontSize: "0.68rem", lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}>
            {idea.description}
          </p>
        )}

        {/* Tags — collapsed by default, show 1 tag max */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="px-1.5 py-0.5 rounded" style={{ background: `${stageColor}08`, color: `${stageColor}80`, fontSize: "0.5rem", fontFamily: "JetBrains Mono, monospace" }}>
              #{idea.tags[0]}{idea.tags.length > 1 ? ` +${idea.tags.length - 1}` : ""}
            </span>
          </div>
        )}

        {/* Footer: agent + time */}
        <div className="flex items-center justify-between">
          <span className="font-mono" style={{ fontSize: "0.58rem", color: "#445566" }}>
            {idea.assigned_to ? `→ ${idea.assigned_to}` : "— unassigned"}
          </span>
          <span className="font-mono" style={{ fontSize: "0.58rem", color: "#445566" }}>
            {timeInStage(idea.updated_at)}
          </span>
        </div>

        {/* Blueprint section — only for approved + dev room stages */}
        {showBlueprint && <BlueprintSection blueprint={idea.blueprint} />}
      </div>
    </div>
  );
}

// Overlay version (shown while dragging)
export function IdeaCardOverlay({ idea, stageColor }: { idea: any; stageColor: string }) {
  return (
    <div
      className="rounded-lg p-3 shadow-2xl rotate-2"
      style={{
        background: "#111820",
        border: `1px solid ${stageColor}60`,
        borderLeft: `3px solid ${stageColor}`,
        boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 20px ${stageColor}30`,
        opacity: 0.95,
        minWidth: 200,
      }}
    >
      <div className="font-mono font-bold" style={{ color: "#e8eaed", fontSize: "0.78rem" }}>
        {idea.title}
      </div>
    </div>
  );
}
