# SportStream Workspace

## Overview

pnpm workspace monorepo using TypeScript. Live sports data streaming platform with ESPN integration.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

| Artifact | Preview Path | Description |
|---|---|---|
| `artifacts/sportstream` | `/` | Public-facing live sports scores website (React + Vite) |
| `artifacts/dashboard` | `/admin/` | Admin dashboard — monitoring, clients, config (React + Vite) |
| `artifacts/api-server` | `/api` | Express API server — REST + WebSocket |

## Public API v1

Base: `/api/v1`

| Endpoint | Description |
|---|---|
| `GET /api/v1` | Developer documentation page (HTML) |
| `GET /api/v1/status` | API health and operational stats |
| `GET /api/v1/sports` | List all supported sports and leagues |
| `GET /api/v1/sports/:sport/leagues` | Leagues for a sport |
| `GET /api/v1/sports/:sport/scoreboard[?league=]` | Live scores |
| `GET /api/v1/sports/:sport/matches/:id[?league=]` | Match detail |
| `GET /api/v1/sports/:sport/teams/:id[?league=]` | Team profile |
| `WS /api/ws` | WebSocket push for live score updates |

Rate limit: 100 requests per 15 minutes per IP. No API key required.

## Internal API Routes (used by admin dashboard + public site)

- `GET /api/sports/...` — same as v1 but no rate limiting, raw response format
- `GET /api/admin/stats` — detailed server stats
- `GET /api/admin/clients` — connected WebSocket clients
- `GET /api/admin/config` — poller config

## ESPN Integration

- Base: `https://site.api.espn.com/apis/site/v2/sports`
- Sports: `soccer`, `basketball`
- Soccer leagues: `eng.1`, `esp.1`, `ger.1`, `fra.1`, `ita.1`, `uefa.champions`
- Basketball leagues: `nba`, `wnba`
- 30-second polling loop (`lib/poller.ts`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
