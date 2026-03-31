"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AGENT_EMOJI: Record<string, string> = {
  euge: "🔍",
  frida: "🎨",
  kirby: "💻",
  anonymous: "🕵️",
};

function daysInStage(stageHistory: any[], currentStage: string): string {
  if (!stageHistory || stageHistory.length === 0) return "0d";
  const entry = [...stageHistory].reverse().find((e: any) => e.stage === currentStage);
  if (!entry?.entered_at) return "0d";
  const ms = Date.now() - new Date(entry.entered_at).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return "<1h";
}

export interface WebsiteProject {
  id: string;
  client_name: string;
  business_type?: string;
  industry?: string;
  needs?: string;
  competitors?: string;
  stage: string;
  assigned_to?: string;
  budget?: string;
  timeline?: string;
  preview_url?: string;
  discovery_doc_id?: string;
  design_doc_id?: string;
  code_review_status?: string;
  stage_history?: any[];
  created_at: string;
  updated_at: string;
  notes?: string;
}

export function WebsiteCard({
  project,
  stageColor,
  isDragging = false,
  onClick,
}: {
  project: WebsiteProject;
  stageColor: string;
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const days = daysInStage(project.stage_history || [], project.stage);
  const agentEmoji = project.assigned_to ? (AGENT_EMOJI[project.assigned_to] || "👤") : "";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="rounded-lg p-3 cursor-pointer transition-all hover:-translate-y-0.5 group relative"
        style={{
          background: "#0d1117",
          border: `1px solid ${stageColor}25`,
          borderLeft: `3px solid ${stageColor}`,
          boxShadow: `0 0 8px ${stageColor}08`,
        }}
        onClick={onClick}
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

        {/* Client name */}
        <div className="font-mono font-bold mb-1.5 pr-4" style={{ color: "#e8eaed", fontSize: "0.78rem", lineHeight: 1.4 }}>
          {project.client_name}
        </div>

        {/* Industry tag */}
        {project.industry && (
          <div className="mb-2">
            <span
              className="px-1.5 py-0.5 rounded font-mono"
              style={{
                background: `${stageColor}10`,
                color: `${stageColor}90`,
                fontSize: "0.52rem",
                letterSpacing: "0.06em",
                border: `1px solid ${stageColor}20`,
              }}
            >
              {project.industry}
            </span>
          </div>
        )}

        {/* Needs (truncated) */}
        {project.needs && (
          <p
            className="font-body text-xs mb-2 line-clamp-2"
            style={{ color: "#8899aa", fontSize: "0.65rem", lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}
          >
            {project.needs}
          </p>
        )}

        {/* Linked docs indicators */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {project.discovery_doc_id && (
            <span className="font-mono px-1 py-0.5 rounded" style={{ background: "#00e5ff10", color: "#00e5ff80", fontSize: "0.48rem", border: "1px solid #00e5ff20" }}>
              📄 DISCOVERY
            </span>
          )}
          {project.design_doc_id && (
            <span className="font-mono px-1 py-0.5 rounded" style={{ background: "#ff2d8a10", color: "#ff2d8a80", fontSize: "0.48rem", border: "1px solid #ff2d8a20" }}>
              🎨 DESIGN
            </span>
          )}
          {project.code_review_status && (
            <span className="font-mono px-1 py-0.5 rounded" style={{ background: "#39ff1410", color: "#39ff1480", fontSize: "0.48rem", border: "1px solid #39ff1420" }}>
              🔍 REVIEW: {project.code_review_status.toUpperCase()}
            </span>
          )}
          {project.preview_url && (
            <span className="font-mono px-1 py-0.5 rounded" style={{ background: "#2979ff10", color: "#2979ff80", fontSize: "0.48rem", border: "1px solid #2979ff20" }}>
              🌐 PREVIEW
            </span>
          )}
        </div>

        {/* Footer: agent + days in stage */}
        <div className="flex items-center justify-between">
          <span className="font-mono" style={{ fontSize: "0.58rem", color: "#445566" }}>
            {project.assigned_to ? `${agentEmoji} ${project.assigned_to}` : "— unassigned"}
          </span>
          <span className="font-mono" style={{ fontSize: "0.58rem", color: "#445566" }}>
            {days}
          </span>
        </div>
      </div>
    </div>
  );
}

// Overlay version (shown while dragging)
export function WebsiteCardOverlay({ project, stageColor }: { project: WebsiteProject; stageColor: string }) {
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
        {project.client_name}
      </div>
      {project.industry && (
        <div className="font-mono mt-1" style={{ color: stageColor, fontSize: "0.55rem" }}>
          {project.industry}
        </div>
      )}
    </div>
  );
}
