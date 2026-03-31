"""
Telegram notifications — optional alerts on important lab events.
Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars to enable.
"""
from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")


async def notify_telegram(message: str) -> bool:
    """Send a Telegram message. Returns True on success."""
    if not BOT_TOKEN or not CHAT_ID:
        logger.debug("Telegram notifications not configured — skipping")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={
                "chat_id": CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
            })
            if resp.status_code == 200:
                logger.info(f"Telegram notification sent: {message[:60]}...")
                return True
            else:
                logger.warning(f"Telegram notification failed ({resp.status_code}): {resp.text[:200]}")
                return False
    except Exception as e:
        logger.error(f"Telegram notification error: {e}")
        return False


def notify_telegram_sync(message: str) -> bool:
    """Synchronous version for use in non-async contexts."""
    if not BOT_TOKEN or not CHAT_ID:
        logger.debug("Telegram notifications not configured — skipping")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, json={
                "chat_id": CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
            })
            if resp.status_code == 200:
                logger.info(f"Telegram notification sent: {message[:60]}...")
                return True
            else:
                logger.warning(f"Telegram notification failed ({resp.status_code}): {resp.text[:200]}")
                return False
    except Exception as e:
        logger.error(f"Telegram notification error: {e}")
        return False
