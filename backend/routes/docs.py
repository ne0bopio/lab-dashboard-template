"""
Docs API — shared lab knowledge store with folder support.
Shared knowledge store — any agent can read and write.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from db import get_session
from models import now_utc
from models_docs import Doc, DocCreate, DocUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/docs", tags=["docs"])


# ─────────────────────────── Folders ────────────────────────────

@router.get("/folders")
def list_folders(
    category: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    """List all folders with doc counts. Optionally filter by category."""
    query = select(Doc)
    if category:
        query = query.where(Doc.category == category)
    
    docs = session.exec(query).all()
    
    folders: dict = {}
    unfiled_count = 0
    
    for d in docs:
        if d.folder:
            if d.folder not in folders:
                folders[d.folder] = {
                    "name": d.folder,
                    "category": d.category,
                    "doc_count": 0,
                    "latest_update": None,
                    "pinned_count": 0,
                }
            folders[d.folder]["doc_count"] += 1
            if d.pinned:
                folders[d.folder]["pinned_count"] += 1
            updated = d.updated_at.isoformat() if d.updated_at else None
            if updated and (not folders[d.folder]["latest_update"] or updated > folders[d.folder]["latest_update"]):
                folders[d.folder]["latest_update"] = updated
        else:
            unfiled_count += 1
    
    result = sorted(folders.values(), key=lambda f: f["latest_update"] or "", reverse=True)
    
    return {
        "folders": result,
        "total_folders": len(result),
        "unfiled_docs": unfiled_count,
    }


@router.get("/folders/{folder_name}")
def get_folder(
    folder_name: str,
    session: Session = Depends(get_session),
):
    """Get all docs in a specific folder."""
    query = (
        select(Doc)
        .where(Doc.folder == folder_name)
        .order_by(Doc.pinned.desc(), Doc.updated_at.desc())
    )
    docs = session.exec(query).all()
    
    if not docs:
        raise HTTPException(status_code=404, detail=f"Folder '{folder_name}' not found or empty")
    
    return {
        "folder": folder_name,
        "doc_count": len(docs),
        "docs": [d.model_dump() for d in docs],
    }


@router.post("/folders/{folder_name}/move/{doc_id}")
def move_to_folder(
    folder_name: str,
    doc_id: str,
    session: Session = Depends(get_session),
):
    """Move a doc into a folder."""
    doc = session.get(Doc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doc {doc_id} not found")
    
    old_folder = doc.folder
    doc.folder = folder_name
    doc.updated_at = now_utc()
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    return {
        "moved": doc_id,
        "from": old_folder,
        "to": folder_name,
        "title": doc.title,
    }


@router.post("/folders/{folder_name}/unfile/{doc_id}")
def unfile_doc(
    folder_name: str,
    doc_id: str,
    session: Session = Depends(get_session),
):
    """Remove a doc from a folder (set folder to null)."""
    doc = session.get(Doc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doc {doc_id} not found")
    
    doc.folder = None
    doc.updated_at = now_utc()
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    return {"unfiled": doc_id, "title": doc.title}


# ─────────────────────────── Docs CRUD ────────────────────────────

@router.get("", response_model=List[dict])
def list_docs(
    category: Optional[str] = Query(None),
    folder: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    pinned: Optional[bool] = Query(None),
    unfiled: Optional[bool] = Query(None, description="Only docs with no folder"),
    session: Session = Depends(get_session),
):
    """List all docs. Filter by category, folder, tags, search text, pinned."""
    query = select(Doc).order_by(Doc.pinned.desc(), Doc.updated_at.desc())

    if category:
        query = query.where(Doc.category == category)
    if folder:
        query = query.where(Doc.folder == folder)
    if unfiled:
        query = query.where(Doc.folder == None)  # noqa: E711
    if pinned is not None:
        query = query.where(Doc.pinned == pinned)

    docs = session.exec(query).all()

    # Filter by tags
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",")]
        docs = [d for d in docs if any(t.lower() in [x.lower() for x in (d.tags or [])] for t in tag_list)]

    # Search in title + content
    if search:
        s = search.lower()
        docs = [d for d in docs if s in d.title.lower() or s in d.content.lower()]

    return [d.model_dump() for d in docs]


@router.post("", response_model=dict, status_code=201)
def create_doc(body: DocCreate, session: Session = Depends(get_session)):
    """Create a new doc."""
    ts = now_utc()
    doc = Doc(
        title=body.title,
        content=body.content,
        tags=body.tags,
        category=body.category,
        folder=body.folder,
        created_by=body.created_by,
        created_at=ts,
        updated_at=ts,
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    logger.info(f"Doc created: '{doc.title}' [{doc.category}] folder={doc.folder}")
    return doc.model_dump()


@router.get("/{doc_id}", response_model=dict)
def get_doc(doc_id: str, session: Session = Depends(get_session)):
    """Get a doc by ID."""
    doc = session.get(Doc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doc {doc_id} not found")
    return doc.model_dump()


@router.patch("/{doc_id}", response_model=dict)
def update_doc(doc_id: str, body: DocUpdate, session: Session = Depends(get_session)):
    """Update a doc."""
    doc = session.get(Doc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doc {doc_id} not found")

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(doc, field, value)
    doc.updated_at = now_utc()

    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc.model_dump()


@router.delete("/{doc_id}", response_model=dict)
def delete_doc(doc_id: str, session: Session = Depends(get_session)):
    """Delete a doc permanently."""
    doc = session.get(Doc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doc {doc_id} not found")

    session.delete(doc)
    session.commit()
    return {"message": "Doc deleted", "id": doc_id, "title": doc.title}
