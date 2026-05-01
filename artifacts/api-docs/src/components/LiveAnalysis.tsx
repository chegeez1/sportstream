import { useEffect, useRef, useState, useCallback } from "react";
import { Activity, Wifi, WifiOff, RefreshCw, Zap, Clock, Users, TrendingUp, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────
interface WsEvent {
  id: number;
  time: string;
  type: string;
  raw: string;
  highlight?: boolean;
}

interface Match {
  id: string;
  sport: string;
  league: string;
  leagueName: string;
  status: string;
  statusDetail: string;
  clock?: string;
  homeTeam: { name: string; abbreviation: string; logo?: string; score?: string };
  awayTeam: { name: string; abbreviation: string; logo?: string; score?: string };
}

interface ServerStatus {
  status: string;
  uptime: string;
  requests: { total: number; errors: number; successRate: number };
  websocket: { connectedClients: number };
  polling: { count: number; lastPollAt: string; nextPollAt: string };
}

// ── Helpers ─────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {connected && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", connected ? "bg-emerald-400" : "bg-red-400")} />
    </span>
  );
}

function Stat({ label, value, icon: Icon, color = "primary" }: {
  label: string; value: string | number; icon: React.ElementType; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-3 py-2.5">
      <div className={cn("p-1.5 rounded", {
        "bg-primary/10 text-primary": color === "primary",
        "bg-emerald-500/10 text-emerald-400": color === "green",
        "bg-violet-500/10 text-violet-400": color === "violet",
        "bg-blue-500/10 text-blue-400": color === "blue",
      })}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// ── WebSocket Monitor ────────────────────────────────────
function WsMonitor() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [active, setActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const counterRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const addEvent = useCallback((type: string, raw: string, highlight = false) => {
    counterRef.current += 1;
    const ev: WsEvent = { id: counterRef.current, time: now(), type, raw, highlight };
    setEvents((prev) => [ev, ...prev].slice(0, 80));
    if (highlight) setMsgCount((n) => n + 1);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${location.host}/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      addEvent("connected", "WebSocket connection established");
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const summary =
          msg.type === "score_update"
            ? `${msg.payload?.sport ?? "?"} · ${msg.payload?.matchId ?? "?"} — ${msg.payload?.homeScore ?? "?"}:${msg.payload?.awayScore ?? "?"} (${msg.payload?.status ?? "?"})`
            : JSON.stringify(msg).slice(0, 120);
        addEvent(msg.type ?? "message", summary, true);
      } catch {
        addEvent("message", e.data.slice(0, 120), true);
      }
    };
    ws.onerror = () => addEvent("error", "Connection error");
    ws.onclose = () => {
      setConnected(false);
      addEvent("disconnected", "WebSocket closed");
    };
  }, [addEvent]);

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
  };

  useEffect(() => () => { wsRef.current?.close(); }, []);

  const typeColor: Record<string, string> = {
    connected: "text-emerald-400",
    disconnected: "text-red-400",
    error: "text-red-400",
    score_update: "text-primary",
    message: "text-blue-400",
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border">
        <div className="flex items-center gap-2.5">
          <StatusDot connected={connected} />
          <span className="text-sm font-semibold text-foreground">WebSocket Monitor</span>
          {connected && (
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">LIVE</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {msgCount > 0 && (
            <span className="text-xs text-muted-foreground">{msgCount} update{msgCount !== 1 ? "s" : ""}</span>
          )}
          {!active ? (
            <button
              onClick={() => { setActive(true); connect(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 transition-colors"
            >
              <Wifi className="h-3 w-3" /> Connect
            </button>
          ) : (
            <button
              onClick={() => { setActive(false); disconnect(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-bold rounded-md hover:bg-secondary/80 transition-colors"
            >
              <WifiOff className="h-3 w-3" /> Disconnect
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="h-52 overflow-y-auto p-3 space-y-1 bg-[hsl(220_18%_6%)] font-mono text-[11px]">
        {events.length === 0 && (
          <p className="text-muted-foreground/40 text-center pt-10">
            {active ? "Waiting for messages…" : "Click Connect to start monitoring"}
          </p>
        )}
        {events.map((ev) => (
          <div key={ev.id} className={cn("flex gap-3 items-start", ev.highlight && "text-foreground")}>
            <span className="text-muted-foreground/50 shrink-0 w-16">{ev.time}</span>
            <span className={cn("shrink-0 w-20", typeColor[ev.type] ?? "text-muted-foreground")}>{ev.type}</span>
            <span className="text-muted-foreground truncate">{ev.raw}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Scoreboard ──────────────────────────────────────
function LiveScoreboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [sport, setSport] = useState<"soccer" | "basketball">("soccer");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/sports/${sport}/scoreboard`);
      const json = await res.json();
      if (json.ok) {
        setMatches(json.data.matches ?? []);
        setLastUpdated(now());
      } else {
        setError(json.error?.message ?? "Unknown error");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    if (autoRefresh) {
      fetchScores();
      intervalRef.current = setInterval(fetchScores, 30_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchScores]);

  const statusBg: Record<string, string> = {
    "in-progress": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    final: "bg-secondary text-muted-foreground border-border",
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Scoreboard</span>
          {autoRefresh && (
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 flex items-center gap-1">
              <Circle className="h-1.5 w-1.5 fill-emerald-400" /> AUTO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lastUpdated}
            </span>
          )}
          <div className="flex rounded-md overflow-hidden border border-border">
            {(["soccer", "basketball"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSport(s); setMatches([]); setLastUpdated(null); }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  sport === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "soccer" ? "⚽ Soccer" : "🏀 Basketball"}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAutoRefresh((v) => { if (!v) fetchScores(); return !v; }); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-md border transition-colors",
              autoRefresh
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <RefreshCw className={cn("h-3 w-3", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Auto" : "Auto"}
          </button>
          <button
            onClick={fetchScores}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary border border-border text-muted-foreground text-[11px] font-bold rounded-md hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Fetch
          </button>
        </div>
      </div>

      <div className="min-h-40 p-3 bg-card/30">
        {error && <p className="text-red-400 text-xs font-mono p-2">{error}</p>}
        {!autoRefresh && matches.length === 0 && !error && !loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <Activity className="h-8 w-8 opacity-20" />
            <p className="text-sm">Enable auto-refresh or click Fetch to load live scores</p>
          </div>
        )}
        {loading && matches.length === 0 && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading scores…</span>
          </div>
        )}
        {matches.length > 0 && (
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-3 py-2.5">
                <div className={cn("text-[9px] font-black border rounded px-1.5 py-0.5 shrink-0", statusBg[m.status] ?? statusBg.scheduled)}>
                  {m.status === "in-progress" ? (m.clock ?? "LIVE") : m.statusDetail || m.status.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {m.homeTeam.logo && <img src={m.homeTeam.logo} alt="" className="h-4 w-4 object-contain" />}
                    <span className="truncate text-foreground">{m.homeTeam.name}</span>
                    {m.homeTeam.score != null && (
                      <span className={cn("ml-auto font-black tabular-nums", m.status === "in-progress" ? "text-primary" : "text-foreground")}>
                        {m.homeTeam.score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    {m.awayTeam.logo && <img src={m.awayTeam.logo} alt="" className="h-4 w-4 object-contain" />}
                    <span className="truncate">{m.awayTeam.name}</span>
                    {m.awayTeam.score != null && (
                      <span className={cn("ml-auto font-black tabular-nums", m.status === "in-progress" ? "text-primary" : "text-foreground")}>
                        {m.awayTeam.score}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground/50 shrink-0">{m.leagueName?.slice(0, 12)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Server Health ────────────────────────────────────────
function ServerHealth() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/status");
      const json = await res.json();
      if (json.ok) setStatus(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      fetchStatus();
      intervalRef.current = setInterval(fetchStatus, 10_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, fetchStatus]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Server Health</span>
          {active && status && (
            <span className={cn(
              "text-[10px] font-bold border rounded px-1.5 py-0.5",
              status.status === "operational"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              {status.status?.toUpperCase()}
            </span>
          )}
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
            active
              ? "bg-secondary border border-border text-muted-foreground hover:text-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          {active ? "Stop" : "Monitor"}
        </button>
      </div>

      <div className="p-4 bg-card/30">
        {!active && !status && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
            <Zap className="h-7 w-7 opacity-20" />
            <p className="text-sm">Click Monitor to start watching server health (refreshes every 10s)</p>
          </div>
        )}
        {status && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Uptime" value={status.uptime} icon={Clock} color="green" />
            <Stat label="Total Requests" value={status.requests.total.toLocaleString()} icon={Activity} color="blue" />
            <Stat label="Success Rate" value={`${status.requests.successRate}%`} icon={TrendingUp} color="primary" />
            <Stat label="WS Clients" value={status.websocket.connectedClients} icon={Users} color="violet" />
          </div>
        )}
        {status && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-card border border-card-border rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground mb-1">Poll count</p>
              <p className="font-mono text-sm font-bold text-foreground">{status.polling.count}</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground mb-1">Last polled ESPN</p>
              <p className="font-mono text-sm font-bold text-foreground">
                {status.polling.lastPollAt
                  ? new Date(status.polling.lastPollAt).toLocaleTimeString("en-GB")
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────
export function LiveAnalysis() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
        <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-0.5">Live API Playground</p>
          <p className="text-sm text-muted-foreground">
            These panels connect directly to the real SportStream API and WebSocket — all the data is live, not mocked.
            Open your browser DevTools Network tab to see the actual requests being made.
          </p>
        </div>
      </div>

      <ServerHealth />
      <LiveScoreboard />
      <WsMonitor />
    </div>
  );
}
