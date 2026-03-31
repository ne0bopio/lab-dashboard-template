"""
Automation services — auto-advance ideas, monitor agent health.
Runs on APScheduler background jobs.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlmodel import Session, select

from db import engine
from models import (
    EventType,
    Idea,
    IdeaStage,
    PipelineEvent,
    Room,
    SystemEvent,
    TriggerType,
    now_utc,
)
from services.agent_health import scan_agents_live
from services.notifications import notify_telegram_sync
from services.pipeline import can_advance, STAGE_ORDER

logger = logging.getLogger(__name__)

# ─── Agent Health Monitoring ────────────────────────────────────

_previous_agent_status: dict[str, str] = {}


def initialize_agent_baseline():
    """Populate initial agent status on startup."""
    global _previous_agent_status
    agents = scan_agents_live()
    for agent in agents:
        _previous_agent_status[agent["slug"]] = agent["status"]
    logger.info(f"Agent baseline initialized: {len(_previous_agent_status)} agents")


def monitor_agent_health():
    """Check agent status changes and notify on transitions."""
    global _previous_agent_status
    agents = scan_agents_live()

    with Session(engine) as session:
        for agent in agents:
            slug = agent["slug"]
            new_status = agent["status"]
            old_status = _previous_agent_status.get(slug)

            if old_status and old_status != new_status:
                name = agent.get("name", slug)
                emoji = agent.get("emoji", "🤖")

                # Log system event
                event = SystemEvent(
                    event_type="agent_status_change",
                    source=slug,
                    message=f"{emoji} {name}: {old_status} → {new_status}",
                    timestamp=now_utc(),
                    event_metadata={"old_status": old_status, "new_status": new_status},
                )
                session.add(event)

                # Notify on important transitions
                if new_status == "offline" and old_status in ("running", "idle"):
                    notify_telegram_sync(f"🔴 <b>{name}</b> went offline")
                elif new_status in ("running", "idle") and old_status == "offline":
                    notify_telegram_sync(f"🟢 <b>{name}</b> is back online")

                logger.info(f"Agent {slug}: {old_status} → {new_status}")

            _previous_agent_status[slug] = new_status

        session.commit()


# ─── Auto-Advance Ideas ────────────────────────────────────────

def auto_advance_ideas():
    """DISABLED — pipeline_runner.py handles all stage transitions via Discord.
    Auto-advance was causing ideas to skip Orchestrator review and jump stages.
    Keeping function signature so scheduler doesn't crash."""
    return
    with Session(engine) as session:
        # Check if any room has auto_advance enabled
        rooms = session.exec(select(Room)).all()
        auto_advance_enabled = any(
            r.config.get("auto_advance", False) for r in rooms
        )

        if not auto_advance_enabled:
            logger.debug("Auto-advance: no rooms have auto_advance enabled, skipping")
            return

        # Get all active ideas (not launched, not archived)
        ideas = session.exec(
            select(Idea).where(
                Idea.stage.notin_([IdeaStage.launched, IdeaStage.archived])
            )
        ).all()

        advanced_count = 0

        for idea in ideas:
            # Don't auto-advance from execution to launched
            if idea.stage == IdeaStage.execution:
                continue

            # Check if current stage is complete
            ok, missing = can_advance(idea)
            if not ok:
                continue

            # Get next stage
            if idea.stage not in STAGE_ORDER:
                continue
            current_idx = STAGE_ORDER.index(idea.stage)
            if current_idx >= len(STAGE_ORDER) - 1:
                continue
            next_stage = STAGE_ORDER[current_idx + 1]

            prev_stage = idea.stage
            ts = now_utc()

            # Update stage history
            history = list(idea.stage_history or [])
            for entry in history:
                if entry.get("stage") == prev_stage and entry.get("exited_at") is None:
                    entry["exited_at"] = ts.isoformat()
                    break
            history.append({
                "stage": next_stage,
                "entered_at": ts.isoformat(),
                "exited_at": None,
                "agent": "auto-scheduler",
                "notes": "Auto-advanced by scheduler",
            })

            idea.stage = next_stage
            idea.status = next_stage
            idea.updated_at = ts
            idea.stage_history = history

            # Log pipeline event
            event = PipelineEvent(
                idea_id=idea.id,
                event_type=EventType.stage_advanced,
                from_stage=prev_stage,
                to_stage=next_stage,
                triggered_by="auto-scheduler",
                trigger_type=TriggerType.automated,
                timestamp=ts,
                notes="Auto-advanced: all stage fields complete",
                event_metadata={"auto": True},
            )
            session.add(event)
            session.add(idea)

            # Notify
            notify_telegram_sync(
                f"⚡ <b>{idea.title}</b> auto-advanced: {prev_stage} → {next_stage}"
            )

            logger.info(f"Auto-advanced: '{idea.title}' {prev_stage} → {next_stage}")
            advanced_count += 1

        session.commit()

        if advanced_count > 0:
            logger.info(f"Auto-advance cycle: {advanced_count} ideas advanced")
