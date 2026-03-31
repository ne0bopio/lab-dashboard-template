"""
Website Pipeline API routes — CRUD + advance + stage definitions.
Same pattern as ideas.py but for the Website Demo Pipeline.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from db import get_session
from models import (
    WebsiteProject,
    WebsiteProjectCreate,
    WebsiteProjectUpdate,
    WebsiteAdvanceRequest,
    WebsiteStage,
    WebsitePipelineEvent,
    TriggerType,
    now_utc,
    WEBSITE_STAGE_ORDER,
    WEBSITE_STAGE_DEFINITIONS,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/websites", tags=["websites"])


# ─── Helpers ────────────────────────────────────────────────────

def get_project_or_404(project_id: str, session: Session) -> WebsiteProject:
    project = session.get(WebsiteProject, project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Website project {project_id} not found")
    return project


def next_stage(current: str) -> Optional[str]:
    """Return the next stage in the pipeline, or None if at the end."""
    stage_values = [s.value for s in WEBSITE_STAGE_ORDER]
    if current not in stage_values:
        return None
    idx = stage_values.index(current)
    if idx + 1 >= len(stage_values):
        return None
    return stage_values[idx + 1]


# ─── Stage Definitions ─────────────────────────────────────────

@router.get("/stages")
def list_stages():
    """Return the ordered list of pipeline stage definitions."""
    return WEBSITE_STAGE_DEFINITIONS


# ─── List ───────────────────────────────────────────────────────

@router.get("", response_model=List[dict])
def list_projects(
    stage: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    """List all website projects. Filter: ?stage=intake"""
    query = select(WebsiteProject)
    if stage:
        query = query.where(WebsiteProject.stage == stage)
    projects = session.exec(query).all()
    return [p.model_dump() for p in projects]


# ─── Create ─────────────────────────────────────────────────────

@router.post("", response_model=dict, status_code=201)
def create_project(body: WebsiteProjectCreate, session: Session = Depends(get_session)):
    """Create a new website project at intake stage."""
    ts = now_utc()

    project = WebsiteProject(
        client_name=body.client_name,
        business_type=body.business_type,
        industry=body.industry,
        needs=body.needs,
        competitors=body.competitors,
        brand_assets=body.brand_assets,
        budget=body.budget,
        timeline=body.timeline,
        assigned_to=body.assigned_to,
        notes=body.notes,
        stage=WebsiteStage.intake,
        created_at=ts,
        updated_at=ts,
        stage_history=[{
            "stage": WebsiteStage.intake,
            "entered_at": ts.isoformat(),
            "exited_at": None,
            "agent": None,
            "notes": None,
        }],
    )
    session.add(project)
    session.flush()

    # Log creation event
    event = WebsitePipelineEvent(
        project_id=project.id,
        event_type="project_created",
        triggered_by=body.assigned_to or "orchestrator",
        trigger_type=TriggerType.manual,
        timestamp=ts,
        notes=f"Website project '{project.client_name}' created",
        event_metadata={"industry": body.industry, "needs": body.needs},
    )
    session.add(event)
    session.commit()
    session.refresh(project)

    logger.info(f"Created website project: {project.client_name} ({project.id})")
    return project.model_dump()


# ─── Get by ID ──────────────────────────────────────────────────

@router.get("/{project_id}", response_model=dict)
def get_project(project_id: str, session: Session = Depends(get_session)):
    """Get full project detail."""
    project = get_project_or_404(project_id, session)
    return project.model_dump()


# ─── Update ─────────────────────────────────────────────────────

@router.patch("/{project_id}", response_model=dict)
def update_project(project_id: str, body: WebsiteProjectUpdate, session: Session = Depends(get_session)):
    """Update project fields (not stage — use /advance for that)."""
    project = get_project_or_404(project_id, session)
    ts = now_utc()

    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=422, detail="No fields to update")

    for field, value in update_data.items():
        setattr(project, field, value)

    project.updated_at = ts
    session.add(project)

    # Log update event
    event = WebsitePipelineEvent(
        project_id=project.id,
        event_type="project_updated",
        from_stage=project.stage,
        to_stage=project.stage,
        triggered_by="api",
        trigger_type=TriggerType.manual,
        timestamp=ts,
        notes=f"Fields updated: {', '.join(update_data.keys())}",
        event_metadata={"updated_fields": list(update_data.keys())},
    )
    session.add(event)
    session.commit()
    session.refresh(project)
    return project.model_dump()


# ─── Advance ────────────────────────────────────────────────────

@router.patch("/{project_id}/advance", response_model=dict)
def advance_project(
    project_id: str,
    body: WebsiteAdvanceRequest,
    session: Session = Depends(get_session),
):
    """Advance project to the next pipeline stage."""
    project = get_project_or_404(project_id, session)
    ts = now_utc()
    triggered_by = body.assigned_to or "orchestrator"

    prev_stage = project.stage
    nxt = next_stage(prev_stage)

    if nxt is None:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot advance from '{prev_stage}' — already at final stage or archived",
        )

    # Update stage history — close current entry
    history = list(project.stage_history or [])
    for entry in history:
        if entry.get("stage") == prev_stage and entry.get("exited_at") is None:
            entry["exited_at"] = ts.isoformat()
            break
    history.append({
        "stage": nxt,
        "entered_at": ts.isoformat(),
        "exited_at": None,
        "agent": triggered_by,
        "notes": body.notes,
    })

    project.stage = nxt
    project.stage_history = history
    project.updated_at = ts

    # Auto-assign based on stage definitions
    for sdef in WEBSITE_STAGE_DEFINITIONS:
        if sdef["stage"] == nxt and sdef.get("agent"):
            project.assigned_to = sdef["agent"]
            break

    session.add(project)

    # Log advance event
    event = WebsitePipelineEvent(
        project_id=project.id,
        event_type="stage_advanced",
        from_stage=prev_stage,
        to_stage=nxt,
        triggered_by=triggered_by,
        trigger_type=TriggerType.manual,
        timestamp=ts,
        notes=body.notes,
        event_metadata={"from": prev_stage, "to": nxt},
    )
    session.add(event)
    session.commit()
    session.refresh(project)

    logger.info(f"Website project '{project.client_name}' advanced: {prev_stage} → {nxt}")

    return {
        "message": f"Advanced to '{nxt}'",
        "project": project.model_dump(),
        "event_id": event.id,
    }


# ─── Delete (soft — archive) ────────────────────────────────────

@router.delete("/{project_id}", response_model=dict)
def archive_project(project_id: str, session: Session = Depends(get_session)):
    """Archive a website project (soft delete)."""
    project = get_project_or_404(project_id, session)
    ts = now_utc()
    prev_stage = project.stage

    if prev_stage == WebsiteStage.archived:
        raise HTTPException(status_code=422, detail="Project is already archived")

    # Update stage history
    history = list(project.stage_history or [])
    for entry in history:
        if entry.get("stage") == prev_stage and entry.get("exited_at") is None:
            entry["exited_at"] = ts.isoformat()
            break
    history.append({
        "stage": WebsiteStage.archived,
        "entered_at": ts.isoformat(),
        "exited_at": None,
        "agent": "orchestrator",
        "notes": "Archived",
    })

    project.stage = WebsiteStage.archived
    project.stage_history = history
    project.updated_at = ts
    session.add(project)

    event = WebsitePipelineEvent(
        project_id=project.id,
        event_type="project_archived",
        from_stage=prev_stage,
        to_stage=WebsiteStage.archived,
        triggered_by="orchestrator",
        trigger_type=TriggerType.manual,
        timestamp=ts,
        event_metadata={},
    )
    session.add(event)
    session.commit()
    session.refresh(project)

    return {"message": "Project archived", "id": project_id, "stage": project.stage}


# ─── History ────────────────────────────────────────────────────

@router.get("/{project_id}/history", response_model=dict)
def get_project_history(project_id: str, session: Session = Depends(get_session)):
    """Stage history + audit log for a website project."""
    project = get_project_or_404(project_id, session)
    events = session.exec(
        select(WebsitePipelineEvent)
        .where(WebsitePipelineEvent.project_id == project_id)
        .order_by(WebsitePipelineEvent.timestamp)
    ).all()

    return {
        "project_id": project_id,
        "client_name": project.client_name,
        "current_stage": project.stage,
        "stage_history": project.stage_history,
        "events": [e.model_dump() for e in events],
    }
