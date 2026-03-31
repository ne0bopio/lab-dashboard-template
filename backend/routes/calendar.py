"""
Calendar API routes — Lab Dashboard
Full CRUD + query by date range, category, agent.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import Session, select

from db import engine
from models import now_utc
from models_calendar import (
    CalendarEvent,
    CalendarEventCreate,
    CalendarEventUpdate,
    RecurrenceType,
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


# ─────────────────────────── Helpers ────────────────────────────

def _generate_recurrence_instances(
    event: CalendarEvent,
    range_start: datetime,
    range_end: datetime,
) -> list[dict]:
    """Generate virtual instances of a recurring event within a date range."""
    instances = []
    
    if event.recurrence == RecurrenceType.none:
        return instances
    
    delta_map = {
        RecurrenceType.daily: timedelta(days=1),
        RecurrenceType.weekly: timedelta(weeks=1),
        RecurrenceType.biweekly: timedelta(weeks=2),
        RecurrenceType.monthly: None,  # Handled separately
    }
    
    duration = (event.end - event.start) if event.end else None
    current = event.start
    max_instances = 200  # Safety cap
    count = 0
    
    while current <= range_end and count < max_instances:
        if event.recurrence_end and current > event.recurrence_end:
            break
        
        if current >= range_start and current != event.start:
            instance = event.model_dump()
            instance["id"] = f"{event.id}__recur__{current.isoformat()}"
            instance["start"] = current
            instance["end"] = (current + duration) if duration else None
            instance["parent_event_id"] = event.id
            instances.append(instance)
        
        # Advance
        if event.recurrence == RecurrenceType.monthly:
            # Same day next month
            month = current.month + 1
            year = current.year
            if month > 12:
                month = 1
                year += 1
            try:
                current = current.replace(year=year, month=month)
            except ValueError:
                # Handle 31st → 28/29/30
                import calendar
                last_day = calendar.monthrange(year, month)[1]
                current = current.replace(year=year, month=month, day=min(current.day, last_day))
        else:
            delta = delta_map.get(event.recurrence)
            if delta:
                current = current + delta
            else:
                break
        count += 1
    
    return instances


def _event_to_dict(event: CalendarEvent) -> dict:
    """Convert event to response dict."""
    d = event.model_dump()
    # Ensure datetime fields are ISO strings
    for key in ("start", "end", "recurrence_end", "completed_at", "created_at", "updated_at"):
        if d.get(key) and isinstance(d[key], datetime):
            d[key] = d[key].isoformat()
    return d


# ─────────────────────────── CRUD ────────────────────────────

@router.get("/upcoming/list")
async def upcoming_events(
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
):
    """Get upcoming events for the next N days."""
    now = now_utc()
    range_end = now + timedelta(days=days)
    
    with Session(engine) as session:
        stmt = (
            select(CalendarEvent)
            .where(CalendarEvent.start >= now)
            .where(CalendarEvent.start <= range_end)
            .where(CalendarEvent.completed == False)
            .order_by(CalendarEvent.start)
            .limit(limit)
        )
        events = session.exec(stmt).all()
        
        results = [_event_to_dict(ev) for ev in events]
        
        # Also expand recurrences
        recurring_stmt = (
            select(CalendarEvent)
            .where(CalendarEvent.recurrence != RecurrenceType.none)
            .where(CalendarEvent.completed == False)
        )
        recurring = session.exec(recurring_stmt).all()
        for ev in recurring:
            instances = _generate_recurrence_instances(ev, now, range_end)
            results.extend(instances)
        
        results.sort(key=lambda x: str(x.get("start", "")))
        return results[:limit]


@router.get("")
async def list_events(
    start: Optional[str] = Query(None, description="Range start (ISO8601)"),
    end: Optional[str] = Query(None, description="Range end (ISO8601)"),
    category: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None),
    idea_id: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    include_recurrences: bool = Query(True, description="Expand recurring events"),
):
    """List events with optional filters. Defaults to current month if no range given."""
    with Session(engine) as session:
        stmt = select(CalendarEvent)
        
        # Default range: current month
        now = now_utc()
        if start:
            range_start = datetime.fromisoformat(start.replace("Z", "+00:00")).replace(tzinfo=None)
        else:
            range_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if end:
            range_end = datetime.fromisoformat(end.replace("Z", "+00:00")).replace(tzinfo=None)
        else:
            # End of current month + 7 days buffer for next month peek
            if range_start.month == 12:
                range_end = range_start.replace(year=range_start.year + 1, month=1) + timedelta(days=7)
            else:
                range_end = range_start.replace(month=range_start.month + 1) + timedelta(days=7)
        
        # Only get events that could appear in range
        # (start <= range_end) — events that start before range ends
        stmt = stmt.where(CalendarEvent.start <= range_end)
        
        if category:
            stmt = stmt.where(CalendarEvent.category == category)
        if assigned_to:
            stmt = stmt.where(CalendarEvent.assigned_to == assigned_to)
        if created_by:
            stmt = stmt.where(CalendarEvent.created_by == created_by)
        if idea_id:
            stmt = stmt.where(CalendarEvent.idea_id == idea_id)
        if completed is not None:
            stmt = stmt.where(CalendarEvent.completed == completed)
        
        stmt = stmt.order_by(CalendarEvent.start)
        events = session.exec(stmt).all()
        
        results = []
        for ev in events:
            ev_dict = _event_to_dict(ev)
            
            # Filter by tag if specified
            if tag and tag not in (ev.tags or []):
                continue
            
            # Non-recurring: check if in range
            ev_start = ev.start
            ev_end = ev.end or ev.start
            
            if ev_start <= range_end and ev_end >= range_start:
                results.append(ev_dict)
            elif ev.recurrence == RecurrenceType.none and ev_start < range_start:
                continue  # Non-recurring event before range
            
            # Recurring: generate instances
            if include_recurrences and ev.recurrence != RecurrenceType.none:
                instances = _generate_recurrence_instances(ev, range_start, range_end)
                results.extend(instances)
        
        # Sort all results by start
        results.sort(key=lambda x: str(x.get("start", "")))
        
        return results


@router.post("", status_code=201)
async def create_event(payload: CalendarEventCreate):
    """Create a new calendar event."""
    with Session(engine) as session:
        event = CalendarEvent(**payload.model_dump())
        event.created_at = now_utc()
        event.updated_at = now_utc()
        session.add(event)
        session.commit()
        session.refresh(event)
        return _event_to_dict(event)


@router.get("/{event_id}")
async def get_event(event_id: str):
    """Get a single event by ID."""
    with Session(engine) as session:
        event = session.get(CalendarEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return _event_to_dict(event)


@router.patch("/{event_id}")
async def update_event(event_id: str, payload: CalendarEventUpdate):
    """Update an event."""
    with Session(engine) as session:
        event = session.get(CalendarEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        updates = payload.model_dump(exclude_unset=True)
        for key, val in updates.items():
            setattr(event, key, val)
        
        # Handle completion
        if "completed" in updates:
            if updates["completed"]:
                event.completed_at = now_utc()
            else:
                event.completed_at = None
        
        event.updated_at = now_utc()
        session.add(event)
        session.commit()
        session.refresh(event)
        return _event_to_dict(event)


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    """Delete an event."""
    with Session(engine) as session:
        event = session.get(CalendarEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        session.delete(event)
        session.commit()
        return {"deleted": event_id}


# ─────────────────────────── Convenience ────────────────────────────

@router.post("/{event_id}/complete")
async def complete_event(event_id: str):
    """Mark an event as completed."""
    with Session(engine) as session:
        event = session.get(CalendarEvent, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        event.completed = True
        event.completed_at = now_utc()
        event.updated_at = now_utc()
        session.add(event)
        session.commit()
        session.refresh(event)
        return _event_to_dict(event)
