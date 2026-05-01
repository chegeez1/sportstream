import { useEffect, useRef, useState, useCallback } from "react";
import {
  Activity, Wifi, WifiOff, RefreshCw, Zap, Clock,
  Users, TrendingUp, Circle, Timer, MapPin, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────
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
  period?: number;
  homeTeam: { name: string; abbreviation: string; logo?: string; score?: string };
  awayTeam: { name: string; abbreviation: string; logo?: string; score?: string };
  venue?: string;
  startTime?: string;
}

interface ServerStatus {
  status: string;
  uptime: string;
  requests: { total: number; errors: number; successRate: number };
  websocket: { connectedClients: number };
  polling: { count: number; lastPollAt: string; nextPollAt: string };
}

// ── Clock Helpers ────────────────────────────────────────
function wallTime() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Parse "67'" → 67 minutes in seconds = 4020s */
function parseSoccerClockSecs(clockStr: string): number | null {
  const m = clockStr.replace(/'/g, "").replace(/\+.*$/, "").trim();
  const mins = parseInt(m, 10);
  return isNaN(mins) ? null : mins * 60;
}

/** Parse "7:24" → 444 seconds remaining (basketball counts down) */
function parseBasketballClockSecs(clockStr: string): number | null {
  const parts = clockStr.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  }
  return null;
}

