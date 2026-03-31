"use client";
import { useState, useEffect } from "react";
import { X, ExternalLink, FileText, Palette, Code, Clock, User, Building, Globe } from "lucide-react";
import { getWebsiteProjectHistory } from "@/lib/api";
import type { WebsiteProject } from "./WebsiteCard";

interface Props {
  project: WebsiteProject;
  stageColor: string;
  onClose: () => void;
}

const STAGE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  intake:    { label: "INTAKE",    emoji: "📥", color: "#ffb347" },
  discovery: { label: "DISCOVERY", emoji: "🔍", color: "#00e5ff" },
  design:    { label: "DESIGN",    emoji: "🎨", color: "#ff2d8a" },
  develop:   { label: "DEVELOP",   emoji: "💻", color: "#2979ff" },
  review:    { label: "REVIEW",    emoji: "🧪", color: "#bf5fff" },
  deliver:   { label: "DELIVER",   emoji: "🚀", color: "#39ff14" },
  archived:  { label: "ARCHIVED",  emoji: "📦", color: "#445566" },
};

export function WebsiteDetailModal({ project, stageColor, onClose }: Props) {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWebsiteProjectHistory(project.id)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [project.id]);

  const stageInfo = STAGE_LABELS[project.stage] || STAGE_LABELS.intake;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "rgba(8,11,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6 font-mono"
        style={{
          background: "#0d1117",
          border: `1px solid ${stageColor}35`,
          boxShadow: `0 0 40px ${stageColor}10`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded font-mono font-bold"
                style={{
                  background: `${stageInfo.color}15`,
                  color: stageInfo.color,
                  border: `1px solid ${stageInfo.color}30`,
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  textShadow: `0 0 6px ${stageInfo.color}50`,
                }}
              >
                {stageInfo.emoji} {stageInfo.label}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "Orbitron, monospace",
                color: stageColor,
                fontSize: "1.1rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textShadow: `0 0 12px ${stageColor}40`,
              }}
            >
              {project.client_name}
            </h2>
            {project.industry && (
              <p style={{ color: "#8899aa", fontSize: "0.65rem", marginTop: 4 }}>
                <Building size={10} className="inline mr-1" style={{ verticalAlign: "middle" }} />
                {project.industry} · {project.business_type || "—"}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: "#445566" }} className="hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <InfoBox icon={<Globe size={12} />} label="NEEDS" value={project.needs} color={stageColor} />
          <InfoBox icon={<User size={12} />} label="ASSIGNED TO" value={project.assigned_to || "Unassigned"} color={stageColor} />
          <InfoBox icon={<Clock size={12} />} label="BUDGET" value={project.budget || "—"} color={stageColor} />
          <InfoBox icon={<Clock size={12} />} label="TIMELINE" value={project.timeline || "—"} color={stageColor} />
        </div>

        {/* Competitors */}
        {project.competitors && (
          <div className="mb-6">
            <label className="block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa", letterSpacing: "0.1em" }}>COMPETITORS</label>
            <div className="px-3 py-2 rounded" style={{ background: "#111820", border: "1px solid #1e2d3d" }}>
              <p style={{ color: "#e8eaed", fontSize: "0.75rem", lineHeight: 1.6 }}>{project.competitors}</p>
            </div>
          </div>
        )}

        {/* Linked documents */}
        <div className="mb-6">
          <label className="block mb-2" style={{ fontSize: "0.6rem", color: "#8899aa", letterSpacing: "0.1em" }}>LINKED DOCUMENTS</label>
          <div className="flex flex-col gap-2">
            <DocLink
              icon={<FileText size={14} />}
              label="Discovery Brief"
              exists={!!project.discovery_doc_id}
              color="#00e5ff"
            />
            <DocLink
              icon={<Palette size={14} />}
              label="Design Brief"
              exists={!!project.design_doc_id}
              color="#ff2d8a"
            />
            <DocLink
              icon={<Code size={14} />}
              label="Code Review"
              exists={!!project.code_review_status}
              status={project.code_review_status}
              color="#39ff14"
            />
            {project.preview_url && (
              <a
                href={project.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded transition-all hover:opacity-80"
                style={{ background: "#2979ff10", border: "1px solid #2979ff25", color: "#2979ff" }}
              >
                <ExternalLink size={14} />
                <span style={{ fontSize: "0.7rem" }}>Preview Site</span>
                <span className="ml-auto font-mono" style={{ fontSize: "0.55rem", color: "#2979ff80" }}>{project.preview_url}</span>
              </a>
            )}
          </div>
        </div>

        {/* Notes */}
        {project.notes && (
          <div className="mb-6">
            <label className="block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa", letterSpacing: "0.1em" }}>NOTES</label>
            <div className="px-3 py-2 rounded" style={{ background: "#111820", border: "1px solid #1e2d3d" }}>
              <p style={{ color: "#e8eaed", fontSize: "0.75rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{project.notes}</p>
            </div>
          </div>
        )}

        {/* Stage History */}
        <div>
          <label className="block mb-2" style={{ fontSize: "0.6rem", color: "#8899aa", letterSpacing: "0.1em" }}>STAGE HISTORY</label>
          {loading ? (
            <div className="flex items-center gap-2 py-4" style={{ color: "#445566", fontSize: "0.65rem" }}>
              <span className="animate-pulse">●</span> Loading history...
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {(project.stage_history || []).map((entry: any, idx: number) => {
                const info = STAGE_LABELS[entry.stage] || STAGE_LABELS.intake;
                const isActive = entry.exited_at === null;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2 rounded"
                    style={{
                      background: isActive ? `${info.color}08` : "transparent",
                      border: isActive ? `1px solid ${info.color}20` : "1px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem" }}>{info.emoji}</span>
                    <span className="font-mono font-bold" style={{ color: isActive ? info.color : "#445566", fontSize: "0.6rem", letterSpacing: "0.08em", minWidth: 80 }}>
                      {info.label}
                    </span>
                    <span className="font-mono" style={{ color: "#445566", fontSize: "0.55rem" }}>
                      {new Date(entry.entered_at).toLocaleDateString()}
                    </span>
                    {entry.agent && (
                      <span className="font-mono" style={{ color: "#8899aa", fontSize: "0.55rem" }}>
                        → {entry.agent}
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="ml-auto px-1.5 py-0.5 rounded animate-pulse"
                        style={{ background: `${info.color}15`, color: info.color, fontSize: "0.48rem", letterSpacing: "0.08em" }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value?: string; color: string }) {
  return (
    <div className="px-3 py-2 rounded" style={{ background: "#111820", border: "1px solid #1e2d3d" }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color: "#445566" }}>
        {icon}
        <span style={{ fontSize: "0.5rem", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <div style={{ color: value && value !== "—" && value !== "Unassigned" ? "#e8eaed" : "#445566", fontSize: "0.75rem" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function DocLink({ icon, label, exists, status, color }: { icon: React.ReactNode; label: string; exists: boolean; status?: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded"
      style={{
        background: exists ? `${color}08` : "#111820",
        border: exists ? `1px solid ${color}20` : "1px solid #1e2d3d",
        opacity: exists ? 1 : 0.5,
      }}
    >
      <span style={{ color: exists ? color : "#445566" }}>{icon}</span>
      <span className="font-mono" style={{ color: exists ? "#e8eaed" : "#445566", fontSize: "0.7rem" }}>{label}</span>
      {status && (
        <span className="ml-auto font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}10`, color, fontSize: "0.5rem", border: `1px solid ${color}20` }}>
          {status.toUpperCase()}
        </span>
      )}
      {!exists && (
        <span className="ml-auto font-mono" style={{ color: "#445566", fontSize: "0.5rem" }}>NOT YET</span>
      )}
    </div>
  );
}
