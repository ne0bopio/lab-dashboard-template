"""
Pipeline state machine logic — stage transitions, validation, event logging.

Two rooms:
  Idea Room:        raw → research → validation → business_plan → approved
  Development Room: design → development → testing → launched

When an idea reaches 'approved', a blueprint is auto-generated.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

logger = logging.getLogger(__name__)

# Idea Room pipeline
IDEA_ROOM_STAGES = ["raw", "research", "validation", "business_plan", "approved"]

# Development Room pipeline
DEV_ROOM_STAGES = ["design", "development", "testing", "launched"]

# Full ordered pipeline (idea room → dev room)
STAGE_ORDER = IDEA_ROOM_STAGES + DEV_ROOM_STAGES


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_nested(d: dict, dotted_key: str):
    """Traverse a dict using dot notation. Returns None if missing."""
    keys = dotted_key.split(".")
    current = d
    for k in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(k)
    return current


def get_room(stage: str) -> str:
    """Return which room a stage belongs to."""
    if stage in IDEA_ROOM_STAGES:
        return "idea_room"
    elif stage in DEV_ROOM_STAGES:
        return "dev_room"
    elif stage == "archived":
        return "archived"
    return "unknown"


STAGE_REQUIRED_FIELDS: dict[str, list[str]] = {
    "raw": ["title", "description"],
    "research": [
        "research.market_size",
        "research.competitors",
        "research.target_audience",
    ],
    "validation": [
        "validation.go_no_go",
    ],
    "business_plan": [
        "business_plan.revenue_model",
        "business_plan.mvp_description",
        "business_plan.milestones",
    ],
    "approved": [],  # Blueprint gets auto-generated on entry
    "design": [
        "blueprint.brand_requirements",
    ],
    "development": [
        "blueprint.tech_requirements",
    ],
    "testing": [
        "execution.github_repo",
    ],
}


def idea_as_dict(idea) -> dict:
    """Flatten idea into a dict for nested field traversal."""
    return {
        "title": idea.title,
        "description": idea.description,
        "research": idea.research or {},
        "validation": idea.validation or {},
        "business_plan": idea.business_plan or {},
        "execution": idea.execution or {},
        "blueprint": idea.blueprint or {},
    }


def can_advance(idea) -> tuple[bool, list[str]]:
    """
    Check if current stage is complete enough to advance.
    Returns (ok, missing_fields).
    """
    required = STAGE_REQUIRED_FIELDS.get(idea.stage, [])
    if not required:
        return True, []

    data = idea_as_dict(idea)
    missing = []
    for field in required:
        val = get_nested(data, field)
        if val is None or val == [] or val == "":
            missing.append(field)

    return len(missing) == 0, missing


def generate_blueprint(idea) -> dict:
    """
    Generate a blueprint when an idea is approved.
    Summarizes the business plan into actionable briefs for Frida and Kirby.
    """
    bp = idea.business_plan or {}
    ts = now_utc()

    # Determine product type from tags and description
    tags = idea.tags or []
    desc = (idea.description or "").lower()
    if any(t in tags for t in ["website", "web", "landing-page"]) or "website" in desc:
        product_type = "website"
    elif any(t in tags for t in ["app", "mobile"]):
        product_type = "app"
    elif any(t in tags for t in ["saas", "platform"]):
        product_type = "service"
    else:
        product_type = "product"

    blueprint = {
        "generated_at": ts.isoformat(),
        "product_type": product_type,
        "brand_requirements": f"Design brand identity for: {idea.title}. {bp.get('mvp_description', 'See business plan for details.')}",
        "tech_requirements": f"Build MVP for: {idea.title}. Revenue model: {bp.get('revenue_model', 'TBD')}. {bp.get('mvp_description', '')}",
        "design_status": "pending",
        "dev_status": "pending",
        "design_agent": "frida",
        "dev_agent": "kirby",
        "assets": [],
        "notes": f"Auto-generated blueprint from approved idea. Milestones: {len(bp.get('milestones', []))} defined.",
    }
    return blueprint


def advance_idea(idea, triggered_by: str, notes: Optional[str], session: Session):
    """
    Advance idea to the next stage in the pipeline.
    Raises ValueError if the current stage isn't complete.
    """
    from models import EventType, IdeaStage, PipelineEvent, TriggerType, now_utc

    if idea.stage == IdeaStage.archived:
        raise ValueError("Cannot advance an archived idea.")
    if idea.stage == IdeaStage.launched:
        raise ValueError("Idea is already launched.")

    ok, missing = can_advance(idea)
    if not ok:
        raise ValueError(
            f"Stage '{idea.stage}' is incomplete. Missing fields: {', '.join(missing)}"
        )

    if idea.stage not in STAGE_ORDER:
        raise ValueError(f"Unknown stage: {idea.stage}")

    current_idx = STAGE_ORDER.index(idea.stage)
    if current_idx >= len(STAGE_ORDER) - 1:
        raise ValueError("Already at final stage.")

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
        "agent": triggered_by if triggered_by != "orchestrator" else None,
        "notes": notes,
        "room": get_room(next_stage),
    })

    idea.stage = next_stage
    idea.status = next_stage
    idea.updated_at = ts
    idea.stage_history = history
    if triggered_by:
        idea.assigned_to = triggered_by

    # Auto-generate blueprint when entering 'approved' stage
    if next_stage == "approved":
        idea.blueprint = generate_blueprint(idea)
        logger.info(f"Blueprint generated for '{idea.title}'")

    # Auto-assign agents when entering dev room
    if next_stage == "design":
        idea.assigned_to = "frida"
    elif next_stage == "development":
        idea.assigned_to = "kirby"

    # Log the event
    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.stage_advanced,
        from_stage=prev_stage,
        to_stage=next_stage,
        triggered_by=triggered_by,
        trigger_type=TriggerType.manual,
        timestamp=ts,
        notes=notes,
        event_metadata={"room": get_room(next_stage)},
    )
    session.add(event)

    logger.info(f"Idea '{idea.title}' advanced: {prev_stage} → {next_stage} (room: {get_room(next_stage)})")
    return idea, event
