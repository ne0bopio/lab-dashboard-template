"use client";
import { useState } from "react";
import { createIdea } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { X, Plus, Zap } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewIdeaModal({ onClose, onCreated }: Props) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [tagsRaw, setTagsRaw]   = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast("Title is required", "error"); return; }
    setSaving(true);
    try {
      const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);
      await createIdea({ title: title.trim(), description: desc.trim(), tags, priority, source: "manual" });
      toast("Idea launched to RAW stage", "success");
      onCreated();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to create idea", "error");
    } finally {
      setSaving(false);
    }
  }

  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "rgba(8,11,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl p-6 font-mono"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,179,71,0.35)",
          boxShadow: "0 0 40px rgba(255,179,71,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: "Orbitron, monospace", color: "#ffb347", fontSize: "1rem", fontWeight: 800, letterSpacing: "0.05em", textShadow: "0 0 10px rgba(255,179,71,0.4)" }}>
              ⚡ NEW IDEA
            </h2>
            <p style={{ color: "#445566", fontSize: "0.6rem", letterSpacing: "0.1em", marginTop: 2 }}>
              ENTER THE PIPELINE AT RAW STAGE
            </p>
          </div>
          <button onClick={onClose} style={{ color: "#445566" }} className="hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="mono-label block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa" }}>TITLE *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What's the idea?"
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.85rem" }}
              onFocus={e => e.target.style.borderColor = "#ffb347"}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mono-label block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa" }}>DESCRIPTION</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Describe the concept..."
              rows={3}
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none resize-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.8rem" }}
              onFocus={e => e.target.style.borderColor = "#ffb347"}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mono-label block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa" }}>TAGS (comma-separated)</label>
            <input
              value={tagsRaw} onChange={e => setTagsRaw(e.target.value)}
              placeholder="ai, saas, fintech"
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none mb-2"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.8rem" }}
              onFocus={e => e.target.style.borderColor = "#ffb347"}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded" style={{ background: "rgba(255,179,71,0.1)", color: "#ffb347", border: "1px solid rgba(255,179,71,0.2)", fontSize: "0.6rem" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="mono-label block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa" }}>PRIORITY</label>
            <select
              value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.8rem" }}
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded font-mono text-xs font-semibold transition-all"
              style={{ background: "transparent", color: "#445566", border: "1px solid #1e2d3d", letterSpacing: "0.08em" }}
            >
              CANCEL
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded font-mono text-xs font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: saving ? "rgba(255,179,71,0.1)" : "rgba(255,179,71,0.15)",
                color: "#ffb347", border: "1px solid rgba(255,179,71,0.4)",
                boxShadow: "0 0 12px rgba(255,179,71,0.15)",
                letterSpacing: "0.08em",
              }}
            >
              <Zap size={12} />
              {saving ? "LAUNCHING..." : "LAUNCH IDEA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
