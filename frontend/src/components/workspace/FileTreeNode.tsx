"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, FileCode, File } from "lucide-react";
import type { TreeEntry } from "@/types/workspace";

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["md", "txt", "log"].includes(ext || "")) return FileText;
  if (["py", "ts", "tsx", "js", "jsx", "json", "yaml", "yml", "sh", "css", "html"].includes(ext || "")) return FileCode;
  return File;
}

function formatSize(bytes?: number) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

export function FileTreeNode({
  entry,
  depth,
  onSelect,
  activePath,
}: {
  entry: TreeEntry;
  depth: number;
  onSelect: (path: string) => void;
  activePath: string | null;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = entry.type === "directory";
  const isActive = entry.path === activePath;
  const Icon = isDir ? (expanded ? FolderOpen : Folder) : fileIcon(entry.name);

  return (
    <div>
      <button
        onClick={() => {
          if (isDir) {
            setExpanded(!expanded);
          } else if (!entry.binary) {
            onSelect(entry.path);
          }
        }}
        className="w-full flex items-center gap-1.5 py-1 px-2 rounded text-left transition-all duration-100 group"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          background: isActive ? "rgba(255,179,71,0.1)" : "transparent",
          borderLeft: isActive ? "2px solid #ffb347" : "2px solid transparent",
          color: entry.binary ? "#445566" : isActive ? "#ffb347" : "#8899aa",
        }}
        title={entry.binary ? "Binary file" : entry.path}
      >
        {isDir && (
          <span style={{ color: "#445566", width: 14, flexShrink: 0 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!isDir && <span style={{ width: 14, flexShrink: 0 }} />}
        <Icon
          size={14}
          style={{
            color: isDir ? "#ffb347" : isActive ? "#ffb347" : "#556677",
            flexShrink: 0,
          }}
        />
        <span
          className="font-mono truncate flex-1"
          style={{ fontSize: "0.7rem", fontWeight: isActive ? 600 : 400 }}
        >
          {entry.name}
        </span>
        {!isDir && entry.size != null && (
          <span
            className="font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ fontSize: "0.6rem", color: "#445566" }}
          >
            {formatSize(entry.size)}
          </span>
        )}
      </button>

      {isDir && expanded && entry.children && (
        <div>
          {entry.children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <FileTreeNode
                key={child.path}
                entry={child}
                depth={depth + 1}
                onSelect={onSelect}
                activePath={activePath}
              />
            ))}
        </div>
      )}
    </div>
  );
}
