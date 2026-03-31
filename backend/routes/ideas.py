"""
Ideas API routes — full CRUD + advance + sync.
"""
from __future__ import annotations

import hashlib
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from db import get_session
from models import (
    Idea,
    IdeaAdvanceRequest,
    IdeaBlockRequest,
    IdeaCreate,
    IdeaStage,
    IdeaUpdate,
    PipelineEvent,
    EventType,
    TriggerType,
    now_utc,
)
from services.notifications import notify_telegram_sync
from services.pipeline import advance_idea, can_advance, get_room, IDEA_ROOM_STAGES, DEV_ROOM_STAGES
from services.sync import sync_tesla, title_hash

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ideas", tags=["ideas"])


# ─── Helpers ────────────────────────────────────────────────────

def get_idea_or_404(idea_id: str, session: Session) -> Idea:
    idea = session.get(Idea, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail=f"Idea {idea_id} not found")
    return idea


# ─── Stats ──────────────────────────────────────────────────────

@router.get("/stats")
def get_idea_stats(session: Session = Depends(get_session)):
    """Pipeline funnel metrics — split by room."""
    ideas = session.exec(select(Idea)).all()
    by_stage = {s.value: 0 for s in IdeaStage}
    idea_room_count = 0
    dev_room_count = 0
    for idea in ideas:
        stage = idea.stage if idea.stage in [s.value for s in IdeaStage] else "raw"
        by_stage[stage] = by_stage.get(stage, 0) + 1
        room = get_room(stage)
        if room == "idea_room":
            idea_room_count += 1
        elif room == "dev_room":
            dev_room_count += 1
    return {
        "total": len(ideas),
        "by_stage": by_stage,
        "idea_room": idea_room_count,
        "dev_room": dev_room_count,
    }


# ─── Tesla Sync ─────────────────────────────────────────────────

@router.post("/sync/tesla")
def sync_from_tesla(session: Session = Depends(get_session)):
    """Import/sync ideas from tesla/ideas.json."""
    result = sync_tesla(session)
    return result


# ─── List ───────────────────────────────────────────────────────

@router.get("", response_model=List[dict])
def list_ideas(
    stage: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    """List all ideas. Filter: ?stage=raw&tags=midas"""
    query = select(Idea)
    if stage:
        query = query.where(Idea.stage == stage)
    ideas = session.exec(query).all()

    # Filter by tags if provided
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        ideas = [i for i in ideas if any(t in (i.tags or []) for t in tag_list)]

    return [idea.model_dump() for idea in ideas]


# ─── Create ─────────────────────────────────────────────────────

@router.post("", response_model=dict, status_code=201)
def create_idea(body: IdeaCreate, session: Session = Depends(get_session)):
    """Create a new idea."""
    ts = now_utc()
    th = title_hash(body.title)

    # Check for duplicate
    existing = session.exec(select(Idea).where(Idea.title_hash == th)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Idea with this title already exists")

    idea = Idea(
        title=body.title,
        description=body.description,
        tags=body.tags,
        source=body.source,
        priority=body.priority,
        stage=IdeaStage.raw,
        status="raw",
        title_hash=th,
        created_at=ts,
        updated_at=ts,
        stage_history=[{
            "stage": IdeaStage.raw,
            "entered_at": ts.isoformat(),
            "exited_at": None,
            "agent": None,
            "notes": None,
        }]
    )
    session.add(idea)
    session.flush()

    # Log creation event
    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.idea_created,
        triggered_by="orchestrator",
        trigger_type=TriggerType.manual,
        timestamp=ts,
        notes=f"Idea '{idea.title}' created",
        event_metadata={"source": body.source},
    )
    session.add(event)
    session.commit()
    session.refresh(idea)

    # Notify
    notify_telegram_sync(f"💡 New idea: <b>{idea.title}</b>")

    return idea.model_dump()


# ─── Get by ID ──────────────────────────────────────────────────

@router.get("/{idea_id}", response_model=dict)
def get_idea(idea_id: str, session: Session = Depends(get_session)):
    """Get full idea detail."""
    idea = get_idea_or_404(idea_id, session)
    return idea.model_dump()


# ─── Update ─────────────────────────────────────────────────────

@router.patch("/{idea_id}", response_model=dict)
def update_idea(idea_id: str, body: IdeaUpdate, session: Session = Depends(get_session)):
    """Update idea fields."""
    idea = get_idea_or_404(idea_id, session)
    ts = now_utc()

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(idea, field, value)

    # Recalculate title hash if title changed
    if "title" in update_data:
        idea.title_hash = title_hash(idea.title)

    idea.updated_at = ts
    session.add(idea)
    session.commit()
    session.refresh(idea)
    return idea.model_dump()


# ─── Delete (soft — archive) ────────────────────────────────────

@router.delete("/{idea_id}", response_model=dict)
def delete_idea(idea_id: str, session: Session = Depends(get_session)):
    """Archive an idea (soft delete)."""
    idea = get_idea_or_404(idea_id, session)
    ts = now_utc()

    prev_stage = idea.stage
    idea.stage = IdeaStage.archived
    idea.status = "archived"
    idea.updated_at = ts

    # Update stage history
    history = list(idea.stage_history or [])
    for entry in history:
        if entry.get("stage") == prev_stage and entry.get("exited_at") is None:
            entry["exited_at"] = ts.isoformat()
            break
    history.append({
        "stage": IdeaStage.archived,
        "entered_at": ts.isoformat(),
        "exited_at": None,
        "agent": "orchestrator",
        "notes": "Archived via DELETE",
    })
    idea.stage_history = history

    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.idea_archived,
        from_stage=prev_stage,
        to_stage=IdeaStage.archived,
        triggered_by="orchestrator",
        trigger_type=TriggerType.manual,
        timestamp=ts,
        event_metadata={},
    )
    session.add(event)
    session.add(idea)
    session.commit()
    session.refresh(idea)
    return {"message": "Idea archived", "id": idea_id, "stage": idea.stage}


