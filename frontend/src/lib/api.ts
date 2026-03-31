// API client — real backend at http://localhost:8000/api/v1
const API_BASE = process.env.NEXT_PUBLIC_API_URL || null;
const API_KEY  = process.env.NEXT_PUBLIC_API_KEY  || "your-api-key-here";

export const USE_MOCK = !API_BASE;

async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = API_BASE || "";
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body?.detail || `API error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

// ── Dashboard ──────────────────────────────────────────
export async function getDashboard() {
  if (USE_MOCK) {
    const m = await import("./mock-data");
    const ideaRoomCount = m.IDEAS.filter(i =>
      ['raw','research','validation','business_plan','approved'].includes(i.stage)
    ).length;
    const devRoomCount = m.IDEAS.filter(i =>
      ['design','development','testing','launched'].includes(i.stage)
    ).length;
    return {
      lab: { name: "Lab Dashboard", status: "operational", uptime_since: "2026-03-01T00:00:00Z" },
      agents: { total: m.AGENTS.length, active: m.AGENTS.filter(a => a.status === "running").length, idle: m.AGENTS.filter(a => a.status === "idle").length, error: 0, list: m.AGENTS },
      tools:  { total: m.TOOLS.length, active: m.TOOLS.filter(t => t.status === "active").length, list: m.TOOLS },
      ideas:  {
        total: m.IDEAS.length,
        pipeline: m.PIPELINE_COUNTS,
        idea_room: ideaRoomCount,
        dev_room: devRoomCount,
      },
      recent_events: m.ACTIVITY_FEED,
      generated_at: new Date().toISOString(),
    };
  }
  return apiFetch("/dashboard");
}

// ── Agents ────────────────────────────────────────────
export async function getAgents() {
  if (USE_MOCK) { const m = await import("./mock-data"); return m.AGENTS; }
  return apiFetch("/agents");
}

export async function getAgent(slug: string) {
  if (USE_MOCK) { const m = await import("./mock-data"); return m.AGENTS.find(a => a.slug === slug); }
  return apiFetch(`/agents/${slug}`);
}

// ── Events ────────────────────────────────────────────
export async function getEvents(type?: string) {
  if (USE_MOCK) { const m = await import("./mock-data"); return m.ACTIVITY_FEED; }
  const qs = type ? `?type=${type}` : "";
  return apiFetch(`/events${qs}`);
}

// ── Tools ─────────────────────────────────────────────
export async function getTools() {
  if (USE_MOCK) { const m = await import("./mock-data"); return m.TOOLS; }
  return apiFetch("/tools");
}

// ── Ideas ────────────────────────────────────────────
export async function getIdeas(filters?: { stage?: string; tags?: string }) {
  if (USE_MOCK) { const m = await import("./mock-data"); return m.IDEAS; }
  const qs = new URLSearchParams(filters as any).toString();
  return apiFetch(`/ideas${qs ? `?${qs}` : ""}`);
}

export async function getIdeaRoom() {
  if (USE_MOCK) {
    const m = await import("./mock-data");
    return m.IDEAS.filter(i => ['raw','research','validation','business_plan','approved'].includes(i.stage));
  }
  return apiFetch("/ideas/rooms/idea-room");
}

export async function getDevRoom() {
  if (USE_MOCK) {
    const m = await import("./mock-data");
    return m.IDEAS.filter(i => ['queue','design','development','testing','launched'].includes(i.stage));
  }
  // Fetch dev room ideas + any approved/execution ideas with blueprints (waiting for design)
  const [devIdeas, allIdeas] = await Promise.all([
    apiFetch("/ideas/rooms/dev-room"),
    apiFetch("/ideas"),
  ]);
  const devList = Array.isArray(devIdeas) ? devIdeas : [];
  const allList = Array.isArray(allIdeas) ? allIdeas : [];
  // Find ideas that have blueprints but aren't in dev room yet (approved/execution stage)
  const devIds = new Set(devList.map((i: any) => i.id));
  const queueIdeas = allList
    .filter((i: any) =>
      !devIds.has(i.id) &&
      i.blueprint &&
      ['approved', 'execution'].includes(i.stage)
    )
    .map((i: any) => ({ ...i, stage: 'queue' }));
  return [...queueIdeas, ...devList];
}

export async function getIdea(id: string) {
  if (USE_MOCK) { const m = await import("./mock-data"); return m.IDEAS.find(i => i.id === id) || null; }
  return apiFetch(`/ideas/${id}`);
}

export async function createIdea(body: { title: string; description?: string; tags?: string[]; priority?: string; source?: string }) {
  if (USE_MOCK) return {};
  return apiFetch("/ideas", { method: "POST", body: JSON.stringify(body) });
}

export async function updateIdea(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteIdea(id: string) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}`, { method: "DELETE" });
}

