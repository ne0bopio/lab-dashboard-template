"""
Database connection and initialization for Lab Dashboard.
SQLite — auto-creates at the configured path (default: ./data/lab.db)
"""
import logging
import os
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

logger = logging.getLogger(__name__)

DB_PATH = Path(os.environ.get("LAB_DB_PATH", "./data/lab.db"))
DB_URL = f"sqlite:///{DB_PATH}"

# Ensure parent directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DB_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db():
    """Create all tables and seed default data."""
    from models import AgentMetric, Idea, PipelineEvent, Room, SQLModel, SystemEvent, WebsiteProject, WebsitePipelineEvent  # noqa: F401
    from models_docs import Doc  # noqa: F401
    from models_calendar import CalendarEvent  # noqa: F401
    from models_tasks import Task  # noqa: F401

    SQLModel.metadata.create_all(engine)
    logger.info(f"Database initialized at {DB_PATH}")

    # Seed default Idea Processing Room if not present
    with Session(engine) as session:
        from sqlmodel import select
        from models import Room, RoomType, RoomStatus, now_utc

        existing = session.exec(select(Room).where(Room.slug == "idea-room")).first()
        if not existing:
            room = Room(
                name="Idea Processing Room",
                slug="idea-room",
                type=RoomType.processing,
                status=RoomStatus.active,
                description="Transforms raw ideas into executable business plans.",
                icon="🧪",
                color="#00FFB3",
                created_at=now_utc(),
                config={
                    "auto_advance": False,
                    "notify_on_stage_change": True,
                    "agents": ["agent-1", "agent-2", "agent-3"]
                }
            )
            session.add(room)
            session.commit()
            logger.info("Seeded default Idea Processing Room")

        # Seed Website Pipeline room if not present
        existing_wp = session.exec(select(Room).where(Room.slug == "website-pipeline")).first()
        if not existing_wp:
            wp_room = Room(
                name="Website Demo Pipeline",
                slug="website-pipeline",
                type=RoomType.processing,
                status=RoomStatus.active,
                description="Fast website demos/prototypes for potential clients.",
                icon="🌐",
                color="#3B82F6",
                created_at=now_utc(),
                config={
                    "auto_advance": False,
                    "notify_on_stage_change": True,
                    "agents": ["agent-1", "agent-2", "agent-3"],
                }
            )
            session.add(wp_room)
            session.commit()
            logger.info("Seeded Website Demo Pipeline room")


def get_session():
    """FastAPI dependency for DB session."""
    with Session(engine) as session:
        yield session
