"""
API Key authentication middleware.
Set your key via LAB_API_KEY env var, or change the default below.
"""
import os

from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader

API_KEY = os.environ.get("LAB_API_KEY", "change-me-please")
API_KEY_NAME = "X-API-Key"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


async def require_api_key(key: str = Security(api_key_header)) -> str:
    if key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key. Use X-API-Key header.",
        )
    return key
