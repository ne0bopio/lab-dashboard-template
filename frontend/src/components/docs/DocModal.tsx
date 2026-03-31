"use client";
import { useState, useEffect } from "react";
import { createDoc, updateDoc } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { X, Save, Plus } from "lucide-react";

const CATEGORIES = ["general", "client", "project", "decision", "reference"];

interface Props {
  doc?: any;           // null = create, existing = edit
  onClose: () => void;
  onSaved: () => void;
}

export function DocModal({ doc, onClose, onSaved }: Props) {
  const isEdit = !!doc;
  const [title, setTitle]       = useState(doc?.title || "");
  const [content, setContent]   = useState(doc?.content || "");
  const [category, setCategory] = useState(doc?.category || "general");
  const [tagsRaw, setTagsRaw]   = useState((doc?.tags || []).join(", "));
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast("Title is required", "error"); return; }
    if (!content.trim()) { toast("Content is required", "error"); return; }

    setSaving(true);
    const tags = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean);

    try {
      if (isEdit) {
        await updateDoc(doc.id, { title: title.trim(), content: content.trim(), category, tags });
        toast("Doc updated", "success");
      } else {
        await createDoc({ title: title.trim(), content: content.trim(), category, tags });
        toast("Doc created", "success");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "rgba(8,11,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl p-6 font-mono mx-4"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,179,71,0.35)",
          boxShadow: "0 0 40px rgba(255,179,71,0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "Orbitron, monospace", color: "#ffb347", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.05em", textShadow: "0 0 10px rgba(255,179,71,0.4)" }}>
            {isEdit ? "✏️ EDIT DOC" : "📄 NEW DOC"}
          </h2>
          <button onClick={onClose} style={{ color: "#445566" }} className="hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block font-mono mb-1.5" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "#8899aa" }}>TITLE *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Doc title"
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.85rem" }}
              onFocus={e => e.target.style.borderColor = "#ffb347"}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block font-mono mb-1.5" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "#8899aa" }}>CONTENT *</label>
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write your doc..."
              rows={8}
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none resize-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.78rem", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = "#ffb347"}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-mono mb-1.5" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "#8899aa" }}>CATEGORY</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1 rounded font-mono text-xs transition-all"
                  style={{
                    background: category === cat ? "rgba(255,179,71,0.15)" : "transparent",
                    color: category === cat ? "#ffb347" : "#445566",
                    border: `1px solid ${category === cat ? "rgba(255,179,71,0.3)" : "#1e2d3d"}`,
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-mono mb-1.5" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "#8899aa" }}>TAGS</label>
            <input
              value={tagsRaw} onChange={e => setTagsRaw(e.target.value)}
              placeholder="oscar, meeting, pricing"
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.8rem" }}
              onFocus={e => e.target.style.borderColor = "#ffb347"}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
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
                background: "rgba(255,179,71,0.15)",
                color: "#ffb347",
                border: "1px solid rgba(255,179,71,0.4)",
                boxShadow: "0 0 12px rgba(255,179,71,0.15)",
                letterSpacing: "0.08em",
              }}
            >
              {isEdit ? <Save size={12} /> : <Plus size={12} />}
              {saving ? "SAVING..." : isEdit ? "SAVE" : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
