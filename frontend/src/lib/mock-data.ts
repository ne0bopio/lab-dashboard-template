// Mock data — mirrors DATA_CONTRACT.md exactly
// Replaced by real API calls once Kirby's backend is on port 8000

export type AgentStatus = "idle" | "running" | "error" | "offline" | "paused";
export type IdeaStage =
  | "raw"
  | "research"
  | "validation"
  | "business_plan"
  | "approved"
  | "queue"
  | "design"
  | "development"
  | "testing"
  | "launched"
  | "archived";

export interface Blueprint {
  generated_at: string;
  product_type: string;
  brand_requirements: string;
  tech_requirements: string;
  design_status: "pending" | "in_progress" | "done";
  dev_status: "pending" | "in_progress" | "done";
  design_agent: string;
  dev_agent: string;
  assets: string[];
  notes: string;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  role: string;
  model: string;
  status: AgentStatus;
  parent: string | null;
  tier: number;
  current_task: string | null;
  health: { last_seen: string; uptime_percent: number; error_count_24h: number };
  metrics: { tasks_completed_24h: number; tokens_used_24h: number; avg_response_time_ms: number };
  activity: number[]; // sparkline data
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  stage: IdeaStage;
  tags: string[];
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  blueprint?: Blueprint;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  type: string;
  status: "active" | "inactive" | "error";
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agent_slug: string;
  agent_emoji: string;
  action: string;
}