# ─── Advance ────────────────────────────────────────────────────

@router.post("/{idea_id}/advance", response_model=dict)
def advance_idea_endpoint(
    idea_id: str,
    body: IdeaAdvanceRequest,
    session: Session = Depends(get_session),
):
    """Advance idea to next stage in the pipeline.
    Agents can advance up to business_plan. Only Orchestrator can advance past that."""
    idea = get_idea_or_404(idea_id, session)
    triggered_by = body.assigned_to or "orchestrator"

    # Lock: only Orchestrator can advance past business_plan
    ORCHESTRATOR_ONLY_STAGES = {"business_plan", "approved", "execution", "design", "development", "testing"}
    if idea.stage in ORCHESTRATOR_ONLY_STAGES and triggered_by != "orchestrator":
        raise HTTPException(
            status_code=403,
            detail=f"Only Orchestrator can advance ideas past {idea.stage}. Current agent: {triggered_by}"
        )

    try:
        idea, event = advance_idea(idea, triggered_by, body.notes, session)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    session.add(idea)
    session.commit()
    session.refresh(idea)

    # Notify
    notify_telegram_sync(f"⚡ <b>{idea.title}</b> advanced to {idea.stage}")

    return {
        "message": f"Advanced to '{idea.stage}'",
        "idea": idea.model_dump(),
        "event_id": event.id,
    }


# ─── Block ──────────────────────────────────────────────────────

@router.post("/{idea_id}/block", response_model=dict)
def block_idea(idea_id: str, body: IdeaBlockRequest, session: Session = Depends(get_session)):
    """Block an idea with a reason."""
    idea = get_idea_or_404(idea_id, session)
    ts = now_utc()

    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.stage_blocked,
        from_stage=idea.stage,
        to_stage=idea.stage,
        triggered_by=body.triggered_by,
        trigger_type=TriggerType.manual,
        timestamp=ts,
        notes=body.reason,
        event_metadata={"blocked": True},
    )
    session.add(event)
    session.commit()

    # Notify
    notify_telegram_sync(f"🚫 <b>{idea.title}</b> blocked at {idea.stage}: {body.reason}")

    return {"message": "Idea blocked", "idea_id": idea_id, "reason": body.reason}


# ─── Stage History ──────────────────────────────────────────────

@router.get("/{idea_id}/history", response_model=dict)
def get_idea_history(idea_id: str, session: Session = Depends(get_session)):
    """Stage history + audit log for an idea."""
    idea = get_idea_or_404(idea_id, session)
    events = session.exec(
        select(PipelineEvent)
        .where(PipelineEvent.idea_id == idea_id)
        .order_by(PipelineEvent.timestamp)
    ).all()

    return {
        "idea_id": idea_id,
        "title": idea.title,
        "current_stage": idea.stage,
        "stage_history": idea.stage_history,
        "events": [e.model_dump() for e in events],
    }


# ─── Sub-resource updates (research, validation, etc.) ──────────

