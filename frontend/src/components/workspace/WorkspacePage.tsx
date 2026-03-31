"use client";
import { useState, useCallback } from "react";
import { Eye, Pencil, PanelLeftClose, PanelLeft } from "lucide-react";
import { getWorkspaceFile } from "@/lib/api";
import { FileTreePanel } from "./FileTreePanel";
import { EditorTabs } from "./EditorTabs";
import { FileViewer } from "./FileViewer";
import { FileEditor } from "./FileEditor";
import type { OpenFile } from "@/types/workspace";

export function WorkspacePage() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [treeVisible, setTreeVisible] = useState(true);

  const activeFile = openFiles.find((f) => f.path === activePath) || null;

  const handleSelect = useCallback(async (path: string) => {
    // Already open? Just switch
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActivePath(path);
      setEditMode(false);
      return;
    }

    // Fetch file
    const name = path.split("/").pop() || path;
    const placeholder: OpenFile = {
      path,
      name,
      content: "",
      savedContent: "",
      dirty: false,
      mtime: 0,
      loading: true,
    };

    setOpenFiles((prev) => [...prev, placeholder]);
    setActivePath(path);
    setEditMode(false);

    try {
      const result = await getWorkspaceFile(path);
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path
            ? { ...f, content: result.content, savedContent: result.content, mtime: result.mtime || 0, loading: false }
            : f
        )
      );
    } catch (err: any) {
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path
            ? { ...f, loading: false, error: err.message || "Failed to load" }
            : f
        )
      );
    }
  }, [openFiles]);

  const handleClose = useCallback((path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    if (activePath === path) {
      const remaining = openFiles.filter((f) => f.path !== path);
      setActivePath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
    setEditMode(false);
  }, [activePath, openFiles]);

  const handleContentChange = useCallback((newContent: string) => {
    if (!activePath) return;
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === activePath
          ? { ...f, content: newContent, dirty: newContent !== f.savedContent }
          : f
      )
    );
  }, [activePath]);

  const handleSaved = useCallback((newContent: string, newMtime: number) => {
    if (!activePath) return;
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === activePath
          ? { ...f, savedContent: newContent, content: newContent, dirty: false, mtime: newMtime }
          : f
      )
    );
  }, [activePath]);

  return (
    <div className="flex h-[calc(100vh-5rem)]" style={{ background: "#080b0f" }}>
      {/* File tree panel */}
      {treeVisible && (
        <div className="shrink-0 hidden md:block" style={{ width: 280 }}>
          <FileTreePanel onSelect={handleSelect} activePath={activePath} />
        </div>
      )}

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with tabs + controls */}
        <div className="flex items-center" style={{ background: "#0a0e14", borderBottom: "1px solid #1e2d3d" }}>
          <button
            onClick={() => setTreeVisible(!treeVisible)}
            className="px-2 py-1.5 shrink-0 transition-colors hidden md:flex items-center"
            style={{ color: "#445566", borderRight: "1px solid #1e2d3d" }}
            title={treeVisible ? "Hide tree" : "Show tree"}
          >
            {treeVisible ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
          </button>
          <div className="flex-1 overflow-hidden">
            <EditorTabs
              files={openFiles}
              activePath={activePath}
              onSelect={(p) => { setActivePath(p); setEditMode(false); }}
              onClose={handleClose}
            />
          </div>
          {activeFile && !activeFile.loading && !activeFile.error && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-1 px-3 py-1.5 shrink-0 font-mono transition-all"
              style={{
                fontSize: "0.65rem",
                color: editMode ? "#ffb347" : "#8899aa",
                borderLeft: "1px solid #1e2d3d",
                background: editMode ? "rgba(255,179,71,0.06)" : "transparent",
              }}
            >
              {editMode ? <Eye size={12} /> : <Pencil size={12} />}
              {editMode ? "View" : "Edit"}
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {!activeFile ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="font-mono block mb-2" style={{ fontSize: "1.5rem", color: "#1e2d3d" }}>
                  📂
                </span>
                <span className="font-mono" style={{ fontSize: "0.75rem", color: "#445566" }}>
                  Select a file from the tree
                </span>
              </div>
            </div>
          ) : activeFile.loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="font-mono animate-pulse" style={{ fontSize: "0.75rem", color: "#445566" }}>
                Loading {activeFile.name}...
              </span>
            </div>
          ) : activeFile.error ? (
            <div className="flex items-center justify-center h-full">
              <span className="font-mono" style={{ fontSize: "0.75rem", color: "#ff2052" }}>
                Error: {activeFile.error}
              </span>
            </div>
          ) : editMode ? (
            <FileEditor
              key={activeFile.path}
              content={activeFile.content}
              mtime={activeFile.mtime}
              path={activeFile.path}
              onSaved={handleSaved}
              onChange={handleContentChange}
            />
          ) : (
            <FileViewer content={activeFile.content} filename={activeFile.name} />
          )}
        </div>
      </div>
    </div>
  );
}
