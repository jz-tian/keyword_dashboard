"""
File-based JSON cache with in-memory fallback and TTL support.
"""
from __future__ import annotations
import json
import os
import time
from pathlib import Path
from typing import Any, Optional

# Resolve cache dir relative to project root (two levels up from python/)
_BASE = Path(__file__).resolve().parent.parent.parent
CACHE_DIR = _BASE / "data" / "cache"

# In-memory fallback
_memory: dict[str, dict] = {}

# TTL map by window
TTL_MAP = {
    "24h": 600,    # 10 minutes
    "7d": 1800,    # 30 minutes
    "30d": 7200,   # 2 hours
}


def _ensure_dir() -> bool:
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        # Test write access
        test = CACHE_DIR / ".write_test"
        test.write_text("ok")
        test.unlink()
        return True
    except Exception:
        return False


def _safe_key(key: str) -> str:
    import re
    return re.sub(r"[^a-zA-Z0-9_-]", "_", key)[:200]


def get(key: str) -> Optional[Any]:
    safe = _safe_key(key)
    now = time.time()

    # Memory check
    entry = _memory.get(safe)
    if entry and entry["expires_at"] > now:
        return entry["data"]

    # File check
    if _ensure_dir():
        fp = CACHE_DIR / f"{safe}.json"
        try:
            raw = fp.read_text(encoding="utf-8")
            entry = json.loads(raw)
            if entry["expires_at"] > now:
                _memory[safe] = entry
                return entry["data"]
            fp.unlink(missing_ok=True)
        except Exception:
            pass

    return None


def set(key: str, data: Any, ttl_seconds: int) -> None:
    safe = _safe_key(key)
    entry = {"data": data, "expires_at": time.time() + ttl_seconds}
    _memory[safe] = entry

    if _ensure_dir():
        fp = CACHE_DIR / f"{safe}.json"
        try:
            fp.write_text(json.dumps(entry, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass


def get_ttl(window: str) -> int:
    return TTL_MAP.get(window, 600)
