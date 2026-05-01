import { Router, type Request, type Response } from "express";
import {
  SPORTS_CONFIG,
  getAllScoreboards,
  getScoreboard,
  getMatch,
  getTeam,
  type Sport,
} from "../lib/espn";
import { publicRateLimit } from "../lib/rate-limit";
import { getStats } from "../lib/stats";

const router = Router();

const SUPPORTED_SPORTS = Object.keys(SPORTS_CONFIG) as Sport[];

function isSport(s: string): s is Sport {
  return SUPPORTED_SPORTS.includes(s as Sport);
}

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), ...meta } });
}

function err(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// Apply rate limit to all v1 routes
router.use(publicRateLimit);

// ─── Docs ────────────────────────────────────────────────────────────────────

router.get("/", (_req, res) => {
  res.type("html").send(DOCS_HTML);
});

// ─── Status ───────────────────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  const stats = getStats();
  ok(res, {
    status: "operational",
    uptime: stats.uptime,
    uptimeMs: stats.uptimeMs,
    startedAt: stats.startedAt,
    requests: stats.requests,
    websocket: stats.websocket,
    polling: stats.polling,
    supportedSports: SUPPORTED_SPORTS,
    version: "1.0.0",
  });
});

// ─── Sports list ──────────────────────────────────────────────────────────────

router.get("/sports", (_req: Request, res: Response) => {
  const sports = SUPPORTED_SPORTS.map((sport) => ({
    id: sport,
    label: SPORTS_CONFIG[sport].label,
    leagues: Object.entries(SPORTS_CONFIG[sport].leagues).map(([id, name]) => ({ id, name })),
  }));
  ok(res, { sports });
});

// ─── Leagues ──────────────────────────────────────────────────────────────────

router.get("/sports/:sport/leagues", (req: Request, res: Response) => {
  const { sport } = req.params;
  if (!sport || !isSport(sport)) {
    err(res, 404, "SPORT_NOT_FOUND", `Sport "${sport}" not supported. Supported: ${SUPPORTED_SPORTS.join(", ")}`);
    return;
  }
  const leagues = Object.entries(SPORTS_CONFIG[sport].leagues).map(([id, name]) => ({ id, name, sport }));
  ok(res, { sport, leagues });
});

// ─── Scoreboard ───────────────────────────────────────────────────────────────

router.get("/sports/:sport/scoreboard", async (req: Request, res: Response) => {
  const { sport } = req.params;
  const { league } = req.query as { league?: string };

  if (!sport || !isSport(sport)) {
    err(res, 404, "SPORT_NOT_FOUND", `Sport "${sport}" not supported. Supported: ${SUPPORTED_SPORTS.join(", ")}`);
    return;
  }

  let matches;
  if (league) {
    const validLeagues = Object.keys(SPORTS_CONFIG[sport].leagues);
    if (!validLeagues.includes(league)) {
      err(res, 400, "LEAGUE_NOT_FOUND", `League "${league}" not found. Available: ${validLeagues.join(", ")}`);
      return;
    }
    matches = await getScoreboard(sport, league);
  } else {
    matches = await getAllScoreboards(sport);
  }

  ok(res, {
    sport,
    league: league ?? "all",
    matchCount: matches.length,
    matches,
  }, {
    note: "Data refreshes every 30 seconds from ESPN.",
    websocket: "wss://{host}/api/ws — subscribe for live push updates",
  });
});

// ─── Match detail ─────────────────────────────────────────────────────────────

router.get("/sports/:sport/matches/:matchId", async (req: Request, res: Response) => {
  const { sport, matchId } = req.params;
  const { league } = req.query as { league?: string };

  if (!sport || !isSport(sport)) {
    err(res, 404, "SPORT_NOT_FOUND", `Sport "${sport}" not supported.`);
    return;
  }
  if (!matchId) {
    err(res, 400, "MISSING_MATCH_ID", "matchId is required.");
    return;
  }

  const leagueId = league ?? Object.keys(SPORTS_CONFIG[sport].leagues)[0] ?? "";
  const match = await getMatch(sport, leagueId, matchId);

  if (!match) {
    err(res, 404, "MATCH_NOT_FOUND", `Match "${matchId}" not found in ${sport}/${leagueId}.`);
    return;
  }

  ok(res, { match });
});

