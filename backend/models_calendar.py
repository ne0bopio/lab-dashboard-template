"""
Calendar models — Lab Dashboard
Events, reminders, recurring patterns.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlmodel import JSON, Column, Field, SQLModel

from models import new_uuid, now_utc


# ─────────────────────────── Enums ────────────────────────────

class EventCategory(str, Enum):
    meeting = "meeting"
    deadline = "deadline"
    reminder = "reminder"
    launch = "launch"
    client = "client"
    personal = "personal"
    milestone = "milestone"


class RecurrenceType(str, Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"


# ─────────────────────────── Calendar Event ────────────────────────────

class CalendarEvent(SQLModel, table=True):
    __tablename__ = "calendar_events"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = None
    
    # Timing
    start: datetime = Field(index=True)            # Event start (UTC)
    end: Optional[datetime] = None                  # Event end (UTC), null = point event
    all_day: bool = Field(default=False)            # All-day event flag
    
    # Categorization
    category: str = Field(default=EventCategory.reminder, index=True)
    color: Optional[str] = None                     # Hex color override (e.g., "#F5A623")
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # Ownership
    created_by: Optional[str] = None                # Agent or "owner"
    assigned_to: Optional[str] = None               # Agent slug or "owner"
    
    # Linked entities
    idea_id: Optional[str] = Field(default=None, index=True)    # Link to an idea
    doc_id: Optional[str] = None                                 # Link to a dashboard doc
    
    # Recurrence
    recurrence: str = Field(default=RecurrenceType.none)
    recurrence_end: Optional[datetime] = None       # When recurrence stops (null = forever)
    parent_event_id: Optional[str] = None           # For generated recurrence instances
    
    # Status
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None
    
    # Meta
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


# ─────────────────────────── Request/Response Schemas ────────────────────────────

class CalendarEventCreate(SQLModel):
    title: str
    description: Optional[str] = None
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    category: str = EventCategory.reminder
    color: Optional[str] = None
    tags: List[str] = []
    created_by: Optional[str] = None
    assigned_to: Optional[str] = None
    idea_id: Optional[str] = None
    doc_id: Optional[str] = None
    recurrence: str = RecurrenceType.none
    recurrence_end: Optional[datetime] = None


class CalendarEventUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    all_day: Optional[bool] = None
    category: Optional[str] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[str] = None
    idea_id: Optional[str] = None
    doc_id: Optional[str] = None
    recurrence: Optional[str] = None
    recurrence_end: Optional[datetime] = None
    completed: Optional[bool] = None
