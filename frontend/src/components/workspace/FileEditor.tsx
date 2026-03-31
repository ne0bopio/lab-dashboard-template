"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Save, Loader2 } from "lucide-react";
import { saveWorkspaceFile } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function FileEditor({
  content,
  mtime,
  path,
  onSaved,
  onChange,
}: {
  content: string;
  mtime: number;
  path: string;
  onSaved: (newContent: string, newMtime: number) => void;
  onChange: (newContent: string) => void;
}) {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when file changes
  useEffect(() => {
    setValue(content);
  }, [content, path]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await saveWorkspaceFile(path, value, mtime);
      onSaved(value, result.mtime || mtime);
      toast("File saved", "success");
    } catch (err: any) {
      if (err.status === 409) {
        toast("File changed on disk. Reload the file to get latest.", "warning");
      } else {
        toast(`Save failed: ${err.message}`, "error");
      }
    } finally {
      setSaving(false);
    }
  }, [saving, value, path, mtime, onSaved]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full" style={{ background: "#080b0f" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid #1e2d3d", background: "#0a0e14" }}
      >
        <span className="font-mono" style={{ fontSize: "0.65rem", color: "#445566" }}>
          EDITING — {path.split("/").pop()}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all"
          style={{
            background: saving ? "#1a2332" : "rgba(255,179,71,0.12)",
            border: "1px solid rgba(255,179,71,0.3)",
            color: "#ffb347",
            fontSize: "0.68rem",
            fontFamily: "monospace",
          }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : "Save"}
          <span style={{ fontSize: "0.55rem", color: "#445566", marginLeft: 4 }}>⌘S</span>
        </button>
      </div>

      {/* Editor area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        className="flex-1 w-full resize-none outline-none p-4 font-mono"
        style={{
          background: "#080b0f",
          color: "#e8eaed",
          fontSize: "0.78rem",
          lineHeight: "1.65",
          caretColor: "#ffb347",
          tabSize: 2,
        }}
        spellCheck={false}
      />
    </div>
  );
}
