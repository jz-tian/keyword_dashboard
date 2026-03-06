"""
POST /insights
Body: InsightsRequest
Returns sentiment, word cloud terms, executive summary, computed metrics.
"""
import hashlib
import json
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from services import cache, sentiment, wordcloud, summary

router = APIRouter()
logger = logging.getLogger(__name__)


class InsightsRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100)
    region: str = Field("worldwide")
    window: str = Field("7d")
    corpus: list[str] = Field(default_factory=list)
    trends: list[dict] = Field(default_factory=list)
    news: list[dict] = Field(default_factory=list)
    youtube: list[dict] = Field(default_factory=list)


@router.post("/insights")
async def get_insights(req: InsightsRequest):
    # Build a stable cache key from the request
    corpus_hash = hashlib.md5(
        json.dumps(sorted(req.corpus[:50]), ensure_ascii=False).encode()
    ).hexdigest()[:8]
    cache_key = f"insights_{req.keyword.lower()}_{req.region}_{req.window}_{corpus_hash}"
    ttl = cache.get_ttl(req.window)

    cached = cache.get(cache_key)
    if cached is not None:
        return JSONResponse(content=cached)

    lang = "de" if req.region == "germany" else "en"

    # Sentiment analysis
    sent_counts = sentiment.analyze_corpus(req.corpus, lang=lang)

    # Word cloud terms
    cloud_terms = wordcloud.extract_terms(req.corpus, lang=lang, max_terms=60)

    # Executive summary
    exec_summary = summary.build_summary(
        keyword=req.keyword,
        trends=req.trends,
        related_queries=[],  # related queries come from the trends endpoint
        sentiment=sent_counts,
        news=req.news,
        youtube=req.youtube,
    )

    # Numeric metrics
    metrics = summary.compute_all_metrics(
        trends=req.trends,
        news=req.news,
        youtube=req.youtube,
    )

    result = {
        "sentiment": sent_counts,
        "wordCloudTerms": cloud_terms,
        "executiveSummary": exec_summary,
        **metrics,
    }

    cache.set(cache_key, result, ttl)
    return JSONResponse(content=result)