export const AGENTS: Agent[] = [
  {
    id: "1", name: "Orchestrator", slug: "orchestrator", emoji: "⚡",
    role: "Main Agent — Orchestrator",
    model: "claude-sonnet-4-6", status: "running", parent: null, tier: 1,
    current_task: "Coordinating Phase 1 build — frontend scaffold",
    health: { last_seen: new Date().toISOString(), uptime_percent: 99.8, error_count_24h: 0 },
    metrics: { tasks_completed_24h: 12, tokens_used_24h: 42000, avg_response_time_ms: 980 },
    activity: [2,3,5,4,6,8,5,7,9,6,8,10,7,9,11,8,10,12,9,11],
  },
  {
    id: "2", name: "Euge", slug: "euge", emoji: "📊",
    role: "Business & Revenue",
    model: "claude-sonnet-4-6", status: "idle", parent: "orchestrator", tier: 2,
    current_task: null,
    health: { last_seen: new Date(Date.now()-300000).toISOString(), uptime_percent: 98.1, error_count_24h: 0 },
    metrics: { tasks_completed_24h: 4, tokens_used_24h: 15000, avg_response_time_ms: 1100 },
    activity: [1,2,1,3,2,4,3,2,1,3,4,2,3,1,2,3,2,4,3,2],
  },
  {
    id: "3", name: "Frida", slug: "frida", emoji: "🎨",
    role: "Visuals, PDFs & Design",
    model: "claude-sonnet-4-6", status: "running", parent: "orchestrator", tier: 2,
    current_task: "Building Lab Dashboard — Phase 1 frontend",
    health: { last_seen: new Date().toISOString(), uptime_percent: 99.5, error_count_24h: 0 },
    metrics: { tasks_completed_24h: 7, tokens_used_24h: 28000, avg_response_time_ms: 890 },
    activity: [4,5,6,8,7,9,8,10,9,11,10,12,9,11,10,12,11,13,10,12],
  },
  {
    id: "4", name: "Kirby", slug: "kirby", emoji: "💻",
    role: "Backend & Software Engineering",
    model: "claude-sonnet-4-6", status: "idle", parent: "orchestrator", tier: 2,
    current_task: null,
    health: { last_seen: new Date(Date.now()-600000).toISOString(), uptime_percent: 97.3, error_count_24h: 1 },
    metrics: { tasks_completed_24h: 5, tokens_used_24h: 22000, avg_response_time_ms: 1340 },
    activity: [3,4,5,3,4,6,5,4,3,5,6,4,5,3,4,5,4,6,5,4],
  },
  {
    id: "5", name: "Midas", slug: "midas", emoji: "💰",
    role: "Finance & Portfolio",
    model: "claude-sonnet-4-6", status: "idle", parent: "orchestrator", tier: 2,
    current_task: null,
    health: { last_seen: new Date(Date.now()-1200000).toISOString(), uptime_percent: 99.9, error_count_24h: 0 },
    metrics: { tasks_completed_24h: 3, tokens_used_24h: 12000, avg_response_time_ms: 1050 },
    activity: [1,1,2,1,2,3,2,1,2,3,2,3,1,2,3,2,1,2,3,2],
  },
  {
    id: "6", name: "Anonymous", slug: "anonymous", emoji: "🛡️",
    role: "Security & Hardening",
    model: "claude-sonnet-4-6", status: "idle", parent: "orchestrator", tier: 2,
    current_task: null,
    health: { last_seen: new Date(Date.now()-900000).toISOString(), uptime_percent: 100, error_count_24h: 0 },
    metrics: { tasks_completed_24h: 1, tokens_used_24h: 4000, avg_response_time_ms: 780 },
    activity: [0,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0],
  },
  {
    id: "7", name: "Atlas", slug: "atlas", emoji: "🏋️",
    role: "Health & Fitness",
    model: "claude-sonnet-4-6", status: "offline", parent: "orchestrator", tier: 2,
    current_task: null,
    health: { last_seen: new Date(Date.now()-7200000).toISOString(), uptime_percent: 88.0, error_count_24h: 2 },
    metrics: { tasks_completed_24h: 0, tokens_used_24h: 0, avg_response_time_ms: 0 },
    activity: [2,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  },
];

export const IDEAS: Idea[] = [
  // ── IDEA ROOM ─────────────────────────────────────────────────────────────
  {
    id: "1",
    title: "Financial Robot — AI Newsletter",
    description: "AI-powered financial newsletter platform with automated market analysis and personalized content for subscribers.",
    stage: "raw",
    tags: ["website", "midas", "newsletter", "monetization"],
    priority: "high",
    created_at: "2026-03-18T19:49:59Z",
    updated_at: "2026-03-20T22:00:00Z",
  },
  {
    id: "2",
    title: "Web Services Business",
    description: "Full-service web development agency targeting local NJ businesses. Build websites, landing pages, and digital presence packages.",
    stage: "raw",
    tags: ["agency", "euge", "local", "web"],
    priority: "critical",
    created_at: "2026-03-18T14:00:00Z",
    updated_at: "2026-03-20T21:00:00Z",
  },
  {
    id: "3",
    title: "Lab Dashboard MVP",
    description: "Control room interface for monitoring all lab agents, ideas, and tools in real-time.",
    stage: "research",
    tags: ["internal", "kirby", "frida", "mvp"],
    priority: "critical",
    created_at: "2026-03-20T00:00:00Z",
    updated_at: "2026-03-20T23:00:00Z",
  },
  {
    id: "4",
    title: "AI Tutoring Platform",
    description: "Personalized AI tutors for students using adaptive learning algorithms.",
    stage: "research",
    tags: ["edtech", "ai", "saas"],
    priority: "medium",
    created_at: "2026-03-17T10:00:00Z",
    updated_at: "2026-03-19T15:00:00Z",
  },
  {
    id: "5",
    title: "Van Ads Booking System",
    description: "Self-serve booking platform for Oscar's mobile LED advertising van with Stripe integration.",
    stage: "validation",
    tags: ["client", "oscar", "euge", "stripe"],
    priority: "high",
    created_at: "2026-03-20T20:00:00Z",
    updated_at: "2026-03-20T22:30:00Z",
  },
  {
    id: "6",
    title: "NJ Local Services Marketplace",
    description: "Hyperlocal marketplace connecting NJ homeowners with vetted contractors, cleaners, and handymen.",
    stage: "business_plan",
    tags: ["marketplace", "local", "euge"],
    priority: "medium",
    created_at: "2026-03-15T08:00:00Z",
    updated_at: "2026-03-19T12:00:00Z",
  },
  {
    id: "7",
    title: "Crypto Portfolio Tracker Pro",
    description: "Advanced portfolio tracking with tax optimization, DeFi yield aggregation, and automated rebalancing alerts.",
    stage: "approved",
    tags: ["crypto", "midas", "saas", "fintech"],
    priority: "high",
    assigned_to: "frida",
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-21T18:00:00Z",
    blueprint: {
      generated_at: "2026-03-21T18:00:00Z",
      product_type: "web app",
      brand_requirements: "Design brand identity for a premium crypto tracking product — dark theme, gold/green palette, data-forward design language.",
      tech_requirements: "Build MVP with Next.js frontend, FastAPI backend, CoinGecko API integration, and PostgreSQL for portfolio storage.",
      design_status: "in_progress",
      dev_status: "pending",
      design_agent: "frida",
      dev_agent: "kirby",
      assets: [],
      notes: "Auto-generated blueprint — Phase 1: branding + wireframes",
    },
  },

  // ── DEV ROOM ──────────────────────────────────────────────────────────────
  {
    id: "8",
    title: "Oscar Van Ads Website",
    description: "Marketing website + booking portal for Oscar's LED advertising van service.",
    stage: "design",
    tags: ["client", "oscar", "website"],
    priority: "critical",
    assigned_to: "frida",
    created_at: "2026-03-12T10:00:00Z",
    updated_at: "2026-03-21T20:00:00Z",
    blueprint: {
      generated_at: "2026-03-21T15:00:00Z",
      product_type: "website",
      brand_requirements: "Design brand identity for Oscar's mobile LED van ads business — bold, high-energy, local NJ vibe.",
      tech_requirements: "Build bilingual (EN/ES) Next.js 14 site with Stripe booking, Tailwind CSS, and Vercel deployment.",
      design_status: "in_progress",
      dev_status: "pending",
      design_agent: "frida",
      dev_agent: "kirby",
      assets: ["brand-kit-v1.fig", "wireframes-v2.pdf"],
      notes: "Client approved color palette — yellow/black. Kirby waiting on Frida's handoff.",
    },
  },
  {
    id: "9",
    title: "Midas Financial Dashboard",
    description: "Real-time financial dashboard for tracking portfolio performance, P&L, and cash flow across all accounts.",
    stage: "development",
    tags: ["internal", "midas", "dashboard"],
    priority: "high",
    assigned_to: "kirby",
    created_at: "2026-03-08T09:00:00Z",
    updated_at: "2026-03-21T16:00:00Z",
    blueprint: {
      generated_at: "2026-03-15T10:00:00Z",
      product_type: "web app",
      brand_requirements: "Extend Lab Dashboard aesthetic — dark navy, gold accents, Orbitron font for headings.",
      tech_requirements: "Next.js + FastAPI + PostgreSQL. Real-time WebSocket updates for live portfolio tickers.",
      design_status: "done",
      dev_status: "in_progress",
      design_agent: "frida",
      dev_agent: "kirby",
      assets: ["design-system.fig", "api-spec.yaml"],
      notes: "Frida's mockups approved. Kirby building backend API — ETA 3 days.",
    },
  },
  {
    id: "10",
    title: "Orchestrator Telegram Bot v2",
    description: "Full rebuild of Orchestrator's Telegram interface with inline keyboards, voice messages, and agent-switching.",
    stage: "testing",
    tags: ["internal", "orchestrator", "telegram"],
    priority: "medium",
    assigned_to: "kirby",
    created_at: "2026-03-05T08:00:00Z",
    updated_at: "2026-03-21T14:00:00Z",
    blueprint: {
      generated_at: "2026-03-10T08:00:00Z",
      product_type: "bot",
      brand_requirements: "N/A — internal tool. Standard lab aesthetic for any web components.",
      tech_requirements: "Python + python-telegram-bot v21, OpenClaw integration, SQLite session storage.",
      design_status: "done",
      dev_status: "in_progress",
      design_agent: "frida",
      dev_agent: "kirby",
      assets: ["flow-diagram.png"],
      notes: "QA testing in staging. Voice message handling has edge case bug — fix pending.",
    },
  },
];

export const TOOLS: Tool[] = [
  { id: "1", name: "Web Search", slug: "web-search", emoji: "🔍", type: "research", status: "active" },
  { id: "2", name: "File Manager", slug: "file-manager", emoji: "📁", type: "system", status: "active" },
  { id: "3", name: "Telegram Bot", slug: "telegram", emoji: "📱", type: "communication", status: "active" },
  { id: "4", name: "Nextcloud", slug: "nextcloud", emoji: "☁️", type: "storage", status: "active" },
  { id: "5", name: "Canva MCP", slug: "canva-mcp", emoji: "🎨", type: "design", status: "active" },
  { id: "6", name: "ElevenLabs TTS", slug: "elevenlabs", emoji: "🔊", type: "media", status: "active" },
  { id: "7", name: "Printer (CUPS)", slug: "printer", emoji: "🖨️", type: "hardware", status: "active" },
  { id: "8", name: "Tuya Smart Home", slug: "tuya", emoji: "💡", type: "iot", status: "active" },
  { id: "9", name: "PDF Creator", slug: "pdf-creator", emoji: "📄", type: "output", status: "active" },
  { id: "10", name: "Whisper STT", slug: "whisper", emoji: "🎤", type: "media", status: "inactive" },
  { id: "11", name: "OpenWeather API", slug: "openweather", emoji: "🌤️", type: "data", status: "error" },
  { id: "12", name: "DB Write", slug: "db-write", emoji: "🗄️", type: "database", status: "active" },
];

export const ACTIVITY_FEED: ActivityEvent[] = [
  { id: "1", timestamp: new Date(Date.now()-120000).toISOString(), agent_slug: "frida", agent_emoji: "🎨", action: "Building Lab Dashboard frontend — Phase 1" },
  { id: "2", timestamp: new Date(Date.now()-240000).toISOString(), agent_slug: "orchestrator", agent_emoji: "⚡", action: "Assigned frontend task to Frida — TASK.md updated" },
  { id: "3", timestamp: new Date(Date.now()-480000).toISOString(), agent_slug: "euge", agent_emoji: "📊", action: "Oscar flyer generated and printed via Canva MCP" },
  { id: "4", timestamp: new Date(Date.now()-720000).toISOString(), agent_slug: "frida", agent_emoji: "🎨", action: "Oscar Van Ads demo.html created and uploaded to Nextcloud" },
  { id: "5", timestamp: new Date(Date.now()-1200000).toISOString(), agent_slug: "midas", agent_emoji: "💰", action: "Portfolio briefing PDF exported — Midas/Reports/" },
  { id: "6", timestamp: new Date(Date.now()-2400000).toISOString(), agent_slug: "anonymous", agent_emoji: "🛡️", action: "Security scan complete — system clean" },
  { id: "7", timestamp: new Date(Date.now()-3600000).toISOString(), agent_slug: "kirby", agent_emoji: "💻", action: "DATA_CONTRACT.md finalized — awaiting approval" },
  { id: "8", timestamp: new Date(Date.now()-5400000).toISOString(), agent_slug: "orchestrator", agent_emoji: "⚡", action: "Heartbeat OK — all systems nominal" },
];

export const SYSTEM_LOGS = [
  "SESSION ACTIVE: agent:main:telegram:direct:1234567890",
  "MEMORY LOADED: MEMORY.md — 158 lines",
  "CANVA MCP: Connected — 22 tools available",
  "NEXTCLOUD: Online — http://localhost:8081",
  "FRIDA: Phase 1 frontend build initiated",
  "KIRBY: Backend scaffold pending",
  "TOOLS LOADED: 12 active, 1 inactive, 1 error",
  "TELEGRAM: 6 active bot accounts",
  "HEARTBEAT OK — 2026-03-20T23:46:00Z",
  "ECOSYSTEM SCAN: 7 agents detected",
];

// Pipeline counts split by room
export const PIPELINE_COUNTS: Record<IdeaStage, number> = {
  raw: 2,
  research: 2,
  validation: 1,
  business_plan: 1,
  approved: 1,
  queue: 1,
  design: 1,
  development: 1,
  testing: 1,
  launched: 0,
  archived: 0,
};

export const PIPELINE_COUNTS_BY_ROOM = {
  idea_room: {
    raw: 2,
    research: 2,
    validation: 1,
    business_plan: 1,
    approved: 1,
  },
  dev_room: {
    design: 1,
    development: 1,
    testing: 1,
    launched: 0,
  },
};
