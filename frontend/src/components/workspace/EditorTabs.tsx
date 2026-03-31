"use client";
import { X } from "lucide-react";
import type { OpenFile } from "@/types/workspace";

export function EditorTabs({
  files,
  activePath,
  onSelect,
  onClose,
}: {
  files: OpenFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div
      className="flex items-center gap-0 overflow-x-auto"
      style={{
        background: "#0a0e14",
        borderBottom: "1px solid #1e2d3d",
        scrollbarWidth: "thin",
      }}
    >
      {files.map((file) => {
        const active = file.path === activePath;
        return (
          <div
            key={file.path}
            className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer shrink-0 group transition-all"
            style={{
              background: active ? "#0d1117" : "transparent",
              borderBottom: active ? "2px solid #ffb347" : "2px solid transparent",
              borderRight: "1px solid #1e2d3d",
            }}
            onClick={() => onSelect(file.path)}
          >
            {file.dirty && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "#ffb347" }}
              />
            )}
            <span
              className="font-mono truncate"
              style={{
                fontSize: "0.68rem",
                color: active ? "#ffb347" : "#8899aa",
                maxWidth: "120px",
              }}
            >
              {file.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (file.dirty) {
                  if (!confirm(`"${file.name}" has unsaved changes. Close anyway?`)) return;
                }
                onClose(file.path);
              }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
              style={{ color: "#8899aa" }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
