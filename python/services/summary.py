"""
Deterministic executive summary builder — no LLM required.

Derives narrative from:
  - Trend direction (slope of time series)
  - Dominant sentiment + confidence
  - Top 3 related queries
  - Top news headline
  - Top YouTube item
"""
import math
from typing import Any


def _compute_slope(values: list[float]) -> float:
    n = len(values)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    den = sum((i - x_mean) ** 2 for i in range(n))
    return num / den if den != 0 else 0.0


def _trend_direction(values: list[float]) -> str:
    if len(values) < 2:
        return "stable"
    slope = _compute_slope(values)
    # Normalise by mean to get relative slope
    mean = sum(values) / len(values)
    if mean == 0:
        return "stable"
    relative = slope / mean
    if relative > 0.01:
        return "rising"
    if relative < -0.01:
        return "declining"
    return "stable"


def _sentiment_phrase(sentiment: dict[str, int]) -> tuple[str, int]:
    total = sum(sentiment.values())
    if total == 0:
        return "neutral", 0
    dominant = max(sentiment, key=sentiment.get)  # type: ignore[arg-type]
    pct = round(sentiment[dominant] / total * 100)
    return dominant, pct


def _compute_metrics(
    values: list[float],
) -> tuple[int, float, float]:
    """Returns (trend_score, momentum_pct, volatility)."""
    if not values:
        return 0, 0.0, 0.0

    recent = values[-5:]
    avg_recent = sum(recent) / len(recent)

    # Momentum: % change first half vs second half
    mid = len(values) // 2
    if mid > 0:
        first = sum(values[:mid]) / mid
        second = sum(values[mid:]) / (len(values) - mid)
        momentum = ((second - first) / first * 100) if first != 0 else 0.0
    else:
        momentum = 0.0

    # Volatility
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    volatility = math.sqrt(variance)

    # Trend score: blend of recent avg and bounded momentum boost
    trend_score = min(100, max(0, round(avg_recent + min(20, max(-20, momentum * 0.2)))))

    return trend_score, round(momentum, 1), round(volatility, 1)


def build_summary(
    keyword: str,
    trends: list[dict],
    related_queries: list[dict],
    sentiment: dict[str, int],
    news: list[dict],
    youtube: list[dict],
) -> str:
    """Build a 3-5 sentence executive summary without any LLM calls."""
    values = [float(t.get("value", 0)) for t in trends]
    direction = _trend_direction(values)
    dom_sentiment, dom_pct = _sentiment_phrase(sentiment)

    top_queries = [q["query"] for q in related_queries if q.get("type") == "top"][:3]
    top_headline = next((n for n in news if n.get("title")), None)
    top_yt = next((y for y in youtube if y.get("title")), None)

    # Build sentence by sentence
    sentences: list[str] = []

    # Sentence 1: trend direction
    direction_map = {
        "rising": f'Interest in "{keyword}" is currently rising, indicating growing public attention.',
        "declining": f'Interest in "{keyword}" has been declining over the selected period.',
        "stable": f'Interest in "{keyword}" remains broadly stable over the selected time window.',
    }
    sentences.append(direction_map[direction])

    # Sentence 2: sentiment
    sentiment_phrases = {
        "positive": f"Media coverage is predominantly positive ({dom_pct}% of sources).",
        "negative": f"Media sentiment leans negative ({dom_pct}% of sources), suggesting cautious or critical coverage.",
        "neutral": f"Coverage maintains a broadly neutral tone ({dom_pct}% neutral), reflecting factual reporting.",
    }
    sentences.append(sentiment_phrases.get(dom_sentiment, "Sentiment data is mixed."))

    # Sentence 3: related queries
    if top_queries:
        q_list = ", ".join(f'"{q}"' for q in top_queries)
        sentences.append(f"Top related searches include {q_list}.")

    # Sentence 4: top headline
    if top_headline:
        source = top_headline.get("source", "a news source")
        title = top_headline.get("title", "")
        if len(title) > 80:
            title = title[:77] + "..."
        sentences.append(f'A notable recent headline: "{title}" ({source}).')

    # Sentence 5: YouTube
    if top_yt:
        channel = top_yt.get("channel", "a channel")
        yt_title = top_yt.get("title", "")
        if len(yt_title) > 70:
            yt_title = yt_title[:67] + "..."
        sentences.append(
            f'On YouTube, a trending video by {channel}: "{yt_title}".'
        )

    return " ".join(sentences)


def compute_all_metrics(
    trends: list[dict],
    news: list[dict],
    youtube: list[dict],
) -> dict[str, Any]:
    """Compute all numeric KPI metrics."""
    values = [float(t.get("value", 0)) for t in trends]
    trend_score, momentum, volatility = _compute_metrics(values)

    # Source diversity
    sources: set[str] = set()
    for n in news:
        badge = n.get("sourceBadge") or n.get("source", "")
        if badge:
            sources.add(badge)
    if youtube:
        sources.add("YouTube")

    # Freshness
    import time as _time
    from datetime import datetime, timezone
    now = _time.time()
    cutoff = now - 86400  # 24h in seconds
    all_items = list(news) + list(youtube)
    fresh = 0
    for item in all_items:
        ts = item.get("publishedAt", "")
        if not ts:
            continue
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if dt.timestamp() > cutoff:
                fresh += 1
        except Exception:
            pass
    freshness_score = round(fresh / len(all_items) * 100) if all_items else 0

    return {
        "trendScore": trend_score,
        "momentum": momentum,
        "volatility": volatility,
        "sourceDiversityIndex": len(sources),
        "freshnessScore": freshness_score,
    }
