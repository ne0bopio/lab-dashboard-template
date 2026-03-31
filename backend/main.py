"""
Lab Dashboard — FastAPI Backend
Port: 8000 | Auth: X-API-Key header (set in auth.py or LAB_API_KEY env)
"""
from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend dir is in path for relative imports
sys.path.insert(0, str(Path(__file__).parent))

from auth import require_api_key
from db import init_db
from routes import agents, calendar, dashboard, docs, events, ideas, rooms, tasks, tools, websites, workspace

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB, seed data."""
    logger.info("⚡ Lab Dashboard starting up...")
    init_db()

    from db import engine
    from sqlmodel import Session
    from models import SystemEvent, now_utc

    # Seed mock agent metrics if table is empty
    try:
        from services.metrics import seed_mock_metrics
        with Session(engine) as session:
            count = seed_mock_metrics(session)
            if count > 0:
                logger.info(f"Seeded {count} mock agent metrics")
    except Exception as e:
        logger.warning(f"Metric seed failed (non-fatal): {e}")

    # Initialize agent health baseline
    try:
        from services.automation import initialize_agent_baseline
        initialize_agent_baseline()
    except Exception as e:
        logger.warning(f"Agent baseline init failed (non-fatal): {e}")

    # Log startup system event
    try:
        with Session(engine) as session:
            event = SystemEvent(
                event_type="system_info",
                source="lab-dashboard",
                message="Lab Dashboard API started",
                timestamp=now_utc(),
                event_metadata={"version": "1.0.0"},
            )
            session.add(event)
            session.commit()
    except Exception as e:
        logger.warning(f"Startup event log failed: {e}")

    # Optional: start APScheduler for automation
    scheduler = None
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from services.automation import auto_advance_ideas, monitor_agent_health
        scheduler = AsyncIOScheduler()
        scheduler.add_job(auto_advance_ideas, "interval", minutes=5, id="auto-advance")
        scheduler.add_job(monitor_agent_health, "interval", minutes=2, id="agent-health")
        scheduler.start()
        logger.info("APScheduler started: auto-advance (5min), agent-health (2min)")
    except ImportError:
        logger.info("APScheduler not installed — automation disabled (pip install apscheduler)")
    except Exception as e:
        logger.warning(f"Scheduler start failed (non-fatal): {e}")

    logger.info("⚡ Lab Dashboard ready — http://localhost:8000/api/v1/dashboard")
    yield

    # ── Shutdown ──────────────────────────────────────────────
    logger.info("Lab Dashboard shutting down...")
    if scheduler:
        scheduler.shutdown(wait=False)

    # Log shutdown event
    try:
        with Session(engine) as session:
            event = SystemEvent(
                event_type="system_info",
                source="lab-dashboard",
                message="Lab Dashboard API shutting down",
                timestamp=now_utc(),
                event_metadata={},
            )
            session.add(event)
            session.commit()
    except Exception:
        pass

    logger.info("Lab Dashboard stopped.")


app = FastAPI(
    title="Lab Dashboard API",
    description="AI Agent Lab Dashboard — command center for your agent team",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes require API key auth
AUTH = [Depends(require_api_key)]

PREFIX = "/api/v1"

app.include_router(ideas.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(agents.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(tools.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(rooms.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(dashboard.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(events.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(docs.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(calendar.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(websites.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(workspace.router, prefix=PREFIX, dependencies=AUTH)
app.include_router(tasks.router, prefix=PREFIX, dependencies=AUTH)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "Lab Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api/v1",
        "status": "operational",
    }


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
