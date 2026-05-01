# SportStream

A full-stack live sports data platform built on ESPN's unofficial APIs. Real-time scores, WebSocket push updates, an admin dashboard, a public-facing scores site, and interactive API documentation — all in one monorepo.

---

## What's included

| Artifact | Path | Description |
|---|---|---|
| **API Server** | `/api` | Express + TypeScript REST & WebSocket server |
| **SportStream** | `/` | Public-facing live scores site (Betika-style layout) |
| **Admin Dashboard** | `/admin` | Internal monitoring & control panel |
| **API Docs** | `/docs` | Interactive documentation with live analysis tools |

---

## Features

### Live Scores Site (`/`)
- Betika-style layout — left sidebar listing every league, horizontal match rows
- All football leagues: Premier League, La Liga, Bundesliga, Ligue 1, Serie A, Champions League
- Basketball: NBA and WNBA
- Per-second ticking match clocks (soccer counts up, basketball counts down)
- Pulsing live badges with period labels (1H / 2H / Q1–Q4)
- Countdown timers for scheduled matches ("in 1h 47m")
- Time-remaining progress bar for live matches
- Filter by sport or league from the sidebar — works on mobile with pill nav
- Scores updated every 30 seconds, domain auto-detected (works on any host)

### API Server (`/api`)
- `GET /api/v1/sports/:sport/scoreboard` — live scoreboard for soccer or basketball
- `GET /api/v1/sports/:sport/matches/:id` — single match detail
- `GET /api/v1/status` — server health, ESPN poll status, WebSocket connection count
- `WS /api/ws` — WebSocket push; broadcasts `score_update` events whenever a score changes
- ESPN poller runs every 30 seconds and fans out diffs to all connected clients
- Full CORS support — callable directly from any browser

### Admin Dashboard (`/admin`)
- Live server health monitoring
- WebSocket connection count
- ESPN poller status and last-fetched timestamp
- Manual poll trigger

### API Documentation (`/docs`)
- Full endpoint reference with request/response schemas
- "Try It" panels — fire real requests from the browser
- Live WebSocket monitor — see push events arrive in real time
- Live scoreboard embedded in the docs
- All code examples show your actual domain (auto-detected, no placeholders)

---

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| API server | Express, TypeScript, ws (WebSocket), node-cron |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Data fetching | TanStack Query (React Query) |
| Routing | Wouter |
| Routing proxy | Replit shared reverse proxy (path-based) |
| Data source | ESPN unofficial public APIs |

---

## Project structure

```
sportstream/
├── artifacts/
│   ├── api-server/        # Express REST + WebSocket server
│   ├── sportstream/       # Public live scores site
│   ├── dashboard/         # Admin dashboard
│   └── api-docs/          # Interactive API documentation
├── lib/                   # Shared TypeScript libraries
├── scripts/               # Utility scripts
├── pnpm-workspace.yaml
└── README.md
```

---

## Getting started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Install dependencies

```bash
pnpm install
```

### Run all services

Each artifact runs as a separate dev server. Start them individually:

```bash
# API server (port from $PORT env var)
pnpm --filter @workspace/api-server run dev

# Public scores site
pnpm --filter @workspace/sportstream run dev

# Admin dashboard
pnpm --filter @workspace/dashboard run dev

# API docs
pnpm --filter @workspace/api-docs run dev
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes (auto-set by Replit) | Port the service binds to |
| `BASE_PATH` | Yes (auto-set by Replit) | URL base path for the Vite app |
| `SESSION_SECRET` | Yes | Secret for session signing |

---

## API reference

### Base URL

```
https://{your-domain}/api/v1
```

### Endpoints

#### `GET /api/v1/sports/:sport/scoreboard`

Returns all matches for a sport. `:sport` is `soccer` or `basketball`.

Optional query param: `?league=eng.1` to filter by league.

**Soccer league IDs:** `eng.1` (EPL), `esp.1` (La Liga), `ger.1` (Bundesliga), `fra.1` (Ligue 1), `ita.1` (Serie A), `uefa.champions` (Champions League)

**Basketball league IDs:** `nba`, `wnba`

```json
{
  "ok": true,
  "data": {
    "sport": "soccer",
    "league": "all",
    "matchCount": 14,
    "matches": [
      {
        "id": "740942",
        "sport": "soccer",
        "league": "eng.1",
        "leagueName": "English Premier League",
        "status": "in-progress",
        "statusDetail": "74'",
        "clock": "74'",
        "period": 2,
        "homeTeam": { "id": "...", "name": "Arsenal", "abbreviation": "ARS", "logo": "...", "score": 2 },
        "awayTeam": { "id": "...", "name": "Chelsea", "abbreviation": "CHE", "logo": "...", "score": 1 },
        "venue": "Emirates Stadium",
        "startTime": "2024-05-01T19:00:00Z"
      }
    ]
  }
}
```

#### `GET /api/v1/status`

Server health and ESPN poller status.

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "uptime": 3600,
    "wsConnections": 4,
    "lastPollAt": "2024-05-01T19:07:30.000Z",
    "nextPollIn": 23
  }
}
```

#### `WS /api/ws`

Connect to receive live score push updates:

```javascript
const ws = new WebSocket(`wss://${location.host}/api/ws`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'score_update') {
    const { matchId, homeScore, awayScore, clock, sport } = msg.payload;
    console.log(`[${sport}] Match ${matchId}: ${homeScore}–${awayScore} (${clock})`);
  }
};
```

**Message types:**

| Type | Description |
|---|---|
| `connected` | Sent once on connection with server info |
| `score_update` | Broadcast when any score changes |
| `pong` | Response to `ping` keepalive |

---

## Data source

All match data comes from ESPN's unofficial public API:

```
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
```

This is publicly accessible with no API key required. The server polls it every 30 seconds and fans out diffs via WebSocket.

---

## License

MIT
