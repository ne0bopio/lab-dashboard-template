"""
Kanban Tasks API
GET    /api/v1/tasks           — list tasks (filterable)
GET    /api/v1/tasks/board     — grouped by status column
POST   /api/v1/tasks           — create task
PATCH  /api/v1/tasks/{id}      — update task fields
DELETE /api/v1/tasks/{id}      — hard delete
POST   /api/v1/tasks/{id}/move — move to column
POST   /api/v1/tasks/reorder   — reorder within column
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from db import get_session
from models_tasks import Task

router = APIRouter(tags=["tasks"])

VALID_STATUSES = {"backlog", "todo", "in_progress", "done", "archived"}
BOARD_STATUSES = ["backlog", "todo", "in_progress", "done"]  # excludes archived


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Pydantic request models ────────────────────────────────────────────────────
class CreateTaskBody(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "backlog"
    priority: Optional[str] = "medium"
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    tags: Optional[List[str]] = []


class PatchTaskBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    tags: Optional[List[str]] = None
    sort_order: Optional[int] = None


class MoveTaskBody(BaseModel):
    status: str
    sort_order: Optional[int] = None


class ReorderBody(BaseModel):
    task_ids: List[str]


# ── Helpers ────────────────────────────────────────────────────────────────────
import json


def task_to_dict(task: Task) -> Dict[str, Any]:
    """Serialize task; decode tags JSON string → list."""
    d = task.model_dump()
    try:
        d["tags"] = json.loads(task.tags)
    except Exception:
        d["tags"] = []
    return d


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("/tasks")
async def list_tasks(
    status: Optional[str] = Query(default=None),
    assignee: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
):
    stmt = select(Task)

    # Default: exclude archived
    if status:
        stmt = stmt.where(Task.status == status)
    else:
        stmt = stmt.where(Task.status != "archived")

    if assignee:
        stmt = stmt.where(Task.assignee == assignee)
    if priority:
        stmt = stmt.where(Task.priority == priority)

    tasks = session.exec(stmt).all()
    # Sort by sort_order then created_at
    tasks = sorted(tasks, key=lambda t: (t.sort_order, t.created_at))
    return [task_to_dict(t) for t in tasks]


@router.get("/tasks/board")
async def get_board(session: Session = Depends(get_session)):
    """Return tasks grouped by status column (excludes archived)."""
    stmt = select(Task).where(Task.status != "archived")
    tasks = session.exec(stmt).all()

    board: Dict[str, List[Dict[str, Any]]] = {s: [] for s in BOARD_STATUSES}
    for task in sorted(tasks, key=lambda t: (t.sort_order, t.created_at)):
        if task.status in board:
            board[task.status].append(task_to_dict(task))

    return board


@router.post("/tasks")
async def create_task(body: CreateTaskBody, session: Session = Depends(get_session)):
    if body.status and body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")

    task = Task(
        title=body.title,
        description=body.description or "",
        status=body.status or "backlog",
        priority=body.priority or "medium",
        assignee=body.assignee,
        due_date=body.due_date,
        tags=json.dumps(body.tags or []),
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task_to_dict(task)


@router.patch("/tasks/{task_id}")
async def update_task(
    task_id: str,
    body: PatchTaskBody,
    session: Session = Depends(get_session),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
        task.status = body.status
    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.priority is not None:
        task.priority = body.priority
    if body.assignee is not None:
        task.assignee = body.assignee
    if body.due_date is not None:
        task.due_date = body.due_date
    if body.tags is not None:
        task.tags = json.dumps(body.tags)
    if body.sort_order is not None:
        task.sort_order = body.sort_order

    task.updated_at = _now()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task_to_dict(task)


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()
    return {"deleted": task_id}


@router.post("/tasks/{task_id}/move")
async def move_task(
    task_id: str,
    body: MoveTaskBody,
    session: Session = Depends(get_session),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")

    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = body.status
    if body.sort_order is not None:
        task.sort_order = body.sort_order
    task.updated_at = _now()

    session.add(task)
    session.commit()
    session.refresh(task)
    return task_to_dict(task)


@router.post("/tasks/reorder")
async def reorder_tasks(body: ReorderBody, session: Session = Depends(get_session)):
    """Update sort_order for each task based on array position."""
    updated = 0
    for idx, task_id in enumerate(body.task_ids):
        task = session.get(Task, task_id)
        if task:
            task.sort_order = idx
            task.updated_at = _now()
            session.add(task)
            updated += 1

    session.commit()
    return {"updated": updated}