export async function advanceIdea(id: string, notes?: string, assignedTo?: string) {
  if (USE_MOCK) return { message: "Advanced (mock)" };
  return apiFetch(`/ideas/${id}/advance`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "", assigned_to: assignedTo }),
  });
}

export async function blockIdea(id: string, reason: string) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}/block`, { method: "POST", body: JSON.stringify({ reason }) });
}

export async function updateResearch(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}/research`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function updateValidation(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}/validation`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function updateBusinessPlan(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}/business_plan`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function updateExecution(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}/execution`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function updateBlueprint(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/ideas/${id}/blueprint`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function getIdeaHistory(id: string) {
  if (USE_MOCK) return { current_stage: "raw", events: [] };
  return apiFetch(`/ideas/${id}/history`);
}

// ── Docs ─────────────────────────────────────────────
export async function getDocs(filters?: { category?: string; tags?: string; search?: string; pinned?: string; folder?: string; unfiled?: string }) {
  if (USE_MOCK) return [];
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  }
  const qs = params.toString();
  return apiFetch(`/docs${qs ? `?${qs}` : ""}`);
}

export async function getDocFolders() {
  if (USE_MOCK) return { folders: [], total_folders: 0, unfiled_docs: 0 };
  return apiFetch("/docs/folders");
}

export async function moveDocToFolder(folderName: string, docId: string) {
  return apiFetch(`/docs/folders/${folderName}/move/${docId}`, { method: "POST" });
}

export async function unfileDoc(folderName: string, docId: string) {
  return apiFetch(`/docs/folders/${folderName}/unfile/${docId}`, { method: "POST" });
}

export async function createDoc(body: { title: string; content: string; tags?: string[]; category?: string }) {
  if (USE_MOCK) return {};
  return apiFetch("/docs", { method: "POST", body: JSON.stringify({ ...body, created_by: "owner" }) });
}

