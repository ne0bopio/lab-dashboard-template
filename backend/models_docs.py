"""
Shared Docs model — lab-wide knowledge store.
Shared knowledge store — any agent can read and write.
"""
from __future__ import annotations

from typing import List, Optional

from sqlmodel import JSON, Column, Field, SQLModel

from models import new_uuid, now_utc
from datetime import datetime


class Doc(SQLModel, table=True):
    __tablename__ = "docs"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    title: str = Field(index=True)
    content: str
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    category: str = Field(default="general", index=True)  # general, clients, projects, infrastructure, processes, logs
    folder: Optional[str] = Field(default=None, index=True)  # e.g. "beauty-ai", "financial-robot", "vanads"
    created_by: str = Field(default="owner")
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    pinned: bool = Field(default=False)


class DocCreate(SQLModel):
    title: str
    content: str
    tags: List[str] = []
    category: str = "general"
    folder: Optional[str] = None
    created_by: str = "owner"


class DocUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    folder: Optional[str] = None
    pinned: Optional[bool] = None
