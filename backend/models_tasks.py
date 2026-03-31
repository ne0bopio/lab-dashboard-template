"""
Task model for the Kanban board.
Statuses: backlog | todo | in_progress | done | archived
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str = ""
    status: str = Field(default="backlog")   # backlog | todo | in_progress | done | archived
    priority: str = Field(default="medium")  # low | medium | high | urgent
    assignee: Optional[str] = None           # agent name or "owner"
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    due_date: Optional[str] = None
    tags: str = "[]"        # JSON array serialised as string
    sort_order: int = Field(default=0)  # ordering within columns