export async function updateDoc(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/docs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteDoc(id: string) {
  if (USE_MOCK) return {};
  return apiFetch(`/docs/${id}`, { method: "DELETE" });
}

export async function getIdeaStats() {
  if (USE_MOCK) {
    const m = await import("./mock-data");
    const ideaRoomCount = m.IDEAS.filter(i =>
      ['raw','research','validation','business_plan','approved'].includes(i.stage)
    ).length;
    const devRoomCount = m.IDEAS.filter(i =>
      ['design','development','testing','launched'].includes(i.stage)
    ).length;
    return {
      ...m.PIPELINE_COUNTS,
      idea_room: ideaRoomCount,
      dev_room: devRoomCount,
    };
  }
  return apiFetch("/ideas/stats");
}

// ── Website Pipeline ──────────────────────────────────────
export async function getWebsiteProjects(stage?: string) {
  if (USE_MOCK) return [];
  const qs = stage ? `?stage=${stage}` : "";
  return apiFetch(`/websites${qs}`);
}

export async function getWebsiteProject(id: string) {
  if (USE_MOCK) return null;
  return apiFetch(`/websites/${id}`);
}

export async function createWebsiteProject(body: {
  client_name: string;
  business_type?: string;
  industry?: string;
  needs?: string;
  competitors?: string;
  brand_assets?: string;
  budget?: string;
  timeline?: string;
  notes?: string;
}) {
  if (USE_MOCK) return {};
  return apiFetch("/websites", { method: "POST", body: JSON.stringify(body) });
}

export async function updateWebsiteProject(id: string, body: object) {
  if (USE_MOCK) return {};
  return apiFetch(`/websites/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function advanceWebsiteProject(id: string, notes?: string, assignedTo?: string) {
  if (USE_MOCK) return { message: "Advanced (mock)" };
  return apiFetch(`/websites/${id}/advance`, {
    method: "PATCH",
    body: JSON.stringify({ notes: notes || "", assigned_to: assignedTo }),
  });
}

export async function archiveWebsiteProject(id: string) {
  if (USE_MOCK) return {};
  return apiFetch(`/websites/${id}`, { method: "DELETE" });
}

export async function getWebsiteProjectHistory(id: string) {
  if (USE_MOCK) return { current_stage: "intake", events: [] };
  return apiFetch(`/websites/${id}/history`);
}

export async function getWebsiteStages() {
  if (USE_MOCK) return [];
  return apiFetch("/websites/stages");
}

// ── CALENDAR ──
export async function getCalendarEvents(start: string, end: string) {
  return apiFetch(`/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
}

export async function getUpcomingEvents(days = 7) {
  return apiFetch(`/calendar/upcoming/list?days=${days}`);
}

export async function createCalendarEvent(body: Record<string, any>) {
  return apiFetch("/calendar", { method: "POST", body: JSON.stringify(body) });
}

export async function updateCalendarEvent(id: string, body: Record<string, any>) {
  return apiFetch(`/calendar/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteCalendarEvent(id: string) {
  return apiFetch(`/calendar/${id}`, { method: "DELETE" });
}

export async function completeCalendarEvent(id: string) {
  return apiFetch(`/calendar/${id}/complete`, { method: "POST" });
}

// ── Workspace ──────────────────────────────────────────
export async function getWorkspaceTree(depth = 3) {
  return apiFetch(`/workspace/tree?depth=${depth}`);
}

export async function getWorkspaceFile(path: string) {
  return apiFetch(`/workspace/file?path=${encodeURIComponent(path)}`);
}

export async function saveWorkspaceFile(path: string, content: string, mtime: number) {
  return apiFetch(`/workspace/file?path=${encodeURIComponent(path)}`, {
    method: "PUT",
    body: JSON.stringify({ content, mtime }),
  });
}

export async function createWorkspaceFile(path: string, content: string) {
  return apiFetch(`/workspace/file?path=${encodeURIComponent(path)}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteWorkspaceFile(path: string) {
  return apiFetch(`/workspace/file?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
}

// ── Tasks ──────────────────────────────────────────────
export async function getTaskBoard() {
  return apiFetch("/api/v1/tasks/board");
}

export async function getTasks(filters?: { status?: string; assignee?: string }) {
  const params = new URLSearchParams(filters as any).toString();
  return apiFetch(`/api/v1/tasks${params ? `?${params}` : ""}`);
}

export async function createTask(data: { title: string; description?: string; status?: string; priority?: string; assignee?: string; due_date?: string; tags?: string[] }) {
  return apiFetch("/api/v1/tasks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTask(id: string, data: Record<string, any>) {
  return apiFetch(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteTask(id: string) {
  return apiFetch(`/api/v1/tasks/${id}`, { method: "DELETE" });
}

export async function moveTask(id: string, status: string, sortOrder?: number) {
  return apiFetch(`/api/v1/tasks/${id}/move`, { method: "POST", body: JSON.stringify({ status, sort_order: sortOrder }) });
}

export async function reorderTasks(taskIds: string[]) {
  return apiFetch("/api/v1/tasks/reorder", { method: "POST", body: JSON.stringify({ task_ids: taskIds }) });
}
