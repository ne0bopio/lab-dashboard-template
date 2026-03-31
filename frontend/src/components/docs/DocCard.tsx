"use client";
import { memo } from "react";
import { Pin, PinOff, Pencil, Trash2, FileText, Server, GitBranch, Lightbulb, BookOpen, Users, FolderOpen } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any; accent: string }> = {
  infrastructure: { bg: "rgba(57,255,20,0.08)",   text: "#39ff14", border: "rgba(57,255,20,0.25)",   icon: Server,     accent: "#39ff14" },
  project:        { bg: "rgba(0,229,255,0.08)",    text: "#00e5ff", border: "rgba(0,229,255,0.25)",   icon: GitBranch,  accent: "#00e5ff" },
  projects:       { bg: "rgba(0,229,255,0.08)",    text: "#00e5ff", border: "rgba(0,229,255,0.25)",   icon: GitBranch,  accent: "#00e5ff" },
  client:         { bg: "rgba(255,107,157,0.08)",  text: "#ff6b9d", border: "rgba(255,107,157,0.25)", icon: Users,      accent: "#ff6b9d" },
  decision:       { bg: "rgba(255,179,71,0.08)",   text: "#ffb347", border: "rgba(255,179,71,0.25)",  icon: Lightbulb,  accent: "#ffb347" },
  reference:      { bg: "rgba(191,95,255,0.08)",   text: "#bf5fff", border: "rgba(191,95,255,0.25)",  icon: BookOpen,   accent: "#bf5fff" },
  processes:      { bg: "rgba(41,121,255,0.08)",   text: "#2979ff", border: "rgba(41,121,255,0.25)",  icon: FolderOpen, accent: "#2979ff" },
  general:        { bg: "rgba(136,153,170,0.08)",  text: "#8899aa", border: "rgba(136,153,170,0.25)", icon: FileText,   accent: "#8899aa" },
};

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DocCardProps {
  doc: any;
  onEdit: (doc: any) => void;
  onPin: (doc: any) => void;
  onDelete: (doc: any) => void;
  onClick: (doc: any) => void;
}

export const DocCard = memo(function DocCard({ doc, onEdit, onPin, onDelete, onClick }: DocCardProps) {
  const cat = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.general;
  const Icon = cat.icon;
  const preview = doc.content?.length > 100 ? doc.content.slice(0, 100) + "..." : doc.content || "";

  return (
    <div
      className="rounded-lg cursor-pointer transition-all hover:-translate-y-0.5 group relative overflow-hidden"
      style={{
        background: "#0d1117",
        border: `1px solid ${doc.pinned ? "rgba(255,179,71,0.3)" : "#1e2d3d"}`,
        boxShadow: doc.pinned ? "0 0 12px rgba(255,179,71,0.08)" : "none",
      }}
      onClick={() => onClick(doc)}
    >
      {/* Category accent stripe — top border */}
      <div style={{ height: 3, background: cat.accent, opacity: 0.7 }} />

      <div className="p-4">
        {/* Top: icon + category + time */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
          >
            <Icon size={12} style={{ color: cat.text }} />
          </div>
          <span
            className="px-2 py-0.5 rounded font-mono font-bold"
            style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, fontSize: "0.5rem", letterSpacing: "0.1em" }}
          >
            {(doc.category || "general").toUpperCase()}
          </span>
          <span className="font-mono ml-auto flex-shrink-0" style={{ color: "#445566", fontSize: "0.5rem" }}>
            {formatDate(doc.created_at)}
          </span>
          {doc.pinned && (
            <span style={{ color: "#ffb347", fontSize: "0.6rem" }}>📌</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-mono font-bold mb-1.5 pr-8" style={{ color: "#e8eaed", fontSize: "0.82rem", lineHeight: 1.35 }}>
          {doc.title}
        </h3>

        {/* Author */}
        {doc.created_by && (
          <div className="font-mono mb-2" style={{ color: "#445566", fontSize: "0.55rem" }}>
            by <span style={{ color: cat.text }}>{doc.created_by}</span> · {timeAgo(doc.created_at)}
          </div>
        )}

        {/* Content preview */}
        {preview && (
          <p className="mb-2.5" style={{ color: "#6b7d8e", fontSize: "0.7rem", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
            {preview}
          </p>
        )}

        {/* Tags */}
        {doc.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded font-mono"
                style={{ background: "rgba(136,153,170,0.06)", color: "#667788", border: "1px solid rgba(136,153,170,0.12)", fontSize: "0.5rem" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute top-4 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onPin(doc); }}
          className="p-1.5 rounded transition-all"
          style={{ color: doc.pinned ? "#ffb347" : "#445566", background: "rgba(17,24,32,0.9)" }}
          title={doc.pinned ? "Unpin" : "Pin"}
        >
          {doc.pinned ? <PinOff size={11} /> : <Pin size={11} />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onEdit(doc); }}
          className="p-1.5 rounded transition-all"
          style={{ color: "#00e5ff", background: "rgba(17,24,32,0.9)" }}
          title="Edit"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(doc); }}
          className="p-1.5 rounded transition-all"
          style={{ color: "#ff2052", background: "rgba(17,24,32,0.9)" }}
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
});
