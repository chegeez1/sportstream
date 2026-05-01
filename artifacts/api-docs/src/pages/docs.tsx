import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { MethodBadge } from "@/components/MethodBadge";
import { TryIt } from "@/components/TryIt";
import { Sidebar } from "@/components/Sidebar";
import { LiveAnalysis } from "@/components/LiveAnalysis";
import { MATCH_EXAMPLE } from "@/lib/content";
import { cn } from "@/lib/utils";
import { getHost, getApiBase, getWsUrl } from "@/lib/api";

function Section({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-8 mb-16", className)}>
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-foreground mb-4 pb-3 border-b border-border">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-6 mb-3">{children}</h3>;
}

function Pill({ children, color = "default" }: { children: React.ReactNode; color?: "green" | "blue" | "amber" | "default" }) {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    default: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-block text-[11px] font-semibold border rounded-full px-2.5 py-0.5", colors[color])}>
      {children}
    </span>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; required?: boolean; description: string }[] }) {
  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-sidebar">
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Param</th>
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Type</th>
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Req</th>
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={p.name} className={i % 2 === 0 ? "bg-card" : "bg-card/50"}>
              <td className="px-4 py-2.5 font-mono text-[0.8rem] text-blue-400">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-[0.8rem] text-violet-400">{p.type}</td>
              <td className="px-4 py-2.5">
                {p.required ? (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">required</span>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground bg-secondary rounded px-1.5 py-0.5">optional</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-[0.8rem]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldTable({ fields }: { fields: { name: string; type: string; description: string }[] }) {
  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-sidebar">
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Field</th>
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Type</th>
            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => (
            <tr key={f.name} className={i % 2 === 0 ? "bg-card" : "bg-card/50"}>
              <td className="px-4 py-2.5 font-mono text-[0.8rem] text-blue-400">{f.name}</td>
              <td className="px-4 py-2.5 font-mono text-[0.8rem] text-violet-400">{f.type}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-[0.8rem]">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointHeader({ method, path, description }: { method: "GET" | "WS"; path: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-3">
        <MethodBadge method={method} />
        <code className="text-base font-bold font-mono text-foreground">{path}</code>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default function DocsPage({ activeId, setActiveId }: { activeId: string; setActiveId: (id: string) => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const host = getHost();
  const apiBase = getApiBase();
  const wsUrl = getWsUrl("/api/ws");

  // Observe which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    const sections = contentRef.current?.querySelectorAll("section[id]") ?? [];
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [setActiveId]);

  const navigate = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeId={activeId} onNavigate={navigate} />

      <main ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">

          {/* ── Introduction ── */}
          <Section id="introduction">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold bg-primary/15 text-primary border border-primary/25 rounded-full px-2.5 py-0.5">API v1</span>
                <div className="flex gap-2">
                  <Pill color="green">Free & Open</Pill>
                  <Pill color="blue">REST + WebSocket</Pill>
                  <Pill color="amber">100 req / 15 min</Pill>
                </div>
              </div>
              <h1 className="text-3xl font-black text-foreground mb-3">SportStream API</h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                Real-time live sports scores sourced from ESPN's public data feeds. Get live football and basketball match
                scores, team details, and league standings — updated automatically every 30 seconds.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: "Sports", value: "Soccer · Basketball" },
                { label: "Leagues", value: "8 across 2 sports" },
                { label: "Update interval", value: "Every 30 seconds" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-card-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="font-bold text-sm text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Base URL ── */}
          <Section id="base-url">
            <SectionTitle>Base URL & Versioning</SectionTitle>
            <p className="text-muted-foreground text-sm mb-4">
              All API requests use the <code className="bg-secondary rounded px-1.5 py-0.5 text-xs font-mono">/api/v1</code> base path.
              The version is included in the URL path so clients can pin to a specific API contract.
            </p>
            <CodeBlock
              language="bash"
              title="Base URL"
              code={`${apiBase}/v1`}
            />
            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-400/90">
                <strong>Note:</strong> The internal endpoints at <code className="font-mono text-xs bg-amber-500/10 rounded px-1 py-0.5">/api/sports/*</code> are
                also available but have no rate limiting. Use the versioned <code className="font-mono text-xs bg-amber-500/10 rounded px-1 py-0.5">/api/v1/*</code> endpoints
                for public integrations.
              </p>
            </div>
          </Section>

          {/* ── Response Format ── */}
          <Section id="response-format">
            <SectionTitle>Response Format</SectionTitle>
            <p className="text-muted-foreground text-sm mb-4">
              Every endpoint returns a consistent JSON envelope with an <code className="bg-secondary rounded px-1 py-0.5 text-xs font-mono">ok</code> flag,
              a <code className="bg-secondary rounded px-1 py-0.5 text-xs font-mono">data</code> payload on success, or an
              <code className="bg-secondary rounded px-1 py-0.5 text-xs font-mono">error</code> object on failure.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <CodeBlock
                language="json"
                title="Success response"
                code={`{
  "ok": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-05-01T19:00:00.000Z"
  }
}`}
              />
              <CodeBlock
                language="json"
                title="Error response"
                code={`{
  "ok": false,
  "error": {
    "code": "SPORT_NOT_FOUND",
    "message": "Sport \\"rugby\\" not supported. Supported: soccer, basketball"
  }
}`}
              />
            </div>
          </Section>

          {/* ── Authentication ── */}
          <Section id="authentication">
            <SectionTitle>Authentication</SectionTitle>
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-4">
              <p className="text-emerald-400 font-semibold text-sm mb-1">No API key required</p>
              <p className="text-muted-foreground text-sm">
                SportStream API is completely open. Just make HTTP requests — no signup, no tokens, no OAuth.
                Rate limiting is enforced per IP address (100 requests per 15 minutes).
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              All responses include CORS headers so you can call the API directly from a browser:
            </p>
            <CodeBlock
              language="javascript"
              className="mt-3"
              code={`// Works directly in the browser — no proxy needed\nconst res = await fetch('${apiBase}/v1/sports/soccer/scoreboard');\nconst { ok, data } = await res.json();\nconsole.log(data.matches); // Live match array`}
            />
          </Section>

          {/* ── GET /status ── */}
          <Section id="status">
            <SectionTitle>GET /status</SectionTitle>
            <EndpointHeader
              method="GET"
              path="/api/v1/status"
              description="Returns operational status, uptime, request counts, WebSocket connections, and polling health."
            />
            <CodeBlock
              language="json"
              title="Example response"
              code={JSON.stringify({
                ok: true,
                data: {
                  status: "operational",
                  uptime: "2h 15m 30s",
                  uptimeMs: 8130000,
                  startedAt: "2024-05-01T14:00:00.000Z",
                  requests: { total: 1042, errors: 8, successRate: 99 },
                  websocket: { connectedClients: 3 },
                  polling: {
                    count: 270,
                    errors: 0,
                    lastPollAt: "2024-05-01T16:00:00.000Z",
                    nextPollAt: "2024-05-01T16:00:30.000Z",
                  },
                  supportedSports: ["soccer", "basketball"],
                  version: "1.0.0",
                },
                meta: { timestamp: "2024-05-01T16:00:01.000Z" },
              }, null, 2)}
            />
            <TryIt method="GET" url="/api/v1/status" />
          </Section>

          {/* ── GET /sports ── */}
          <Section id="sports">
            <SectionTitle>GET /sports</SectionTitle>
            <EndpointHeader
              method="GET"
              path="/api/v1/sports"
              description="Lists all supported sports and their available leagues."
            />
            <CodeBlock
              language="json"
              title="Example response"
              code={JSON.stringify({
                ok: true,
                data: {
                  sports: [
                    {
                      id: "soccer",
                      label: "Soccer / Football",
                      leagues: [
                        { id: "eng.1", name: "English Premier League" },
                        { id: "esp.1", name: "La Liga" },
                        { id: "ger.1", name: "Bundesliga" },
                        { id: "fra.1", name: "Ligue 1" },
                        { id: "ita.1", name: "Serie A" },
                        { id: "uefa.champions", name: "UEFA Champions League" },
                      ],
                    },
                    {
                      id: "basketball",
                      label: "Basketball",
                      leagues: [
                        { id: "nba", name: "NBA" },
                        { id: "wnba", name: "WNBA" },
                      ],
                    },
                  ],
                },
                meta: { timestamp: "2024-05-01T16:00:01.000Z" },
              }, null, 2)}
            />
            <TryIt method="GET" url="/api/v1/sports" />
          </Section>

          {/* ── GET /sports/:sport/leagues ── */}
          <Section id="leagues">
            <SectionTitle>GET /sports/:sport/leagues</SectionTitle>
            <EndpointHeader
              method="GET"
              path="/api/v1/sports/:sport/leagues"
              description="Lists all leagues available for a given sport."
            />
            <SubTitle>Path Parameters</SubTitle>
            <ParamTable params={[
              { name: ":sport", type: "string", required: true, description: 'Sport identifier: "soccer" or "basketball"' },
            ]} />
            <TryIt
              method="GET"
              url="/api/v1/sports/:sport/leagues"
              params={[{ name: "sport", label: "sport", placeholder: "soccer", default: "soccer", type: "path" }]}
            />
          </Section>

          {/* ── GET /sports/:sport/scoreboard ── */}
          <Section id="scoreboard">
            <SectionTitle>GET /sports/:sport/scoreboard</SectionTitle>
            <EndpointHeader
              method="GET"
              path="/api/v1/sports/:sport/scoreboard"
              description="Returns live, in-progress, and upcoming match scores. Optionally filter by a specific league. Data is cached and refreshes every 30 seconds."
            />
            <SubTitle>Path Parameters</SubTitle>
            <ParamTable params={[
              { name: ":sport", type: "string", required: true, description: '"soccer" or "basketball"' },
            ]} />
            <SubTitle>Query Parameters</SubTitle>
            <ParamTable params={[
              { name: "league", type: "string", description: 'League ID (e.g. "eng.1", "nba"). Omit to get all leagues for the sport.' },
            ]} />
            <SubTitle>Response</SubTitle>
            <CodeBlock
              language="json"
              title="Example response (soccer, Premier League)"
              code={JSON.stringify({
                ok: true,
                data: {
                  sport: "soccer",
                  league: "eng.1",
                  matchCount: 1,
                  matches: [MATCH_EXAMPLE],
                },
                meta: {
                  timestamp: "2024-05-01T19:07:30.000Z",
                  note: "Data refreshes every 30 seconds from ESPN.",
                  websocket: `${wsUrl} — subscribe for live push updates`,
                },
              }, null, 2)}
            />
            <TryIt
              method="GET"
              url="/api/v1/sports/:sport/scoreboard"
              params={[
                { name: "sport", label: "sport", placeholder: "soccer", default: "soccer", type: "path" },
                { name: "league", label: "league", placeholder: "eng.1 (optional)", type: "query" },
              ]}
            />
          </Section>

          {/* ── GET /sports/:sport/matches/:id ── */}
          <Section id="match-detail">
            <SectionTitle>GET /sports/:sport/matches/:id</SectionTitle>
            <EndpointHeader
              method="GET"
              path="/api/v1/sports/:sport/matches/:matchId"
              description="Returns full detail for a single match by ESPN event ID. Use the match IDs returned from the scoreboard endpoint."
            />
            <SubTitle>Path Parameters</SubTitle>
            <ParamTable params={[
              { name: ":sport", type: "string", required: true, description: '"soccer" or "basketball"' },
              { name: ":matchId", type: "string", required: true, description: "ESPN event ID from the scoreboard response" },
            ]} />
            <SubTitle>Query Parameters</SubTitle>
            <ParamTable params={[
              { name: "league", type: "string", description: 'Required when sport has multiple leagues. E.g. "eng.1"' },
            ]} />
            <TryIt
              method="GET"
              url="/api/v1/sports/:sport/matches/:matchId"
              params={[
                { name: "sport", label: "sport", default: "soccer", type: "path" },
                { name: "matchId", label: "matchId", placeholder: "740942", default: "740942", type: "path" },
                { name: "league", label: "league", default: "eng.1", type: "query" },
              ]}
            />
          </Section>

          {/* ── GET /sports/:sport/teams/:id ── */}
          <Section id="team-detail">
            <SectionTitle>GET /sports/:sport/teams/:id</SectionTitle>
            <EndpointHeader
              method="GET"
              path="/api/v1/sports/:sport/teams/:teamId"
              description="Returns profile information for a team — name, abbreviation, logo, team color, and location."
            />
            <SubTitle>Path Parameters</SubTitle>
            <ParamTable params={[
              { name: ":sport", type: "string", required: true, description: '"soccer" or "basketball"' },
              { name: ":teamId", type: "string", required: true, description: "ESPN team ID from match data" },
            ]} />
            <SubTitle>Query Parameters</SubTitle>
            <ParamTable params={[
              { name: "league", type: "string", description: 'League context for the team. E.g. "eng.1"' },
            ]} />
            <SubTitle>Response Fields</SubTitle>
            <FieldTable fields={[
              { name: "id", type: "string", description: "ESPN team ID" },
              { name: "name", type: "string", description: "Short team name" },
              { name: "displayName", type: "string", description: "Full display name" },
              { name: "abbreviation", type: "string", description: "3-letter code e.g. ARS" },
              { name: "logo", type: "string?", description: "Team badge/logo URL (ESPN CDN)" },
              { name: "color", type: "string?", description: "Primary team color as hex e.g. #EF0107" },
              { name: "location", type: "string", description: "City/country" },
              { name: "sport", type: "string", description: "Sport identifier" },
              { name: "leagueId", type: "string", description: "League this team belongs to" },
            ]} />
            <TryIt
              method="GET"
              url="/api/v1/sports/:sport/teams/:teamId"
              params={[
                { name: "sport", label: "sport", default: "soccer", type: "path" },
                { name: "teamId", label: "teamId", placeholder: "382", default: "382", type: "path" },
                { name: "league", label: "league", default: "eng.1", type: "query" },
              ]}
            />
          </Section>

          {/* ── WebSocket ── */}
          <Section id="websocket">
            <SectionTitle>WebSocket</SectionTitle>
            <EndpointHeader
              method="WS"
              path={wsUrl}
              description="Connect to receive live score push updates the moment they happen — no polling required. The server broadcasts score changes every 30 seconds."
            />
            <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl mb-4">
              <p className="text-sm text-violet-400 font-semibold mb-1">Real-time push</p>
              <p className="text-muted-foreground text-sm">
                The server polls ESPN every 30 seconds and broadcasts a <code className="font-mono text-xs bg-violet-500/10 rounded px-1 py-0.5">score_update</code> message
                to all connected clients whenever a score changes. WebSocket connections have no rate limit.
              </p>
            </div>
            <SubTitle>Message Format</SubTitle>
            <CodeBlock
              language="json"
              title="score_update message (server → client)"
              code={JSON.stringify({
                type: "score_update",
                payload: {
                  matchId: "740942",
                  sport: "soccer",
                  league: "eng.1",
                  homeScore: 2,
                  awayScore: 1,
                  status: "in-progress",
                  clock: "74'",
                  timestamp: "2024-05-01T19:15:00.000Z",
                },
              }, null, 2)}
            />
            <SubTitle>Client Example</SubTitle>
            <CodeBlock
              language="javascript"
              title="Browser WebSocket client"
              code={`const ws = new WebSocket(\`wss://\${location.host}/api/ws\`);

ws.onopen = () => console.log('Connected to SportStream live feed');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'score_update') {
    const { matchId, homeScore, awayScore, clock } = msg.payload;
    console.log(\`Match \${matchId}: \${homeScore} - \${awayScore} (\${clock})\`);
  }
};

ws.onclose = () => {
  // Reconnect with backoff in production
  console.log('Connection closed, reconnecting...');
};`}
            />
            <SubTitle>Node.js Example</SubTitle>
            <CodeBlock
              language="javascript"
              title="Node.js client (ws package)"
              code={`import WebSocket from 'ws';

const ws = new WebSocket('${wsUrl}');

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'score_update') {
    console.log('Score update:', msg.payload);
  }
});`}
            />
          </Section>

          {/* ── Live Analysis ── */}
          <Section id="live-analysis">
            <SectionTitle>⚡ Live Analysis</SectionTitle>
            <p className="text-muted-foreground text-sm mb-6">
              Interactive panels that connect to the real SportStream API — monitor server health, watch live scores update, and observe raw WebSocket messages as they stream in.
            </p>
            <LiveAnalysis />
          </Section>

          {/* ── Rate Limits ── */}
          <Section id="rate-limits">
            <SectionTitle>Rate Limits</SectionTitle>
            <p className="text-muted-foreground text-sm mb-4">
              Rate limiting is applied per IP address on all <code className="bg-secondary rounded px-1 py-0.5 text-xs font-mono">/api/v1/*</code> endpoints.
            </p>
            <FieldTable fields={[
              { name: "Limit", type: "100 requests", description: "Per IP address" },
              { name: "Window", type: "15 minutes", description: "Rolling window" },
              { name: "WebSocket", type: "Unlimited", description: "No rate limit on WS connections or messages" },
              { name: "Docs page", type: "Excluded", description: "/api/v1 HTML docs page is not counted" },
            ]} />
            <SubTitle>Rate Limit Headers</SubTitle>
            <p className="text-muted-foreground text-sm mb-3">
              Every API response includes these headers:
            </p>
            <CodeBlock
              language="bash"
              code={`Ratelimit: "100-in-15min"; r=97; t=840
Ratelimit-Policy: "100-in-15min"; q=100; w=900`}
            />
            <div className="mt-4 p-4 bg-card border border-card-border rounded-xl">
              <p className="text-sm text-foreground font-semibold mb-1">When rate limited</p>
              <p className="text-muted-foreground text-sm mb-3">You'll receive HTTP 429 with:</p>
              <CodeBlock
                language="json"
                code={JSON.stringify({
                  ok: false,
                  error: {
                    code: "RATE_LIMITED",
                    message: "Too many requests. Limit: 100 requests per 15 minutes.",
                  },
                }, null, 2)}
              />
            </div>
          </Section>

          {/* ── Errors ── */}
          <Section id="errors">
            <SectionTitle>Error Codes</SectionTitle>
            <p className="text-muted-foreground text-sm mb-4">
              All errors return a consistent <code className="bg-secondary rounded px-1 py-0.5 text-xs font-mono">{"{ ok: false, error: { code, message } }"}</code> shape.
            </p>
            <FieldTable fields={[
              { name: "SPORT_NOT_FOUND", type: "404", description: 'Unknown sport identifier. Use "soccer" or "basketball".' },
              { name: "LEAGUE_NOT_FOUND", type: "400", description: "Unknown league for the given sport." },
              { name: "MATCH_NOT_FOUND", type: "404", description: "Match ID not found, or match has expired." },
              { name: "TEAM_NOT_FOUND", type: "404", description: "Team ID not found in the given league." },
              { name: "RATE_LIMITED", type: "429", description: "Too many requests — back off and retry after the window resets." },
              { name: "NOT_FOUND", type: "404", description: "Unknown endpoint path." },
            ]} />
          </Section>

          {/* ── Data Types ── */}
          <Section id="types">
            <SectionTitle>Data Types</SectionTitle>

            <SubTitle>Match object</SubTitle>
            <FieldTable fields={[
              { name: "id", type: "string", description: "ESPN event ID" },
              { name: "sport", type: '"soccer" | "basketball"', description: "Sport identifier" },
              { name: "league", type: "string", description: 'League ID e.g. "eng.1"' },
              { name: "leagueName", type: "string", description: 'Human-readable league name e.g. "English Premier League"' },
              { name: "status", type: '"scheduled" | "in-progress" | "final"', description: "Current match state" },
              { name: "statusDetail", type: "string", description: `Human detail: "67'", "HT", "Final", "Postponed"` },
              { name: "clock", type: "string?", description: "Match clock when live e.g. \"67'\"" },
              { name: "period", type: "number?", description: "Half (1/2 for soccer), quarter (1-4 for basketball)" },
              { name: "homeTeam", type: "Team", description: "Home team object (see below)" },
              { name: "awayTeam", type: "Team", description: "Away team object (see below)" },
              { name: "venue", type: "string?", description: "Stadium name and city" },
              { name: "startTime", type: "ISO 8601", description: "Scheduled kick-off or tip-off time" },
            ]} />

            <SubTitle>Team object (inside Match)</SubTitle>
            <FieldTable fields={[
              { name: "id", type: "string", description: "ESPN team ID" },
              { name: "name", type: "string", description: "Full team name" },
              { name: "abbreviation", type: "string", description: "Short code e.g. \"ARS\", \"LAL\"" },
              { name: "logo", type: "string?", description: "Team badge image URL (ESPN CDN, PNG format)" },
              { name: "score", type: "string?", description: "Current score as string, null before kick-off" },
            ]} />

            <SubTitle>Full match example</SubTitle>
            <CodeBlock
              language="json"
              title="Match object"
              code={JSON.stringify(MATCH_EXAMPLE, null, 2)}
            />

            <div className="mt-8 mb-4 border-t border-border pt-8 text-center">
              <p className="text-muted-foreground text-sm">
                SportStream API v1 — Data sourced from ESPN public feeds, updating every 30 seconds.
              </p>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
