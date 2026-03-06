# Trend Intelligence Dashboard — CLAUDE.md

## What This Project Is

Full-stack keyword trend dashboard. User enters a keyword + region + time window and gets:
trend chart, KPI cards, sentiment analysis, word cloud, related queries, news articles, YouTube videos, and an executive summary.

Live: https://trendintel.vercel.app
GitHub: https://github.com/jz-tian/keyword_dashboard
Owner: Jiazheng Tian

---

## Architecture

**Pure Next.js 14 — no Python sidecar, no paid APIs.**

```
Browser → Next.js :3000
  ├── /api/trends    → lib/googleTrends.ts   (scrapes Google Trends directly)
  ├── /api/news      → GDELT 2.1 + GNews RSS (TypeScript, fast-xml-parser)
  ├── /api/youtube   → ytsr npm package      (YouTube scraping)
  └── /api/insights  → lib/sentiment.ts + lib/nlp.ts (pure TS, no ML APIs)
```

All NLP, sentiment, and summary logic is in TypeScript — no Python, no external AI calls.

---

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main page — state, layout, data fetching orchestration |
| `app/api/trends/route.ts` | Proxy to Google Trends via `lib/googleTrends.ts` |
| `app/api/news/route.ts` | GDELT + GNews RSS fetching |
| `app/api/youtube/route.ts` | YouTube scraping via ytsr |
| `app/api/insights/route.ts` | Sentiment + word cloud + summary + KPI metrics |
| `lib/googleTrends.ts` | Google Trends unofficial API client (cookies → widgets → data) |
| `lib/sentiment.ts` | AFINN-based EN lexicon + DE bag-of-words lexicon |
| `lib/nlp.ts` | Term extraction, executive summary builder, metric computations |
| `lib/types.ts` | All shared TypeScript interfaces |
| `lib/api.ts` | Client-side fetch helpers (`fetchDashboardData`) |
| `lib/cache.ts` | File-based cache with in-memory fallback |
| `lib/rateLimit.ts` | Token bucket rate limiter (10 req/min per IP) |
| `components/dashboard/` | All dashboard UI components |
| `hooks/useTheme.ts` | Bloomberg/Apple theme toggle with localStorage persistence |
| `app/globals.css` | CSS custom properties for both themes |
| `vercel.json` | maxDuration: 30s for /api/trends (Google Trends is slow) |

---

## Theme System

Two themes toggled via a button in the header. Class applied to `<html>`:

- **Bloomberg** (`.bloomberg`): dark, monospace font, amber accent (`#F59E0B`), dense layout
- **Apple** (`.apple`): light, Inter font, blue accent (`#007AFF`), airy layout

CSS variables defined in `app/globals.css`:
- `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`
- `--color-text`, `--color-text-muted`, `--color-text-faint`
- `--color-accent`, `--color-accent-dim`, `--color-positive`, `--color-negative`
- `--font-sans`, `--radius-card`, `--spacing-card`

**Always use CSS variables, never hardcode colors.** Exception: Recharts components need inline hex values — use the theme-aware color constants defined per-component.

---

## Layout

- Mobile: `flex-col` stack — search panel full-width on top, content below
- Desktop (`lg:`): side-by-side — fixed sidebar + scrollable main content
- Bloomberg sidebar: `w-56`, Apple sidebar: `w-72`
- KPI cards: `grid-cols-2` on mobile, `grid-cols-4` on desktop
- Recharts charts: always wrapped in `<ResponsiveContainer width="100%" height="100%">`

---

## Data Flow

```
handleSearch(keyword, region, window)
  → Promise.all([
      GET /api/trends?keyword=&region=&window=
      GET /api/news?keyword=&region=&window=
      GET /api/youtube?keyword=&window=
    ])
  → POST /api/insights  { keyword, region, window, corpus: [...titles] }
  → setData(DashboardData)
```

The corpus for insights is assembled from news titles + YouTube titles client-side in `lib/api.ts`.

---

## Google Trends API (lib/googleTrends.ts)

Unofficial — no API key needed. Flow:
1. `getCookies()` — GET google.com/trends to get NID cookie
2. `getWidgets(keyword, geo, timeframe)` — POST `/trends/api/explore`
3. Parallel:
   - `fetchTimeSeries()` → `/trends/api/widgetdata/multiline`
   - `fetchRegion()` → `/trends/api/widgetdata/comparedgeo`
   - `fetchRelated()` → `/trends/api/widgetdata/relatedsearches`
4. All responses prefixed with `)]}',\n` — strip before JSON.parse

Vercel function timeout set to 30s because Google Trends can be slow.

---

## Sentiment (lib/sentiment.ts)

- English: AFINN-inspired lexicon (~350 words, scores -5 to +5). Compound score >= 0.05 = positive, <= -0.05 = negative.
- German: `DE_POSITIVE` / `DE_NEGATIVE` word sets. Bag-of-words classification.
- Language detection: `region === "germany"` → `"de"`, else `"en"`
- Returns `{ positive: number, neutral: number, negative: number }` (item counts)

---

## Word Cloud (components/dashboard/WordCloud.tsx)

Custom SVG renderer — no library. Key details:
- Archimedean spiral placement: `theta += 0.18`, `r = 2.2 * theta`
- AABB collision detection with 5px padding
- Largest word placed first (center), smaller words spiral outward
- Font size range: 13–48px proportional to term frequency
- HEIGHT = 300px canvas
- Bloomberg colors: amber tones; Apple colors: blue tones

---

## Recharts Tooltip Fix

All Recharts `<Tooltip>` components need explicit color properties or text is invisible on dark backgrounds:

```tsx
contentStyle={{
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",          // REQUIRED — without this: black text on dark bg
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
}}
labelStyle={{ color: "var(--color-text-muted)" }}
itemStyle={{ color: "var(--color-text)" }}
```

---

## Running Locally

```bash
npm run dev        # starts on :3000
```

No Python needed. No `.env` required for basic usage.

Cache files written to `/data/cache/` (gitignored). Falls back to in-memory if unavailable (Vercel).

---

## Deployment

Deployed on Vercel (zero-config). Auto-deploys from `master` branch on GitHub.

Custom domain: `trendintel.vercel.app`

Known Vercel constraints:
- File system cache (`/data/cache/`) does not persist across function invocations — in-memory fallback activates automatically
- ytsr requires `experimental.serverComponentsExternalPackages: ["ytsr"]` in `next.config.mjs` (Next.js 14 syntax — NOT `serverExternalPackages` which is Next.js 15+)

---

## Coding Conventions

- All components are in `components/dashboard/` (dashboard panels) or `components/ui/` (shadcn primitives)
- `"use client"` only where needed (interactivity, hooks, framer-motion)
- Framer Motion `motion.div` with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` on all major panels
- TypeScript strict — no `any`, use types from `lib/types.ts`
- `cn()` from `lib/utils.ts` for conditional class merging
- Do not add comments unless logic is non-obvious
- Do not add error handling for impossible cases

---

## Do Not

- Do not re-introduce a Python sidecar — everything is TypeScript
- Do not use paid APIs (OpenAI, Google Maps, etc.)
- Do not hardcode colors — use CSS variables
- Do not use `serverExternalPackages` (Next.js 15+ key) — use `experimental.serverComponentsExternalPackages`
- Do not run `npm run build` locally to test — it leaves a stale `.next` that breaks `npm run dev`. Use `rm -rf .next` before switching back to dev.