/** Convert seconds → display "m:ss" */
function secsToMSS(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Convert seconds → soccer display "mm'" */
function secsToPrime(totalSecs: number) {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return secs > 0 ? `${mins}'${secs}` : `${mins}'`;
}

function periodLabel(sport: string, period?: number) {
  if (!period) return "";
  if (sport === "soccer") {
    if (period === 1) return "1st Half";
    if (period === 2) return "2nd Half";
    if (period >= 3) return "Extra Time";
    return `P${period}`;
  }
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4}`;
}

/** Time remaining in current period (soccer) */
function soccerTimeRemaining(clockSecs: number, period: number) {
  const halfEnd = period <= 1 ? 45 * 60 : 90 * 60;
  const rem = halfEnd - clockSecs;
  if (rem <= 0) return "90'+";
  return `-${secsToMSS(rem)}`;
}

// ── Status Dot ───────────────────────────────────────────
function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", connected ? "bg-emerald-400" : "bg-red-400")} />
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────
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

// ── Live Match Card ──────────────────────────────────────
interface TickedMatch extends Match {
  _tickSecs?: number;   // current interpolated clock in seconds
  _isCountdown?: boolean; // basketball counts down
  _fetchedAt?: number;  // Date.now() when fetched
}

function LiveMatchCard({ m }: { m: TickedMatch }) {
  const [displayClock, setDisplayClock] = useState<string | null>(null);

  useEffect(() => {
    if (m.status !== "in-progress" || !m.clock) {
      setDisplayClock(null);
      return;
    }

    const fetchedAt = m._fetchedAt ?? Date.now();
    const isBasketball = m.sport === "basketball";

    let baseSecs: number | null = null;
    if (isBasketball) {
      baseSecs = m._tickSecs ?? parseBasketballClockSecs(m.clock ?? "");
    } else {
      baseSecs = m._tickSecs ?? parseSoccerClockSecs(m.clock ?? "");
    }

    if (baseSecs === null) { setDisplayClock(m.clock ?? null); return; }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - fetchedAt) / 1000);
      let current: number;
      if (isBasketball) {
        current = Math.max(0, baseSecs! - elapsed);
      } else {
        const halfMax = (m.period ?? 1) <= 1 ? 45 * 60 : 90 * 60;
        current = Math.min(baseSecs! + elapsed, halfMax + 5 * 60);
      }
      setDisplayClock(isBasketball ? secsToMSS(current) : secsToPrime(current));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [m]);

  const isLive = m.status === "in-progress";
  const isFinal = m.status === "final";
  const isBasketball = m.sport === "basketball";

  // Time remaining for soccer
  const soccerRem = (() => {
    if (!isLive || isBasketball || !displayClock) return null;
    const mins = parseInt(displayClock.replace(/'.*/g, ""), 10);
    if (isNaN(mins)) return null;
    const halfEnd = (m.period ?? 1) <= 1 ? 45 : 90;
    const rem = halfEnd - mins;
    if (rem < 0) return null;
    return rem === 0 ? "Full time" : `${rem} min${rem !== 1 ? "s" : ""} left`;
  })();

  const startLocal = m.startTime
    ? new Date(m.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;
  const startDate = m.startTime
    ? new Date(m.startTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : null;

  return (
    <div className={cn(
      "bg-card border rounded-xl overflow-hidden transition-all",
      isLive ? "border-emerald-500/30" : "border-card-border"
    )}>
      {/* Status bar */}
      <div className={cn(
        "flex items-center justify-between px-3 py-1.5 text-[10px] font-bold border-b",
        isLive
          ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
          : isFinal
          ? "bg-secondary/50 border-border text-muted-foreground"
          : "bg-blue-500/5 border-blue-500/15 text-blue-400"
      )}>
        <div className="flex items-center gap-2">
          {isLive && <StatusDot connected />}
          <span className="uppercase tracking-wider">
            {isLive
              ? (m.period ? periodLabel(m.sport, m.period) : "Live")
              : (m.statusDetail || m.status)}
          </span>
          {isLive && m.leagueName && (
            <span className="text-muted-foreground/60 font-normal">· {m.leagueName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLive && displayClock && (
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="h-2.5 w-2.5" />
              {displayClock}
            </span>
          )}
          {isLive && soccerRem && (
            <span className="flex items-center gap-1 text-muted-foreground font-normal">
              <Timer className="h-2.5 w-2.5" />
              {soccerRem}
            </span>
          )}
          {isLive && isBasketball && displayClock && (
            <span className="flex items-center gap-1 text-muted-foreground font-normal">
              <Timer className="h-2.5 w-2.5" />
              {displayClock} left
            </span>
          )}
          {!isLive && !isFinal && startLocal && (
            <span className="flex items-center gap-1 text-muted-foreground font-normal">
              <Calendar className="h-2.5 w-2.5" />
              {startDate} {startLocal}
            </span>
          )}
        </div>
      </div>

      {/* Match content */}
      <div className="p-3 space-y-1.5">
        {[
          { team: m.homeTeam, label: "Home" },
          { team: m.awayTeam, label: "Away" },
        ].map(({ team }) => (
          <div key={team.name} className="flex items-center gap-2.5">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {team.logo
                ? <img src={team.logo} alt={team.abbreviation} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <span className="text-[10px] font-bold text-muted-foreground">{team.abbreviation?.slice(0, 3)}</span>
              }
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground truncate">{team.name}</span>
            {team.score != null && (
              <span className={cn(
                "text-xl font-black tabular-nums w-8 text-right leading-none",
                isLive ? "text-primary" : "text-foreground"
              )}>
                {team.score}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer: venue */}
      {m.venue && (
        <div className="px-3 pb-2 flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{m.venue}</span>
        </div>
      )}
    </div>
  );
}

// ── Live Scoreboard ──────────────────────────────────────
function LiveScoreboard() {
  const [matches, setMatches] = useState<TickedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [sport, setSport] = useState<"soccer" | "basketball">("soccer");
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [nextPollSecs, setNextPollSecs] = useState<number | null>(null);
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (fromSecs: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let rem = fromSecs;
    setNextPollSecs(rem);
    countdownRef.current = setInterval(() => {
      rem -= 1;
      setNextPollSecs(Math.max(0, rem));
      if (rem <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    }, 1000);
  };

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/sports/${sport}/scoreboard`);
      const json = await res.json();
      if (json.ok) {
        const now = Date.now();
        setMatches((json.data.matches ?? []).map((m: Match) => ({ ...m, _fetchedAt: now })));
        setLastFetchedAt(now);
        startCountdown(30);
      } else {
        setError(json.error?.message ?? "Unknown error");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [sport]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoRefresh) {
      fetchScores();
      fetchIntervalRef.current = setInterval(fetchScores, 30_000);
    } else {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setNextPollSecs(null);
    }
    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, fetchScores]);

  const liveCount = matches.filter((m) => m.status === "in-progress").length;
  const scheduledCount = matches.filter((m) => m.status === "scheduled").length;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Scoreboard</span>
          {liveCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 flex items-center gap-1">
              <Circle className="h-1.5 w-1.5 fill-emerald-400" /> {liveCount} live
            </span>
          )}
          {scheduledCount > 0 && (
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5">
              {scheduledCount} upcoming
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nextPollSecs !== null && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
              <RefreshCw className="h-2.5 w-2.5" />
              next in {nextPollSecs}s
            </span>
          )}
          {lastFetchedAt && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {new Date(lastFetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <div className="flex rounded-md overflow-hidden border border-border">
            {(["soccer", "basketball"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSport(s); setMatches([]); setLastFetchedAt(null); setNextPollSecs(null); setAutoRefresh(false); }}
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
            onClick={() => setAutoRefresh((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-md border transition-colors",
              autoRefresh
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <RefreshCw className={cn("h-3 w-3", autoRefresh && "animate-spin [animation-duration:3s]")} />
            {autoRefresh ? "Auto on" : "Auto"}
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

      {/* Body */}
      <div className="min-h-40 p-3 bg-card/20">
        {error && <p className="text-red-400 text-xs font-mono p-2">{error}</p>}

        {!autoRefresh && matches.length === 0 && !error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Activity className="h-9 w-9 opacity-15" />
            <p className="text-sm font-medium">No scores loaded yet</p>
            <p className="text-xs text-muted-foreground/60">Enable Auto or click Fetch to pull live data from ESPN</p>
          </div>
        )}

        {loading && matches.length === 0 && (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Fetching live scores…</span>
          </div>
        )}

        {matches.length > 0 && (
          <>
            {/* Live matches first */}
            {["in-progress", "scheduled", "final"].map((statusGroup) => {
              const group = matches.filter((m) => m.status === statusGroup);
              if (!group.length) return null;
              const label = statusGroup === "in-progress" ? "Live Now" : statusGroup === "scheduled" ? "Upcoming" : "Final";
              return (
                <div key={statusGroup} className="mb-4">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mb-2 px-1",
                    statusGroup === "in-progress" ? "text-emerald-400" : statusGroup === "scheduled" ? "text-blue-400" : "text-muted-foreground"
                  )}>
                    {label} · {group.length}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.map((m) => <LiveMatchCard key={m.id} m={m} />)}
                  </div>
                </div>
              );
            })}
          </>
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
  const [nextPollSecs, setNextPollSecs] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (fromSecs: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let rem = fromSecs;
    setNextPollSecs(rem);
    countdownRef.current = setInterval(() => {
      rem -= 1;
      setNextPollSecs(Math.max(0, rem));
    }, 1000);
  };

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/status");
      const json = await res.json();
      if (json.ok) { setStatus(json.data); startCountdown(10); }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active) {
      fetchStatus();
      intervalRef.current = setInterval(fetchStatus, 10_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setNextPollSecs(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
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
        <div className="flex items-center gap-2">
          {nextPollSecs !== null && (
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <RefreshCw className="h-2.5 w-2.5" /> {nextPollSecs}s
            </span>
          )}
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
      </div>

      <div className="p-4 bg-card/30">
        {!active && !status && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
            <Zap className="h-7 w-7 opacity-20" />
            <p className="text-sm">Click Monitor to start watching server health (refreshes every 10s)</p>
          </div>
        )}
        {status && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Uptime" value={status.uptime} icon={Clock} color="green" />
              <Stat label="Total Requests" value={status.requests.total.toLocaleString()} icon={Activity} color="blue" />
              <Stat label="Success Rate" value={`${status.requests.successRate}%`} icon={TrendingUp} color="primary" />
              <Stat label="WS Clients" value={status.websocket.connectedClients} icon={Users} color="violet" />
            </div>
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
          </>
        )}
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

  const addEvent = useCallback((type: string, raw: string, highlight = false) => {
    counterRef.current += 1;
    const ev: WsEvent = { id: counterRef.current, time: wallTime(), type, raw, highlight };
    setEvents((prev) => [ev, ...prev].slice(0, 80));
    if (highlight) setMsgCount((n) => n + 1);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${location.host}/api/ws`);
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); addEvent("connected", "WebSocket connection established"); };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const summary = msg.type === "score_update"
          ? `${msg.payload?.sport} · match ${msg.payload?.matchId} — ${msg.payload?.homeScore}:${msg.payload?.awayScore} (${msg.payload?.clock ?? msg.payload?.status})`
          : JSON.stringify(msg).slice(0, 120);
        addEvent(msg.type ?? "message", summary, true);
      } catch { addEvent("message", e.data.slice(0, 120), true); }
    };
    ws.onerror = () => addEvent("error", "Connection error");
    ws.onclose = () => { setConnected(false); addEvent("disconnected", "WebSocket closed"); };
  }, [addEvent]);

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
          {connected && <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">LIVE</span>}
        </div>
        <div className="flex items-center gap-2">
          {msgCount > 0 && <span className="text-xs text-muted-foreground">{msgCount} update{msgCount !== 1 ? "s" : ""}</span>}
          {!active ? (
            <button onClick={() => { setActive(true); connect(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 transition-colors">
              <Wifi className="h-3 w-3" /> Connect
            </button>
          ) : (
            <button onClick={() => { setActive(false); wsRef.current?.close(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-bold rounded-md hover:bg-secondary/80 transition-colors border border-border">
              <WifiOff className="h-3 w-3" /> Disconnect
            </button>
          )}
        </div>
      </div>
      <div className="h-52 overflow-y-auto p-3 space-y-1 bg-[hsl(220_18%_6%)] font-mono text-[11px]">
        {events.length === 0 && (
          <p className="text-muted-foreground/40 text-center pt-10">
            {active ? "Waiting for messages…" : "Click Connect to start monitoring"}
          </p>
        )}
        {events.map((ev) => (
          <div key={ev.id} className={cn("flex gap-3 items-start", ev.highlight && "text-foreground")}>
            <span className="text-muted-foreground/50 shrink-0 w-16">{ev.time}</span>
            <span className={cn("shrink-0 w-24", typeColor[ev.type] ?? "text-muted-foreground")}>{ev.type}</span>
            <span className="text-muted-foreground truncate">{ev.raw}</span>
          </div>
        ))}
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
            All panels connect directly to the real SportStream API — data is live from ESPN.
            Match clocks tick in real time between API polls, and the scoreboard shows a live countdown to the next refresh.
          </p>
        </div>
      </div>
      <ServerHealth />
      <LiveScoreboard />
      <WsMonitor />
    </div>
  );
}
