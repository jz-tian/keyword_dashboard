"""
Google Trends via pytrends with retry/backoff and region/window mapping.
"""
import time
import random
import logging
from typing import Any

from pytrends.request import TrendReq

logger = logging.getLogger(__name__)

GEO_MAP = {
    "worldwide": "",
    "germany": "DE",
    "us": "US",
}

WINDOW_MAP = {
    "24h": "now 1-d",
    "7d": "now 7-d",
    "30d": "today 1-m",
}


def _build_pytrends() -> TrendReq:
    return TrendReq(
        hl="en-US",
        tz=360,
        retries=3,
        backoff_factor=1.0,
        requests_args={"verify": True},
    )


def _retry(fn, max_attempts: int = 3):
    """Simple exponential backoff wrapper."""
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            wait = (2 ** attempt) + random.uniform(0, 1)
            logger.warning("pytrends error (attempt %d): %s — retrying in %.1fs", attempt + 1, e, wait)
            time.sleep(wait)


def fetch_trends(keyword: str, region: str, window: str) -> dict[str, Any]:
    geo = GEO_MAP.get(region, "")
    timeframe = WINDOW_MAP.get(window, "now 7-d")

    pytrends = _build_pytrends()

    def _build():
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo=geo)

    _retry(_build)

    # ── Time series ───────────────────────────────────────────
    trends: list[dict] = []
    try:
        df = pytrends.interest_over_time()
        if not df.empty and keyword in df.columns:
            for date, row in df.iterrows():
                trends.append(
                    {"date": str(date.date()), "value": max(0, int(row[keyword]))}
                )
    except Exception as e:
        logger.warning("interest_over_time failed: %s", e)

    # ── Interest by region ────────────────────────────────────
    interest_by_region: list[dict] = []
    try:
        df_region = pytrends.interest_by_region(
            resolution="COUNTRY", inc_low_vol=True, inc_geo_code=False
        )
        if not df_region.empty and keyword in df_region.columns:
            df_region = df_region.sort_values(keyword, ascending=False).head(20)
            for country, row in df_region.iterrows():
                v = int(row[keyword])
                if v > 0:
                    interest_by_region.append({"region": str(country), "value": v})
    except Exception as e:
        logger.warning("interest_by_region failed: %s", e)

    # ── Related queries ───────────────────────────────────────
    related_queries: list[dict] = []
    try:
        related = pytrends.related_queries()
        if keyword in related and related[keyword]:
            for q_type in ("top", "rising"):
                df_q = related[keyword].get(q_type)
                if df_q is not None and not df_q.empty:
                    for _, row in df_q.head(10).iterrows():
                        related_queries.append(
                            {
                                "query": str(row["query"]),
                                "value": int(row["value"]) if q_type == "top" else 0,
                                "type": q_type,
                            }
                        )
    except Exception as e:
        logger.warning("related_queries failed: %s", e)

    return {
        "trends": trends,
        "interestByRegion": interest_by_region,
        "relatedQueries": related_queries,
    }
