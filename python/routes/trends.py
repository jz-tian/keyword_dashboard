"""
GET /trends?keyword=&region=&window=
Proxies to Google Trends via pytrends, with caching.
"""
import logging

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from services import cache, google_trends

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/trends")
async def get_trends(
    keyword: str = Query(..., min_length=1, max_length=100),
    region: str = Query("worldwide", pattern="^(worldwide|germany|us)$"),
    window: str = Query("7d", pattern="^(24h|7d|30d)$"),
):
    cache_key = f"trends_{keyword.lower()}_{region}_{window}"
    ttl = cache.get_ttl(window)

    # Cache hit
    cached = cache.get(cache_key)
    if cached is not None:
        return JSONResponse(content=cached)

    # Fetch from pytrends
    try:
        data = google_trends.fetch_trends(keyword, region, window)
    except Exception as e:
        logger.error("Google Trends fetch failed: %s", e)
        # Return empty structure rather than 500 — frontend handles gracefully
        data = {"trends": [], "interestByRegion": [], "relatedQueries": []}

    cache.set(cache_key, data, ttl)
    return JSONResponse(content=data)