// ─── Team detail ──────────────────────────────────────────────────────────────

router.get("/sports/:sport/teams/:teamId", async (req: Request, res: Response) => {
  const { sport, teamId } = req.params;
  const { league } = req.query as { league?: string };

  if (!sport || !isSport(sport)) {
    err(res, 404, "SPORT_NOT_FOUND", `Sport "${sport}" not supported.`);
    return;
  }
  if (!teamId) {
    err(res, 400, "MISSING_TEAM_ID", "teamId is required.");
    return;
  }

  const leagueId = league ?? Object.keys(SPORTS_CONFIG[sport].leagues)[0] ?? "";
  const team = await getTeam(sport, leagueId, teamId);

  if (!team) {
    err(res, 404, "TEAM_NOT_FOUND", `Team "${teamId}" not found in ${sport}/${leagueId}.`);
    return;
  }

  ok(res, { team });
});

// ─── 404 fallthrough ─────────────────────────────────────────────────────────

router.use((_req: Request, res: Response) => {
  err(res, 404, "NOT_FOUND", "Endpoint not found. See /api/v1 for documentation.");
});

// ─── Docs HTML ────────────────────────────────────────────────────────────────

const DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SportStream API v1 — Documentation</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0d1117;
      --bg-card: #161b22;
      --bg-code: #0d1117;
      --border: #30363d;
      --text: #e6edf3;
      --muted: #8b949e;
      --primary: #f59e0b;
      --green: #3fb950;
      --blue: #58a6ff;
      --purple: #d2a8ff;
      --red: #f85149;
    }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; }
    a { color: var(--primary); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    header { border-bottom: 1px solid var(--border); padding-bottom: 2rem; margin-bottom: 2.5rem; }
    .logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .logo-dot { width: 10px; height: 10px; background: var(--primary); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .logo h1 { font-size: 1.6rem; font-weight: 800; }
    .logo h1 span { color: var(--primary); }
    .badge { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 100px; background: var(--primary); color: #000; margin-left: 0.5rem; vertical-align: middle; }
    .subtitle { color: var(--muted); font-size: 1rem; margin-bottom: 1rem; }
    .pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pill { font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 100px; border: 1px solid var(--border); color: var(--muted); }
    .pill.green { border-color: var(--green); color: var(--green); }
    .pill.blue { border-color: var(--blue); color: var(--blue); }
    h2 { font-size: 1.2rem; font-weight: 700; margin: 2.5rem 0 1rem; color: var(--text); }
    h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.25rem; }
    .endpoint-group { margin-bottom: 1rem; }
    .endpoint { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 0.75rem; overflow: hidden; }
    .endpoint-header { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; cursor: pointer; }
    .method { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.2rem 0.5rem; border-radius: 4px; min-width: 44px; text-align: center; flex-shrink: 0; margin-top: 1px; }
    .method.GET { background: #1f4428; color: var(--green); }
    .endpoint-path { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .endpoint-desc { color: var(--muted); font-size: 0.85rem; margin-top: 0.2rem; }
    .endpoint-body { padding: 0 1.25rem 1.25rem; border-top: 1px solid var(--border); }
    .params { margin-top: 1rem; }
    .param-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 0.5rem; }
    .param-row { display: flex; gap: 0.75rem; align-items: baseline; margin-bottom: 0.35rem; font-size: 0.85rem; }
    .param-name { font-family: monospace; color: var(--purple); min-width: 140px; }
    .param-type { color: var(--blue); font-size: 0.75rem; min-width: 60px; }
    .param-req { font-size: 0.68rem; padding: 0.1rem 0.4rem; border-radius: 3px; }
    .param-req.required { background: rgba(248,81,73,0.15); color: var(--red); }
    .param-req.optional { background: rgba(48,54,61,0.6); color: var(--muted); }
    code { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.85em; background: var(--bg-code); border: 1px solid var(--border); border-radius: 4px; padding: 0.1em 0.4em; }
    pre { background: var(--bg-code); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; overflow-x: auto; font-size: 0.82rem; line-height: 1.6; margin-top: 0.75rem; }
    pre code { background: none; border: none; padding: 0; font-size: inherit; }
    .try-btn { display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.75rem; padding: 0.4rem 0.9rem; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: var(--primary); border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .try-btn:hover { background: rgba(245,158,11,0.2); }
    .ws-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 1.5rem; }
    .ws-badge { display: inline-block; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(88,166,255,0.15); color: var(--blue); border: 1px solid rgba(88,166,255,0.3); margin-right: 0.5rem; }
    .resp-section { margin-top: 1rem; }
    .resp-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
    th { text-align: left; padding: 0.4rem 0.75rem; border-bottom: 1px solid var(--border); color: var(--muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(48,54,61,0.5); vertical-align: top; }
    td:first-child { font-family: monospace; color: var(--purple); }
    td:nth-child(2) { color: var(--blue); font-size: 0.8rem; }
    .status-live { color: var(--red); } .status-final { color: var(--muted); } .status-sched { color: var(--blue); }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.82rem; text-align: center; }
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">
      <div class="logo-dot"></div>
      <h1>Sport<span>Stream</span> API <span class="badge">v1</span></h1>
    </div>
    <p class="subtitle">Real-time live sports scores powered by ESPN data. No API key required.</p>
    <div class="pills">
      <span class="pill green">Free &amp; Open</span>
      <span class="pill green">No Auth Required</span>
      <span class="pill blue">REST + WebSocket</span>
      <span class="pill">100 req / 15 min</span>
      <span class="pill">Refreshes every 30s</span>
    </div>
  </header>

  <h2>Base URL</h2>
  <pre><code>https://{host}/api/v1</code></pre>

  <h2>Response Format</h2>
  <p style="color:var(--muted); font-size:0.9rem; margin-bottom:0.75rem;">All responses share a consistent envelope:</p>
  <pre><code>// Success
{
  "ok": true,
  "data": { ... },
  "meta": { "timestamp": "2024-01-01T00:00:00.000Z" }
}

// Error
{
  "ok": false,
  "error": { "code": "SPORT_NOT_FOUND", "message": "..." }
}</code></pre>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <div>
        <div class="endpoint-path">/api/v1/status</div>
        <div class="endpoint-desc">API health and operational stats</div>
      </div>
    </div>
    <div class="endpoint-body">
      <div class="resp-label">Example Response</div>
      <pre><code>{
  "ok": true,
  "data": {
    "status": "operational",
    "uptime": "2h 15m 30s",
    "uptimeMs": 8130000,
    "startedAt": "2024-05-01T14:00:00.000Z",
    "requests": { "total": 1042, "errors": 8, "successRate": 99 },
    "websocket": { "connectedClients": 3 },
    "polling": { "count": 270, "errors": 0, "lastPollAt": "...", "nextPollAt": "..." },
    "supportedSports": ["soccer", "basketball"],
    "version": "1.0.0"
  }
}</code></pre>
      <a class="try-btn" href="/api/v1/status" target="_blank">&#9654; Try it</a>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <div>
        <div class="endpoint-path">/api/v1/sports</div>
        <div class="endpoint-desc">List all supported sports and leagues</div>
      </div>
    </div>
    <div class="endpoint-body">
      <div class="resp-label">Example Response</div>
      <pre><code>{
  "ok": true,
  "data": {
    "sports": [
      {
        "id": "soccer",
        "label": "Soccer / Football",
        "leagues": [
          { "id": "eng.1", "name": "English Premier League" },
          { "id": "esp.1", "name": "La Liga" },
          { "id": "ger.1", "name": "Bundesliga" },
          { "id": "fra.1", "name": "Ligue 1" },
          { "id": "ita.1", "name": "Serie A" },
          { "id": "uefa.champions", "name": "UEFA Champions League" }
        ]
      },
      {
        "id": "basketball",
        "label": "Basketball",
        "leagues": [
          { "id": "nba", "name": "NBA" },
          { "id": "wnba", "name": "WNBA" }
        ]
      }
    ]
  }
}</code></pre>
      <a class="try-btn" href="/api/v1/sports" target="_blank">&#9654; Try it</a>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <div>
        <div class="endpoint-path">/api/v1/sports/:sport/scoreboard</div>
        <div class="endpoint-desc">Live and upcoming match scores for a sport. Optionally filter by league.</div>
      </div>
    </div>
    <div class="endpoint-body">
      <div class="params">
        <div class="param-label">Path Params</div>
        <div class="param-row">
          <span class="param-name">sport</span>
          <span class="param-type">string</span>
          <span class="param-req required">required</span>
          <span style="color:var(--muted)"><code>soccer</code> or <code>basketball</code></span>
        </div>
        <div class="param-label" style="margin-top:0.75rem">Query Params</div>
        <div class="param-row">
          <span class="param-name">league</span>
          <span class="param-type">string</span>
          <span class="param-req optional">optional</span>
          <span style="color:var(--muted)">e.g. <code>eng.1</code>, <code>nba</code>. Omit for all leagues.</span>
        </div>
      </div>
      <div class="resp-section">
        <div class="resp-label">Match Object</div>
        <table>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
          <tr><td>id</td><td>string</td><td>ESPN event ID</td></tr>
          <tr><td>sport</td><td>string</td><td><code>soccer</code> or <code>basketball</code></td></tr>
          <tr><td>league</td><td>string</td><td>League ID e.g. <code>eng.1</code></td></tr>
          <tr><td>leagueName</td><td>string</td><td>Human-readable league name</td></tr>
          <tr><td>status</td><td>string</td><td><span class="status-live">in-progress</span> | <span class="status-final">final</span> | <span class="status-sched">scheduled</span></td></tr>
          <tr><td>statusDetail</td><td>string</td><td>e.g. <code>67'</code>, <code>Final</code>, <code>HT</code></td></tr>
          <tr><td>clock</td><td>string?</td><td>Match clock when live</td></tr>
          <tr><td>period</td><td>number?</td><td>Half (soccer) or quarter (basketball)</td></tr>
          <tr><td>homeTeam</td><td>Team</td><td>See Team object below</td></tr>
          <tr><td>awayTeam</td><td>Team</td><td>See Team object below</td></tr>
          <tr><td>venue</td><td>string?</td><td>Stadium name</td></tr>
          <tr><td>startTime</td><td>ISO 8601</td><td>Kick-off / tip-off time</td></tr>
        </table>
        <div class="resp-label" style="margin-top:1rem">Team Object</div>
        <table>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
          <tr><td>id</td><td>string</td><td>ESPN team ID</td></tr>
          <tr><td>name</td><td>string</td><td>Full team name</td></tr>
          <tr><td>abbreviation</td><td>string</td><td>Short code e.g. <code>LAL</code></td></tr>
          <tr><td>logo</td><td>string?</td><td>Team logo URL (ESPN CDN)</td></tr>
          <tr><td>score</td><td>string?</td><td>Current score, null if not started</td></tr>
        </table>
      </div>
      <a class="try-btn" href="/api/v1/sports/soccer/scoreboard" target="_blank">&#9654; Try soccer</a>
      <a class="try-btn" href="/api/v1/sports/basketball/scoreboard" target="_blank" style="margin-left:0.5rem">&#9654; Try basketball</a>
      <a class="try-btn" href="/api/v1/sports/soccer/scoreboard?league=eng.1" target="_blank" style="margin-left:0.5rem">&#9654; Try Premier League</a>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <div>
        <div class="endpoint-path">/api/v1/sports/:sport/matches/:matchId</div>
        <div class="endpoint-desc">Detailed info for a specific match by ID</div>
      </div>
    </div>
    <div class="endpoint-body">
      <div class="params">
        <div class="param-label">Path Params</div>
        <div class="param-row">
          <span class="param-name">sport</span>
          <span class="param-type">string</span>
          <span class="param-req required">required</span>
        </div>
        <div class="param-row">
          <span class="param-name">matchId</span>
          <span class="param-type">string</span>
          <span class="param-req required">required</span>
          <span style="color:var(--muted)">ESPN event ID from scoreboard response</span>
        </div>
        <div class="param-label" style="margin-top:0.75rem">Query Params</div>
        <div class="param-row">
          <span class="param-name">league</span>
          <span class="param-type">string</span>
          <span class="param-req optional">optional</span>
          <span style="color:var(--muted)">Required when sport has multiple leagues</span>
        </div>
      </div>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <div>
        <div class="endpoint-path">/api/v1/sports/:sport/teams/:teamId</div>
        <div class="endpoint-desc">Team profile including logo, colors, and league</div>
      </div>
    </div>
    <div class="endpoint-body">
      <div class="params">
        <div class="param-label">Path Params</div>
        <div class="param-row">
          <span class="param-name">sport</span>
          <span class="param-type">string</span>
          <span class="param-req required">required</span>
        </div>
        <div class="param-row">
          <span class="param-name">teamId</span>
          <span class="param-type">string</span>
          <span class="param-req required">required</span>
          <span style="color:var(--muted)">ESPN team ID from match data</span>
        </div>
        <div class="param-label" style="margin-top:0.75rem">Query Params</div>
        <div class="param-row">
          <span class="param-name">league</span>
          <span class="param-type">string</span>
          <span class="param-req optional">optional</span>
        </div>
      </div>
    </div>
  </div>

  <div class="endpoint">
    <div class="endpoint-header">
      <span class="method GET">GET</span>
      <div>
        <div class="endpoint-path">/api/v1/sports/:sport/leagues</div>
        <div class="endpoint-desc">List all leagues for a given sport</div>
      </div>
    </div>
    <div class="endpoint-body">
      <a class="try-btn" href="/api/v1/sports/soccer/leagues" target="_blank">&#9654; Try soccer leagues</a>
      <a class="try-btn" href="/api/v1/sports/basketball/leagues" target="_blank" style="margin-left:0.5rem">&#9654; Try basketball leagues</a>
    </div>
  </div>

  <h2>WebSocket</h2>
  <div class="ws-section">
    <p style="margin-bottom:1rem; color:var(--muted)">Connect to receive live score push updates as they happen — no polling needed.</p>
    <div><span class="ws-badge">WS</span> <code>wss://{host}/api/ws</code></div>
    <div class="resp-label" style="margin-top:1.25rem">Message Format (server &#8594; client)</div>
    <pre><code>{
  "type": "score_update",
  "payload": {
    "matchId": "401234567",
    "sport": "soccer",
    "league": "eng.1",
    "homeScore": 2,
    "awayScore": 1,
    "status": "in-progress",
    "clock": "74'",
    "timestamp": "2024-05-01T19:15:00.000Z"
  }
}</code></pre>
    <div class="resp-label" style="margin-top:1rem">Quick Connect (browser)</div>
    <pre><code>const ws = new WebSocket(\`wss://\${location.host}/api/ws\`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'score_update') {
    console.log('Score update:', msg.payload);
  }
};</code></pre>
  </div>

  <h2>Rate Limits</h2>
  <table>
    <tr><th>Tier</th><th>Limit</th><th>Window</th></tr>
    <tr><td>Public (unauthenticated)</td><td>100 requests</td><td>15 minutes</td></tr>
    <tr><td>WebSocket connections</td><td>Unlimited messages</td><td>—</td></tr>
  </table>
  <p style="margin-top:0.75rem; color:var(--muted); font-size:0.85rem">Rate limit headers returned on every response: <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code>, <code>RateLimit-Reset</code></p>

  <h2>Error Codes</h2>
  <table>
    <tr><th>Code</th><th>HTTP</th><th>Meaning</th></tr>
    <tr><td>SPORT_NOT_FOUND</td><td>404</td><td>Unknown sport identifier</td></tr>
    <tr><td>LEAGUE_NOT_FOUND</td><td>400</td><td>Unknown league for that sport</td></tr>
    <tr><td>MATCH_NOT_FOUND</td><td>404</td><td>Match ID not found or expired</td></tr>
    <tr><td>TEAM_NOT_FOUND</td><td>404</td><td>Team ID not found</td></tr>
    <tr><td>RATE_LIMITED</td><td>429</td><td>Too many requests</td></tr>
    <tr><td>NOT_FOUND</td><td>404</td><td>Unknown endpoint</td></tr>
  </table>

  <footer>
    SportStream API v1 &mdash; Data sourced from ESPN public feeds &mdash; Updates every 30 seconds
  </footer>
</div>
</body>
</html>`;

export default router;
