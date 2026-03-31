"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw } from "lucide-react";
import { getWorkspaceTree } from "@/lib/api";
import { FileTreeNode } from "./FileTreeNode";
import type { TreeEntry } from "@/types/workspace";

function filterTree(entries: TreeEntry[], query: string): TreeEntry[] {
  if (!query) return entries;
  const q = query.toLowerCase();
  return entries.reduce<TreeEntry[]>((acc, entry) => {
    if (entry.type === "file") {
      if (entry.name.toLowerCase().includes(q)) acc.push(entry);
    } else {
      const filtered = entry.children ? filterTree(entry.children, query) : [];
      if (filtered.length > 0 || entry.name.toLowerCase().includes(q)) {
        acc.push({ ...entry, children: filtered });
      }
    }
    return acc;
  }, []);
}

export function FileTreePanel({
  onSelect,
  activePath,
}: {
  onSelect: (path: string) => void;
  activePath: string | null;
}) {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["workspace-tree"],
    queryFn: () => getWorkspaceTree(4),
  });

  const children: TreeEntry[] = data?.children || [];
  const filtered = filterTree(children, search);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(8,11,15,0.95)",
        borderRight: "1px solid #1e2d3d",
      }}
    >
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid #1e2d3d" }}>
        <Search size={13} style={{ color: "#445566", flexShrink: 0 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter files..."
          className="flex-1 bg-transparent border-none outline-none font-mono"
          style={{ fontSize: "0.7rem", color: "#8899aa" }}
        />
        <button
          onClick={() => refetch()}
          className="opacity-40 hover:opacity-100 transition-opacity"
          title="Refresh tree"
        >
          <RefreshCw size={12} style={{ color: "#8899aa" }} />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1" style={{ scrollbarWidth: "thin" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="font-mono animate-pulse" style={{ fontSize: "0.7rem", color: "#445566" }}>
              Loading tree...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="font-mono" style={{ fontSize: "0.7rem", color: "#445566" }}>
              {search ? "No matches" : "Empty workspace"}
            </span>
          </div>
        ) : (
          filtered
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((entry) => (
              <FileTreeNode
                key={entry.path}
                entry={entry}
                depth={0}
                onSelect={onSelect}
                activePath={activePath}
              />
            ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1.5 font-mono"
        style={{ borderTop: "1px solid #1e2d3d", fontSize: "0.55rem", color: "#445566" }}
      >
        {data?.root ? data.root.split("/").pop() : "workspace"}
      </div>
    </div>
  );
}
