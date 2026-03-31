"""
Events API routes — global event stream + SSE.
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from sse_starlette.sse import EventSourceResponse

from db import get_session
from models import PipelineEvent, SystemEvent, now_utc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])

# In-memory event queue for SSE broadcasting
_event_queue: asyncio.Queue = asyncio.Queue(maxsize=1000)


def broadcast_event(event_type: str, source: str, message: str, metadata: dict = None):
    """Push an event to the SSE broadcast queue."""
    event = {
        "event_type": event_type,
        "source": source,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {},
    }
    try:
        _event_queue.put_nowait(event)
    except asyncio.QueueFull:
        # Drop oldest event
        try:
            _event_queue.get_nowait()
            _event_queue.put_nowait(event)
        except Exception:
            pass


@router.get("")
def get_events(
    type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    session: Session = Depends(get_session),
):
    """Global event stream — last N events from pipeline + system."""
    # Get pipeline events
    pipeline = session.exec(
        select(PipelineEvent)
        .order_by(PipelineEvent.timestamp.desc())
        .limit(limit)
    ).all()

    # Get system events
    system = session.exec(
        select(SystemEvent)
        .order_by(SystemEvent.timestamp.desc())
        .limit(limit)
    ).all()

    # Merge and sort
    events = []
    for e in pipeline:
        d = e.model_dump()
        d["category"] = "pipeline"
        events.append(d)

    for e in system:
        d = e.model_dump()
        d["category"] = "system"
        events.append(d)

    # Sort by timestamp descending
    events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    # Filter by type
    if type:
        events = [e for e in events if e.get("event_type") == type]

    return events[:limit]


@router.get("/stream")
async def event_stream():
    """Server-Sent Events endpoint for real-time push."""

    async def generate():
        # Send a heartbeat immediately so client knows connection works
        yield {
            "event": "connected",
            "data": json.dumps({
                "message": "Connected to Lab event stream",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }

        while True:
            try:
                # Wait for an event, or send keepalive every 15 seconds
                try:
                    event = await asyncio.wait_for(_event_queue.get(), timeout=15.0)
                    yield {
                        "event": event.get("event_type", "update"),
                        "data": json.dumps(event),
                    }
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {
                        "event": "keepalive",
                        "data": json.dumps({"timestamp": datetime.now(timezone.utc).isoformat()}),
                    }
            except Exception as e:
                logger.error(f"SSE stream error: {e}")
                break

    return EventSourceResponse(generate())


def log_system_event(session: Session, event_type: str, source: str, message: str, metadata: dict = None):
    """Log a system event to DB and broadcast via SSE."""
    event = SystemEvent(
        event_type=event_type,
        source=source,
        message=message,
        timestamp=now_utc(),
        event_metadata=metadata or {},
    )
    session.add(event)
    session.commit()

    # Broadcast to SSE
    broadcast_event(event_type, source, message, metadata)
