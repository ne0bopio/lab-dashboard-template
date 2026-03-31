# Lab Dashboard Template

**A ready-to-deploy mission control dashboard for [OpenClaw](https://openclaw.ai) agent teams.**

Monitor your agents, manage tasks, track projects, browse workspaces — all from a single dashboard.

## What You Get

- **Agent Roster** — auto-discovers agents from your OpenClaw workspace, shows live status
- **Kanban Task Board** — drag-and-drop tasks across columns (backlog → in_progress → review → done)
- **Workspace File Browser** — browse and edit any file in your OpenClaw workspace from the browser
- **Ideas Pipeline** — track ideas through stages (raw → researched → validated → built)
- **Website Pipeline** — intake → discovery → design → develop → review → deliver
- **Docs Section** — shared knowledge store for your agent team
- **Calendar** — events and deadlines

## Stack

- **Backend:** Python + FastAPI + SQLite (zero config database, auto-creates)
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Auth:** API key header (`X-API-Key`)

## Quick Start (5 minutes)

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/lab-dashboard-template.git
cd lab-dashboard-template
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Set your API key (or use the default for testing)
export LAB_API_KEY="your-secret-key"

python main.py
# ⚡ Running on http://localhost:8000
# 📄 API docs at http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install

# Edit .env.local with your API key
# NEXT_PUBLIC_API_KEY=your-secret-key

npm run dev
# Running on http://localhost:3000
```

### 4. Open

Go to **http://localhost:3000** — your dashboard is live.

## Configuration

All config is via environment variables. Copy `backend/.env.example` to `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `LAB_API_KEY` | `change-me-please` | API authentication key |
| `LAB_DB_PATH` | `./data/lab.db` | SQLite database path (auto-created) |
| `OPENCLAW_HOME` | `~/.openclaw` | OpenClaw home directory |
| `WORKSPACE_ROOT` | `~/.openclaw` | Root path for workspace file browser |
| `TOOLS_DIR` | `~/.openclaw/tools` | Tools directory to scan |
| `TELEGRAM_BOT_TOKEN` | *(empty)* | Optional: Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | *(empty)* | Optional: Telegram chat ID for notifications |

## How It Connects to OpenClaw

The dashboard auto-discovers your setup:

1. **Agents** — scans `~/.openclaw/workspace-*` directories, reads `IDENTITY.md` from each
2. **Tools** — scans `~/.openclaw/tools/*.py`, reads docstrings for descriptions
3. **Status** — checks if `openclaw-gateway` process is running
4. **Workspace browser** — reads/writes files under your OpenClaw home directory

No manual configuration needed — if OpenClaw is installed, the dashboard finds everything.

## API Endpoints

All endpoints are under `/api/v1/` and require `X-API-Key` header.

### Tasks (Kanban)
```
GET    /api/v1/tasks          — list all tasks
POST   /api/v1/tasks          — create task
PATCH  /api/v1/tasks/{id}     — update task
DELETE /api/v1/tasks/{id}     — delete task
```

### Agents
```
GET    /api/v1/agents         — list agents (live status)
GET    /api/v1/agents/{slug}  — get agent details
```

### Workspace
```
GET    /api/v1/workspace/tree          — file tree
GET    /api/v1/workspace/file?path=... — read file
PUT    /api/v1/workspace/file?path=... — update file
POST   /api/v1/workspace/file?path=... — create file
DELETE /api/v1/workspace/file?path=... — trash file
```

### Website Pipeline
```
GET    /api/v1/websites                — list all projects
POST   /api/v1/websites                — create project
PATCH  /api/v1/websites/{id}/advance   — advance to next stage
GET    /api/v1/websites/{id}/history   — stage history
```

### Other
```
GET    /api/v1/dashboard    — system overview
GET    /api/v1/docs         — documentation store
GET    /api/v1/calendar     — calendar events
GET    /api/v1/ideas        — ideas pipeline
GET    /api/v1/tools        — tool inventory
GET    /api/v1/rooms        — processing rooms
GET    /api/v1/events       — system event log
```

## Production Deploy

```bash
# Backend — run with nohup or systemd
cd backend
export LAB_API_KEY="your-production-key"
nohup python main.py > /var/log/lab-dashboard.log 2>&1 &

# Frontend — build for production
cd frontend
npm run build
nohup npm start > /var/log/lab-frontend.log 2>&1 &
```

Or create systemd services for auto-restart on reboot.

## For AI Agents

If you're an AI agent setting this up for your human:

1. Clone the repo and install dependencies (Python + Node.js required)
2. Set `LAB_API_KEY` to something unique — don't use the default
3. The database auto-creates on first run — no setup needed
4. Agent names auto-populate from your OpenClaw workspace IDENTITY.md files
5. The workspace browser path defaults to `~/.openclaw` — set `WORKSPACE_ROOT` if different
6. Optional: set up Telegram notifications with bot token + chat ID

## License

MIT — Built for [OpenClaw](https://openclaw.ai) agent systems. Use it, modify it, make it yours.
