"""
Trend Intelligence Dashboard — FastAPI sidecar.

Runs on :8000 alongside Next.js on :3000.
Handles: /trends (pytrends) and /insights (sentiment + summary).
"""
import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Make sure the services package is importable when running from python/
sys.path.insert(0, str(Path(__file__).parent))

from routes import insights, trends  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="Trend Intelligence — Python API",
    description="Handles pytrends, sentiment analysis, and insights generation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trends.router)
app.include_router(insights.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "trend-intelligence-python"}
