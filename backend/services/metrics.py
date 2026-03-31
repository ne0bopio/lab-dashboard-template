"""
Agent metrics tracking — stores and retrieves per-agent time-series data.
"""
from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from models import AgentMetric, now_utc

logger = logging.getLogger(__name__)

KNOWN_SLUGS = ["anon", "atlas", "einstein", "euge", "frida", "kirby", "kronos", "midas"]


def seed_mock_metrics(session: Session) -> int:
    """Seed 30 days of mock metrics for all agents. Only seeds if table is empty."""
    existing = session.exec(select(AgentMetric).limit(1)).first()
    if existing:
        return 0

    count = 0
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Activity profiles (some agents more active than others)
    profiles = {
        "anon": {"tasks_range": (0, 2), "tokens_range": (500, 3000)},
        "atlas": {"tasks_range": (0, 3), "tokens_range": (200, 2000)},
        "einstein": {"tasks_range": (1, 5), "tokens_range": (2000, 8000)},
        "euge": {"tasks_range": (2, 8), "tokens_range": (3000, 12000)},
        "frida": {"tasks_range": (1, 6), "tokens_range": (2000, 10000)},
        "kirby": {"tasks_range": (3, 10), "tokens_range": (5000, 20000)},
        "kronos": {"tasks_range": (1, 4), "tokens_range": (1000, 5000)},
        "midas": {"tasks_range": (1, 5), "tokens_range": (2000, 8000)},
    }

    for slug in KNOWN_SLUGS:
        profile = profiles.get(slug, {"tasks_range": (0, 3), "tokens_range": (500, 5000)})
        for days_ago in range(30, -1, -1):
            date = now - timedelta(days=days_ago)
            date_str = date.strftime("%Y-%m-%d")

            # Weekdays more active
            is_weekday = date.weekday() < 5
            multiplier = 1.0 if is_weekday else 0.3

            tasks = int(random.randint(*profile["tasks_range"]) * multiplier)
            tokens = int(random.randint(*profile["tokens_range"]) * multiplier)
            errors = 1 if random.random() < 0.05 else 0  # 5% chance of error

            metric = AgentMetric(
                agent_slug=slug,
                metric_date=date_str,
                tasks=tasks,
                tokens=tokens,
                errors=errors,
                last_seen=date if tasks > 0 else None,
            )
            session.add(metric)
            count += 1

    session.commit()
    logger.info(f"Seeded {count} mock agent metrics")
    return count


def get_agent_metrics(session: Session, slug: str, period: str = "7d") -> dict:
    """Get time-series metrics for an agent."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if period == "24h":
        since = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    elif period == "7d":
        since = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    elif period == "30d":
        since = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    else:
        since = (now - timedelta(days=7)).strftime("%Y-%m-%d")

    metrics = session.exec(
        select(AgentMetric)
        .where(AgentMetric.agent_slug == slug)
        .where(AgentMetric.metric_date >= since)
        .order_by(AgentMetric.metric_date)
    ).all()

    activity = []
    for m in metrics:
        activity.append({
            "date": m.metric_date,
            "tasks": m.tasks,
            "tokens": m.tokens,
            "errors": m.errors,
        })

    return {
        "agent": slug,
        "period": period,
        "activity": activity,
    }
