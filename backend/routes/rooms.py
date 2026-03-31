"""
Rooms API routes.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from db import get_session
from models import Idea, IdeaStage, PipelineEvent, Room, RoomStatus, RoomType, now_utc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rooms", tags=["rooms"])


class RoomCreate:
    pass


def compute_room_metrics(room: Room, session: Session) -> dict:
    """Compute live metrics for a room."""
    ideas = session.exec(select(Idea)).all()
    by_stage = {s.value: 0 for s in IdeaStage}
    for idea in ideas:
        stage = idea.stage if idea.stage in [s.value for s in IdeaStage] else "raw"
        by_stage[stage] = by_stage.get(stage, 0) + 1

    # Last activity from pipeline events
    last_event = session.exec(
        select(PipelineEvent).order_by(PipelineEvent.timestamp.desc()).limit(1)
    ).first()

    return {
        "ideas_total": len(ideas),
        "ideas_by_stage": by_stage,
        "last_activity": last_event.timestamp.isoformat() if last_event else None,
    }


def room_to_dict(room: Room, session: Session) -> dict:
    d = room.model_dump()
    d["metrics"] = compute_room_metrics(room, session)
    # Serialize datetime fields
    for field in ["created_at"]:
        val = d.get(field)
        if hasattr(val, "isoformat"):
            d[field] = val.isoformat()
    return d


@router.get("", response_model=List[dict])
def list_rooms(session: Session = Depends(get_session)):
    rooms = session.exec(select(Room)).all()
    return [room_to_dict(r, session) for r in rooms]


@router.post("", response_model=dict, status_code=201)
def create_room(body: dict, session: Session = Depends(get_session)):
    room = Room(
        name=body["name"],
        slug=body["slug"],
        type=body.get("type", RoomType.processing),
        status=body.get("status", RoomStatus.active),
        description=body.get("description"),
        icon=body.get("icon"),
        color=body.get("color"),
        config=body.get("config", {"auto_advance": False, "notify_on_stage_change": True, "agents": []}),
    )
    session.add(room)
    session.commit()
    session.refresh(room)
    return room_to_dict(room, session)


@router.get("/{slug}", response_model=dict)
def get_room(slug: str, session: Session = Depends(get_session)):
    room = session.exec(select(Room).where(Room.slug == slug)).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room '{slug}' not found")
    return room_to_dict(room, session)


@router.patch("/{slug}", response_model=dict)
def update_room(slug: str, body: dict, session: Session = Depends(get_session)):
    room = session.exec(select(Room).where(Room.slug == slug)).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room '{slug}' not found")
    for field, value in body.items():
        if hasattr(room, field):
            setattr(room, field, value)
    session.add(room)
    session.commit()
    session.refresh(room)
    return room_to_dict(room, session)


@router.get("/{slug}/activity", response_model=List[dict])
def get_room_activity(slug: str, session: Session = Depends(get_session)):
    # Return recent pipeline events for this room
    events = session.exec(
        select(PipelineEvent)
        .order_by(PipelineEvent.timestamp.desc())
        .limit(50)
    ).all()
    return [e.model_dump() for e in events]