@router.patch("/{idea_id}/research", response_model=dict)
def update_research(idea_id: str, body: dict, session: Session = Depends(get_session)):
    idea = get_idea_or_404(idea_id, session)
    current = dict(idea.research or {})
    current.update(body)
    idea.research = current
    idea.updated_at = now_utc()

    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.comment_added,
        from_stage=idea.stage,
        to_stage=idea.stage,
        triggered_by="api",
        trigger_type=TriggerType.manual,
        timestamp=now_utc(),
        notes=f"Research fields updated: {', '.join(body.keys())}",
        event_metadata={"updated_fields": list(body.keys()), "block": "research"},
    )
    session.add(event)
    session.add(idea)
    session.commit()
    session.refresh(idea)
    return idea.model_dump()


@router.patch("/{idea_id}/validation", response_model=dict)
def update_validation(idea_id: str, body: dict, session: Session = Depends(get_session)):
    idea = get_idea_or_404(idea_id, session)
    current = dict(idea.validation or {})
    current.update(body)
    idea.validation = current
    idea.updated_at = now_utc()

    # Log score update if score changed
    if "score" in body:
        event = PipelineEvent(
            idea_id=idea.id,
            event_type=EventType.score_updated,
            triggered_by="api",
            trigger_type=TriggerType.manual,
            timestamp=now_utc(),
            notes=f"Score set to {body.get('score')}",
            event_metadata={"score": body.get("score")},
        )
        session.add(event)

    session.add(idea)
    session.commit()
    session.refresh(idea)
    return idea.model_dump()


@router.patch("/{idea_id}/business_plan", response_model=dict)
def update_business_plan(idea_id: str, body: dict, session: Session = Depends(get_session)):
    idea = get_idea_or_404(idea_id, session)
    current = dict(idea.business_plan or {})
    current.update(body)
    idea.business_plan = current
    idea.updated_at = now_utc()

    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.comment_added,
        from_stage=idea.stage,
        to_stage=idea.stage,
        triggered_by="api",
        trigger_type=TriggerType.manual,
        timestamp=now_utc(),
        notes=f"Business plan fields updated: {', '.join(body.keys())}",
        event_metadata={"updated_fields": list(body.keys()), "block": "business_plan"},
    )
    session.add(event)
    session.add(idea)
    session.commit()
    session.refresh(idea)
    return idea.model_dump()


@router.patch("/{idea_id}/execution", response_model=dict)
def update_execution(idea_id: str, body: dict, session: Session = Depends(get_session)):
    idea = get_idea_or_404(idea_id, session)
    current = dict(idea.execution or {})
    current.update(body)
    idea.execution = current
    idea.updated_at = now_utc()

    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.comment_added,
        from_stage=idea.stage,
        to_stage=idea.stage,
        triggered_by="api",
        trigger_type=TriggerType.manual,
        timestamp=now_utc(),
        notes=f"Execution fields updated: {', '.join(body.keys())}",
        event_metadata={"updated_fields": list(body.keys()), "block": "execution"},
    )
    session.add(event)
    session.add(idea)
    session.commit()
    session.refresh(idea)
    return idea.model_dump()


@router.patch("/{idea_id}/blueprint", response_model=dict)
def update_blueprint(idea_id: str, body: dict, session: Session = Depends(get_session)):
    """Update blueprint fields (design/dev briefs, status, assets)."""
    idea = get_idea_or_404(idea_id, session)
    current = dict(idea.blueprint or {})
    current.update(body)
    idea.blueprint = current
    idea.updated_at = now_utc()

    event = PipelineEvent(
        idea_id=idea.id,
        event_type=EventType.comment_added,
        from_stage=idea.stage,
        to_stage=idea.stage,
        triggered_by="api",
        trigger_type=TriggerType.manual,
        timestamp=now_utc(),
        notes=f"Blueprint fields updated: {', '.join(body.keys())}",
        event_metadata={"updated_fields": list(body.keys()), "block": "blueprint"},
    )
    session.add(event)
    session.add(idea)
    session.commit()
    session.refresh(idea)
    return idea.model_dump()


# ─── Room Views ─────────────────────────────────────────────────

@router.get("/rooms/idea-room", response_model=List[dict])
def list_idea_room(session: Session = Depends(get_session)):
    """List ideas in the Idea Room (raw → approved)."""
    ideas = session.exec(select(Idea)).all()
    result = [i.model_dump() for i in ideas if i.stage in IDEA_ROOM_STAGES]
    return result


@router.get("/rooms/dev-room", response_model=List[dict])
def list_dev_room(session: Session = Depends(get_session)):
    """List ideas in the Development Room (design → launched)."""
    ideas = session.exec(select(Idea)).all()
    result = [i.model_dump() for i in ideas if i.stage in DEV_ROOM_STAGES]
    return result
