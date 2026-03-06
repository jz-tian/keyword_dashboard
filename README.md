# Trend Intelligence Dashboard

A portfolio-grade real-time trend analysis dashboard that visualizes keyword interest
across Google Trends, news, and YouTube — using **only free, keyless data sources**.

<!-- SCREENSHOT PLACEHOLDER -->
> _Screenshots coming soon. Run `bash start.sh` to see it live._

---

## Features

| Panel | Description |
|---|---|
| **Executive Summary** | Deterministic 3-5 sentence narrative (no LLM required) |
| **KPI Cards** | Trend Score, Momentum %, Sentiment, Freshness |
| **Trend Line** | Google Trends time series (recharts) |
| **Related Queries** | Top + Rising searches |
| **Sentiment Chart** | Positive/Neutral/Negative pie chart from news corpus |
| **Word Cloud** | Custom SVG word cloud (no library, zero dep issues) |
| **News Feed** | Headlines from GDELT 2.1 + Google News RSS fallback |
| **YouTube** | Recent videos via public Invidious API |
| **Interest by Region** | Top 10 countries ranked by interest |

**Two Themes:**
- **Bloomberg** — dark, dense, terminal-like (JetBrains Mono)
- **Apple Intelligence** — light, airy, spacious (Inter) — persisted in `localStorage`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Charts | Recharts |
| Animations | Framer Motion |
| Word Cloud | Custom SVG renderer |
| API Routes | Next.js Route Handlers |
| Python Backend | FastAPI + Uvicorn |
| Trend Data | pytrends |
| Sentiment (EN) | vaderSentiment |
| Sentiment (DE) | Custom mini-lexicon |
| News | GDELT 2.1 API + Google News RSS |
| YouTube | Invidious public instances |
| Cache | File-based JSON (data/cache/) with in-memory fallback |
| Validation | Zod |
| Tests | Vitest (TypeScript) + pytest (Python) |

---

## How It Avoids Paid APIs

| Source | Method | Cost |
|---|---|---|
| Google Trends | `pytrends` — unofficial scraper | Free |
| News | GDELT 2.1 Doc API + Google News RSS | Free, no key |
| YouTube | Invidious open-source instances | Free, no key |
| Sentiment | VADER (English) + hand-crafted DE lexicon | Free |
| Summaries | Deterministic template from data | Free |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│             Browser (Next.js :3000)          │
│                                             │
│  /api/trends  ─────────────────────────────┐│
│  /api/insights ──────────────────────────┐ ││
│  /api/news  ──→  GDELT + GNews RSS       │ ││
│  /api/youtube ──→ Invidious API          │ ││
└──────────────────────────────────────────│─│┘
                                           │ │
              ┌────────────────────────────┘ │
              │                              │
   ┌──────────▼──────────────────────────────▼──┐
   │          FastAPI Python Sidecar (:8000)     │
   │                                             │
   │  /trends  ──→ pytrends (Google Trends)      │
   │  /insights ──→ vaderSentiment / DE lexicon  │
   │                term freq (word cloud)       │
   │                deterministic summary        │
   └─────────────────────────────────────────────┘

Cache: /data/cache/*.json  (TTL: 10min/30min/2h by window)
       → in-memory Map fallback if FS unavailable (Vercel)
```

---

## Local Dev Setup

### Prerequisites
- Node.js 18+
- Python 3.11+

### Option A — Single script (recommended)

```bash
git clone <repo-url>
cd keyword_dashboard
chmod +x start.sh
bash start.sh
```

Open http://localhost:3000

### Option B — Two terminals

**Terminal 1 (Python):**
```bash
cd python
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Next.js):**
```bash
npm install
npm run dev
```

### Tests

```bash
# TypeScript unit tests
npm test

# Python unit tests
cd python
pip install pytest
pytest ../tests/test_sentiment.py -v
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PYTHON_API_URL` | `http://localhost:8000` | FastAPI sidecar URL |

Set in `.env.local` (already pre-configured for local dev).

---

## Limitations

- **pytrends rate limits**: Google may throttle rapid requests. Caching mitigates this.
- **Invidious availability**: Public instances occasionally go offline; we try 5 in sequence.
- **German sentiment**: The hand-crafted lexicon (~150 words/polarity) has limited accuracy.
  For production, replace with a transformer model (e.g. HuggingFace `deepset/gbert-base`).
- **GDELT coverage**: Primarily English/major languages; regional coverage varies.
- **No auth**: The rate limiter is in-memory (resets on server restart). For production, use Redis.

---

## Future Work

- [ ] Map-based interest visualization (d3-geo)
- [ ] Persistent search history (localStorage or database)
- [ ] PDF export / share link
- [ ] RSS feed of trending topics
- [ ] Transformer-based German sentiment
- [ ] WebSocket live updates
- [ ] Docker Compose for one-command startup
- [ ] Vercel deployment guide
