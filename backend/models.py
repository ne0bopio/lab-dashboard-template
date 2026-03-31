"""
SQLModel data models — Lab Dashboard & Idea Processing Room
Follows DATA_CONTRACT.md exactly.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional

from pydantic import field_validator
from sqlmodel import JSON, Column, Field, SQLModel


# ─────────────────────────── Enums ────────────────────────────

class IdeaStage(str, Enum):
    # Idea Room stages
    raw = "raw"
    research = "research"
    validation = "validation"
    business_plan = "business_plan"
    approved = "approved"          # Idea passes → generates blueprint
    # Development Room stages
    design = "design"              # Frida: brand, UI, visual identity
    development = "development"    # Kirby: backend, frontend, integration
    testing = "testing"            # QA, review, final polish
    launched = "launched"          # Live in production
    archived = "archived"


class IdeaPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IdeaSource(str, Enum):
    tesla = "tesla"
    manual = "manual"
    agent = "agent"


class AgentStatus(str, Enum):
    idle = "idle"
    running = "running"
    error = "error"
    offline = "offline"
    paused = "paused"


class ToolType(str, Enum):
    ideas = "ideas"
    finance = "finance"
    scheduling = "scheduling"
    smart_home = "smart-home"
    communication = "communication"
    media = "media"
    security = "security"
    utility = "utility"


class ToolStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    error = "error"


class RoomType(str, Enum):
    processing = "processing"
    monitoring = "monitoring"
    communication = "communication"
    finance = "finance"
    devops = "devops"


class RoomStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"


class EventType(str, Enum):
    stage_advanced = "stage_advanced"
    stage_blocked = "stage_blocked"
    idea_created = "idea_created"
    idea_archived = "idea_archived"
    agent_assigned = "agent_assigned"
    comment_added = "comment_added"
    score_updated = "score_updated"


class SystemEventType(str, Enum):
    agent_status_change = "agent_status_change"
    tool_used = "tool_used"
    idea_advanced = "idea_advanced"
    system_info = "system_info"


class TriggerType(str, Enum):
    manual = "manual"
    automated = "automated"
    webhook = "webhook"


# ─────────────────────────── Helpers ────────────────────────────

def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_uuid() -> str:
    return str(uuid.uuid4())


# ─────────────────────────── Idea ────────────────────────────

class Idea(SQLModel, table=True):
    __tablename__ = "ideas"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = None
    status: str = Field(default="raw")
    stage: str = Field(default=IdeaStage.raw, index=True)
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    reviewed_at: Optional[datetime] = None
    source: str = Field(default=IdeaSource.manual)
    assigned_to: Optional[str] = None
    priority: str = Field(default=IdeaPriority.medium)

    # Nested blocks stored as JSON
    research: dict = Field(default_factory=lambda: {
        "market_size": None,
        "competitors": [],
        "target_audience": None,
        "pain_points": [],
        "notes": None,
        "completed_at": None,
        "agent": None
    }, sa_column=Column(JSON))

    validation: dict = Field(default_factory=lambda: {
        "score": None,
        "verdict": None,
        "reasons": [],
        "risks": [],
        "go_no_go": None,
        "completed_at": None
    }, sa_column=Column(JSON))

    business_plan: dict = Field(default_factory=lambda: {
        "revenue_model": None,
        "mvp_description": None,
        "estimated_effort_days": None,
        "estimated_revenue_monthly": None,
        "channels": [],
        "milestones": [],
        "completed_at": None
    }, sa_column=Column(JSON))

    execution: dict = Field(default_factory=lambda: {
        "tasks": [],
        "github_repo": None,
        "live_url": None,
        "status": None,
        "started_at": None,
        "launched_at": None
    }, sa_column=Column(JSON))

    blueprint: dict = Field(default_factory=lambda: {
        "generated_at": None,
        "product_type": None,       # "website", "app", "service", "product"
        "brand_requirements": None,  # Brief for Frida
        "tech_requirements": None,   # Brief for Kirby
        "design_status": None,       # Frida's progress
        "dev_status": None,          # Kirby's progress
        "design_agent": None,
        "dev_agent": None,
        "assets": [],                # Design files, repos, URLs
        "notes": None
    }, sa_column=Column(JSON))

    stage_history: List[dict] = Field(default_factory=list, sa_column=Column(JSON))

    # Tesla original ID for dedup
    tesla_id: Optional[int] = Field(default=None, index=True)
    title_hash: Optional[str] = Field(default=None, index=True)


# ─────────────────────────── Room ────────────────────────────

class Room(SQLModel, table=True):
    __tablename__ = "rooms"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    type: str = Field(default=RoomType.processing)
    status: str = Field(default=RoomStatus.active)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    config: dict = Field(default_factory=lambda: {
        "auto_advance": False,
        "notify_on_stage_change": True,
        "agents": []
    }, sa_column=Column(JSON))


# ─────────────────────────── Pipeline Event ────────────────────────────

class PipelineEvent(SQLModel, table=True):
    __tablename__ = "pipeline_events"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    idea_id: Optional[str] = Field(default=None, index=True)
    event_type: str = Field(index=True)
    from_stage: Optional[str] = None
    to_stage: Optional[str] = None
    triggered_by: Optional[str] = None
    trigger_type: str = Field(default=TriggerType.manual)
    timestamp: datetime = Field(default_factory=now_utc)
    notes: Optional[str] = None
    event_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))


# ─────────────────────────── System Event ────────────────────────────

class SystemEvent(SQLModel, table=True):
    __tablename__ = "system_events"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    event_type: str = Field(index=True)
    source: Optional[str] = None
    message: str
    timestamp: datetime = Field(default_factory=now_utc)
    event_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))


# ─────────────────────────── Agent Metrics ────────────────────────────

class AgentMetric(SQLModel, table=True):
    __tablename__ = "agent_metrics"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    agent_slug: str = Field(index=True)
    metric_date: str = Field(index=True)  # YYYY-MM-DD
    tasks: int = Field(default=0)
    tokens: int = Field(default=0)
    errors: int = Field(default=0)
    last_seen: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)


# ─────────────────────────── Pydantic Request/Response Schemas ────────────────────────────

class IdeaCreate(SQLModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    source: str = IdeaSource.manual
    priority: str = IdeaPriority.medium


class IdeaUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    reviewed_at: Optional[datetime] = None


class IdeaAdvanceRequest(SQLModel):
    notes: Optional[str] = None
    assigned_to: Optional[str] = None


class IdeaBlockRequest(SQLModel):
    reason: str
    triggered_by: str = "orchestrator"


# ─────────────────────────── Agent (in-memory, not stored in DB) ────────────────────────────

class AgentInfo(SQLModel):
    id: str
    name: str
    slug: str
    emoji: Optional[str] = None
    role: Optional[str] = None
    model: Optional[str] = None
    status: str = AgentStatus.offline
    parent: Optional[str] = None
    tier: int = 2
    created_at: Optional[str] = None
    health: dict = {}
    metrics: dict = {}
    current_task: Optional[str] = None
    workspace: Optional[str] = None
    capabilities: List[str] = []


# ─────────────────────────── Website Pipeline Enums ────────────────────────────

class WebsiteStage(str, Enum):
    intake = "intake"
    discovery = "discovery"
    design = "design"
    develop = "develop"
    review = "review"
    deliver = "deliver"
    archived = "archived"


WEBSITE_STAGE_ORDER = [
    WebsiteStage.intake,
    WebsiteStage.discovery,
    WebsiteStage.design,
    WebsiteStage.develop,
    WebsiteStage.review,
    WebsiteStage.deliver,
]

WEBSITE_STAGE_DEFINITIONS = [
    {"stage": "intake",    "label": "Intake",    "description": "Client info gathered — name, needs, competitors, budget, timeline", "agent": None},
    {"stage": "discovery", "label": "Discovery", "description": "Industry research, competitor analysis, positioning, site structure", "agent": "euge"},
    {"stage": "design",    "label": "Design",    "description": "Wireframes, color palette, typography, mockups", "agent": "frida"},
    {"stage": "develop",   "label": "Develop",   "description": "Build the demo site — responsive, clean, fast", "agent": "kirby"},
    {"stage": "review",    "label": "Review",    "description": "Code audit + visual QA — iterate until approved", "agent": "anonymous"},
    {"stage": "deliver",   "label": "Deliver",   "description": "Send demo to client, walk them through it", "agent": None},
    {"stage": "archived",  "label": "Archived",  "description": "Project completed or shelved", "agent": None},
]


# ─────────────────────────── Website Project ────────────────────────────

class WebsiteProject(SQLModel, table=True):
    __tablename__ = "website_projects"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    client_name: str = Field(index=True)
    business_type: Optional[str] = None
    industry: Optional[str] = None
    needs: Optional[str] = None
    competitors: Optional[str] = None
    brand_assets: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    stage: str = Field(default=WebsiteStage.intake, index=True)
    discovery_doc_id: Optional[str] = None
    design_doc_id: Optional[str] = None
    preview_url: Optional[str] = None
    code_review_status: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    notes: Optional[str] = None
    stage_history: List[dict] = Field(default_factory=list, sa_column=Column(JSON))


# ─────────────────────────── Website Pipeline Event ────────────────────────────

class WebsitePipelineEvent(SQLModel, table=True):
    __tablename__ = "website_pipeline_events"

    id: str = Field(default_factory=new_uuid, primary_key=True)
    project_id: str = Field(index=True)
    event_type: str = Field(index=True)
    from_stage: Optional[str] = None
    to_stage: Optional[str] = None
    triggered_by: Optional[str] = None
    trigger_type: str = Field(default=TriggerType.manual)
    timestamp: datetime = Field(default_factory=now_utc)
    notes: Optional[str] = None
    event_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))


# ─────────────────────────── Website Pydantic Schemas ────────────────────────────

class WebsiteProjectCreate(SQLModel):
    client_name: str
    business_type: Optional[str] = None
    industry: Optional[str] = None
    needs: Optional[str] = None
    competitors: Optional[str] = None
    brand_assets: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class WebsiteProjectUpdate(SQLModel):
    client_name: Optional[str] = None
    business_type: Optional[str] = None
    industry: Optional[str] = None
    needs: Optional[str] = None
    competitors: Optional[str] = None
    brand_assets: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    discovery_doc_id: Optional[str] = None
    design_doc_id: Optional[str] = None
    preview_url: Optional[str] = None
    code_review_status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class WebsiteAdvanceRequest(SQLModel):
    notes: Optional[str] = None
    assigned_to: Optional[str] = None


class ToolInfo(SQLModel):
    id: str
    name: str
    slug: str
    emoji: Optional[str] = None
    description: Optional[str] = None
    type: str = "utility"
    status: str = "active"
    version: str = "1.0.0"
    owner_agent: Optional[str] = None
    created_at: Optional[str] = None
    data_path: Optional[str] = None
    usage: dict = {}
    config: dict = {}
