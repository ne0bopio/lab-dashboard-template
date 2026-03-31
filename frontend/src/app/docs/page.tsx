"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocs, getDocFolders, updateDoc, deleteDoc } from "@/lib/api";
import { DocModal } from "@/components/docs/DocModal";
import { ToastContainer, toast } from "@/components/ui/Toast";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  Plus, Search, X, Pin, PinOff, Pencil, Trash2,
  ChevronRight, ChevronDown, Folder, FileText, ArrowLeft
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FOLDER_COLORS: Record<string, string> = {
  // client projects
  "beauty-ai": "#ff6b9d",
  "financial-robot": "#00e5ff",
  "vanads": "#f5a623",
  "my-project": "#bf5fff",
  // lab
  "lab": "#39ff14",
  // content categories
  "logs": "#7ecfff",
  "business-plans": "#ffb347",
  "dev-room": "#00ffcc",
  "vision": "#ff79c6",
  "client-projects": "#bd93f9",
  "infrastructure": "#8be9fd",
  "processes": "#50fa7b",
  "archived": "#6272a4",
};
const FOLDER_DESC: Record<string, string> = {
  "logs": "Session logs, research reports",
  "business-plans": "All business plans",
  "dev-room": "Project docs for ideas in execution",
  "vision": "Big ideas, research, strategy",
  "client-projects": "Website builds for clients",
  "my-project": "my-project.io site docs",
  "beauty-ai": "Beauty AI docs",
  "vanads": "VanAds / Oscar docs",
  "financial-robot": "Financial Robot docs",
  "lab": "Lab infrastructure",
  "infrastructure": "Disaster recovery, dashboard reference",
  "processes": "Web dev workflow",
  "archived": "Rejected ideas",
};
function fColor(name: string) { return FOLDER_COLORS[name] || "#8899aa"; }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function DocsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["all"]));

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: folderData } = useQuery({
    queryKey: ["doc-folders"],
    queryFn: getDocFolders,
    refetchInterval: 30000,
  });

  const docFilters: any = {};
  if (debouncedSearch) docFilters.search = debouncedSearch;

  const { data: docs, isLoading } = useQuery({
    queryKey: ["docs", debouncedSearch],
    queryFn: () => getDocs(docFilters),
    refetchInterval: 30000,
  });

  const allDocs = useMemo(() => {
    const list = Array.isArray(docs) ? docs : [];
    return [...list].sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [docs]);

  const folders = (folderData as any)?.folders || [];
  const unfiledDocs = allDocs.filter((d: any) => !d.folder);

  // Group docs by folder
  const docsByFolder = useMemo(() => {
    const map: Record<string, any[]> = {};
    allDocs.forEach((d: any) => {
      const f = d.folder || "__unfiled__";
      if (!map[f]) map[f] = [];
      map[f].push(d);
    });
    return map;
  }, [allDocs]);

  const selectedDoc = allDocs.find((d: any) => d.id === selectedId);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["docs"] });
    queryClient.invalidateQueries({ queryKey: ["doc-folders"] });
  }

  function toggleFolder(name: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handlePin(doc: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    try { await updateDoc(doc.id, { pinned: !doc.pinned }); toast(doc.pinned ? "Unpinned" : "Pinned", "info"); refresh(); }
    catch { toast("Failed", "error"); }
  }
  async function handleDelete(doc: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm(`Delete "${doc.title}"?`)) return;
    try { await deleteDoc(doc.id); toast("Deleted", "info"); if (selectedId === doc.id) setSelectedId(null); refresh(); }
    catch { toast("Failed", "error"); }
  }
  function handleEdit(doc: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditDoc(doc); setShowModal(true);
  }

  // Doc row component
  function DocRow({ doc }: { doc: any }) {
    const isActive = selectedId === doc.id;
    const color = doc.folder ? fColor(doc.folder) : "#445566";
    return (
      <button
        onClick={() => setSelectedId(doc.id)}
        className="w-full text-left group relative transition-all"
        style={{
          padding: "8px 12px 8px 28px",
          background: isActive ? `${color}0a` : "transparent",
          borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
        }}
      >
        <div className="flex items-center gap-2">
          <FileText size={12} style={{ color: isActive ? color : "#2d3d4d", flexShrink: 0 }} />
          <span className="font-mono font-semibold truncate flex-1" style={{ fontSize: "0.72rem", color: isActive ? "#e8eaed" : "#8899aa" }}>
            {doc.pinned && <span style={{ color: "#ffb347", marginRight: 3 }}>📌</span>}
            {doc.title}
          </span>
          <span className="font-mono flex-shrink-0" style={{ fontSize: "0.5rem", color: "#2d3d4d" }}>{timeAgo(doc.created_at)}</span>
        </div>
        {/* Hover actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span onClick={e => handlePin(doc, e)} style={{ padding: 2, cursor: "pointer", color: doc.pinned ? "#ffb347" : "#2d3d4d" }}><Pin size={9} /></span>
          <span onClick={e => handleEdit(doc, e)} style={{ padding: 2, cursor: "pointer", color: "#00e5ff" }}><Pencil size={9} /></span>
        </div>
      </button>
    );
  }

  return (
    <PageTransition>
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <PageTitle title="Docs" />
      <ToastContainer />

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 pb-3" style={{ borderBottom: "1px solid #1e2d3d" }}>
        <div>
          <h1 style={{ fontFamily: "Orbitron, monospace", color: "#ffb347", fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textShadow: "0 0 12px rgba(255,179,71,0.35)" }}>
            📄 LAB DOCS
          </h1>
          <p className="font-mono mt-0.5" style={{ color: "#445566", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
            {allDocs.length} DOCS · {folders.length} FOLDERS
          </p>
        </div>
        <button onClick={() => { setEditDoc(null); setShowModal(true); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded font-mono font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: "rgba(255,179,71,0.12)", color: "#ffb347", border: "1px solid rgba(255,179,71,0.35)", fontSize: "0.65rem" }}>
          <Plus size={11} /> NEW DOC
        </button>
      </div>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr", overflow: "hidden", height: "calc(100vh - 185px)" }}>

        {/* ── LEFT: FOLDER TREE + DOC LIST ── */}
        <div style={{ borderRight: "1px solid #1e2d3d", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Search */}
          <div className="p-2.5" style={{ borderBottom: "1px solid #1e2d3d" }}>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#445566" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all docs..."
                className="w-full pl-7 pr-6 py-1.5 rounded font-mono outline-none"
                style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.72rem" }}
                onFocus={e => e.target.style.borderColor = "#ffb347"}
                onBlur={e => e.target.style.borderColor = "#1e2d3d"} />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#445566" }}><X size={10} /></button>}
            </div>
          </div>

          {/* Scrollable folder tree */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <span className="font-mono" style={{ color: "#445566", fontSize: "0.6rem", letterSpacing: "0.1em" }}>LOADING...</span>
              </div>
            ) : (
              <>
                {/* Folders */}
                {folders.map((folder: any) => {
                  const color = fColor(folder.name);
                  const isOpen = expandedFolders.has(folder.name);
                  const folderDocs = docsByFolder[folder.name] || [];
                  return (
                    <div key={folder.name}>
                      {/* Folder header */}
                      <button
                        onClick={() => toggleFolder(folder.name)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 transition-all hover:bg-white/[0.03]"
                        style={{ borderBottom: "1px solid #1e2d3d10" }}
                      >
                        {isOpen
                          ? <ChevronDown size={12} style={{ color, flexShrink: 0 }} />
                          : <ChevronRight size={12} style={{ color: "#2d3d4d", flexShrink: 0 }} />
                        }
                        <Folder size={14} style={{ color: isOpen ? color : "#445566", flexShrink: 0 }} />
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-mono font-bold" style={{ fontSize: "0.72rem", color: isOpen ? color : "#8899aa" }}>
                            {folder.name}
                          </div>
                          {FOLDER_DESC[folder.name] && (
                            <div className="font-mono truncate" style={{ fontSize: "0.52rem", color: "#2d3d4d", marginTop: 1 }}>
                              {FOLDER_DESC[folder.name]}
                            </div>
                          )}
                        </div>
                        <span className="font-mono rounded-full px-1.5 py-0.5" style={{ fontSize: "0.5rem", background: isOpen ? `${color}15` : "#111820", color: isOpen ? color : "#2d3d4d", minWidth: 18, textAlign: "center" }}>
                          {folder.doc_count}
                        </span>
                      </button>
                      {/* Docs in folder */}
                      {isOpen && (
                        <div style={{ borderBottom: "1px solid #1e2d3d" }}>
                          {folderDocs.length === 0 ? (
                            <div className="font-mono py-3 text-center" style={{ color: "#2d3d4d", fontSize: "0.58rem" }}>Empty folder</div>
                          ) : (
                            folderDocs.map((doc: any) => <DocRow key={doc.id} doc={doc} />)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unfiled docs */}
                {unfiledDocs.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleFolder("__unfiled__")}
                      className="w-full flex items-center gap-2 px-3 py-2.5 transition-all hover:bg-white/[0.03]"
                    >
                      {expandedFolders.has("__unfiled__")
                        ? <ChevronDown size={12} style={{ color: "#445566" }} />
                        : <ChevronRight size={12} style={{ color: "#2d3d4d" }} />
                      }
                      <FileText size={14} style={{ color: "#445566" }} />
                      <span className="font-mono font-bold flex-1 text-left" style={{ fontSize: "0.72rem", color: "#667788" }}>Unfiled</span>
                      <span className="font-mono rounded-full px-1.5 py-0.5" style={{ fontSize: "0.5rem", background: "#111820", color: "#2d3d4d", minWidth: 18, textAlign: "center" }}>{unfiledDocs.length}</span>
                    </button>
                    {expandedFolders.has("__unfiled__") && (
                      <div style={{ borderBottom: "1px solid #1e2d3d" }}>
                        {unfiledDocs.map((doc: any) => <DocRow key={doc.id} doc={doc} />)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: READER ── */}
        <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {!selectedDoc ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div style={{ fontSize: "2.5rem", opacity: 0.15 }}>📄</div>
              <span className="font-mono" style={{ color: "#2d3d4d", fontSize: "0.7rem", letterSpacing: "0.08em" }}>SELECT A DOC TO READ</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-5 pb-3" style={{ borderBottom: "1px solid #1e2d3d" }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {selectedDoc.folder && (
                        <span className="font-mono flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: `${fColor(selectedDoc.folder)}12`, color: fColor(selectedDoc.folder), border: `1px solid ${fColor(selectedDoc.folder)}25`, fontSize: "0.55rem" }}>
                          <Folder size={9} /> {selectedDoc.folder}
                        </span>
                      )}
                      {selectedDoc.tags?.map((tag: string) => (
                        <span key={tag} className="font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(136,153,170,0.06)", color: "#556677", border: "1px solid rgba(136,153,170,0.12)", fontSize: "0.5rem" }}>#{tag}</span>
                      ))}
                    </div>
                    <h2 className="font-mono font-bold" style={{ color: "#e8eaed", fontSize: "1.05rem", lineHeight: 1.3 }}>{selectedDoc.title}</h2>
                    <p className="font-mono mt-1.5" style={{ color: "#445566", fontSize: "0.55rem" }}>
                      by <span style={{ color: "#8899aa" }}>{selectedDoc.created_by || "unknown"}</span>
                      {" · "}{timeAgo(selectedDoc.created_at)} ago
                      {" · "}{Math.ceil((selectedDoc.content?.length || 0) / 1000)}k chars
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={e => handleEdit(selectedDoc, e)} className="flex items-center gap-1 px-2.5 py-1.5 rounded font-mono transition-all hover:opacity-80" style={{ background: "rgba(0,229,255,0.08)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.2)", fontSize: "0.58rem" }}>
                      <Pencil size={10} /> EDIT
                    </button>
                    <button onClick={e => handlePin(selectedDoc, e)} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: selectedDoc.pinned ? "#ffb347" : "#2d3d4d", border: `1px solid ${selectedDoc.pinned ? "rgba(255,179,71,0.3)" : "#1e2d3d"}` }}>
                      {selectedDoc.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    </button>
                    <button onClick={e => handleDelete(selectedDoc, e)} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: "#2d3d4d", border: "1px solid #1e2d3d" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 pb-12">
                <div className="prose-doc" style={{ maxWidth: 780 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedDoc.content || "*No content.*"}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <DocModal doc={editDoc} onClose={() => { setShowModal(false); setEditDoc(null); }} onSaved={refresh} />
      )}
    </div>
    </PageTransition>
  );
}
