import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/api";

// ── Clock helpers ────────────────────────────────────────
function parseSoccerSecs(c: string) {
  const m = parseInt(c.replace(/'.*/g, "").trim(), 10);
  return isNaN(m) ? null : m * 60;
}
function parseBasketballSecs(c: string) {
  const [a, b] = c.split(":");
  const m = parseInt(a, 10), s = parseInt(b, 10);
  return isNaN(m) || isNaN(s) ? null : m * 60 + s;
}
function secsToMSS(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function secsToPrime(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return sec > 0 ? `${m}'${sec}` : `${m}'`;
}

// ── Team logo ────────────────────────────────────────────
function Logo({ logo, name, size = "sm" }: { logo: string; name: string; size?: "sm" | "xs" }) {
  const [err, setErr] = useState(false);
  const dim = size === "xs" ? "h-5 w-5" : "h-7 w-7";
  const textSize = size === "xs" ? "text-[8px]" : "text-[10px]";
  if (!logo || err) {
    return (
      <div className={cn(dim, "rounded-full bg-secondary flex items-center justify-center font-black text-muted-foreground shrink-0", textSize)}>
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={logo} alt={name} className={cn(dim, "object-contain shrink-0")} onError={() => setErr(true)} />
  );
}

// ── Match Row ────────────────────────────────────────────
interface Props {
  match: Match;
  fetchedAt?: number;
  showLeague?: boolean;
}

export function MatchRow({ match, fetchedAt, showLeague }: Props) {
  const isLive = match.status === "in-progress";
  const isFinal = match.status === "final";
  const isBasketball = match.sport === "basketball";

  // Ticking clock
  const baseRef = useRef<{ secs: number; at: number } | null>(null);
  const [clockSecs, setClockSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!isLive || !match.clock) { baseRef.current = null; setClockSecs(null); return; }
    const secs = isBasketball ? parseBasketballSecs(match.clock) : parseSoccerSecs(match.clock);
    if (secs !== null) baseRef.current = { secs, at: fetchedAt ?? Date.now() };
  }, [match.clock, isLive, isBasketball, fetchedAt]);

  useEffect(() => {
    if (!isLive || !match.clock) { setClockSecs(null); return; }
    const base = baseRef.current;
    if (!base) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - base.at) / 1000);
      if (isBasketball) {
        setClockSecs(Math.max(0, base.secs - elapsed));
      } else {
        const max = (match.period ?? 1) <= 1 ? 45 * 60 : 90 * 60;
        setClockSecs(Math.min(base.secs + elapsed, max + 5 * 60));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isLive, match.clock, match.period, isBasketball]);

  const clockStr = clockSecs === null
    ? (match.clock || null)
    : isBasketball ? secsToMSS(clockSecs) : secsToPrime(clockSecs);

  // Countdown for scheduled
  const [startsIn, setStartsIn] = useState<number | null>(null);
  useEffect(() => {
    if (match.status !== "scheduled" || !match.startTime) { setStartsIn(null); return; }
    const kick = new Date(match.startTime).getTime();
    const update = () => setStartsIn(Math.max(0, Math.floor((kick - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [match.status, match.startTime]);

  const kickOffTime = match.startTime
    ? new Date(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const startsInLabel = startsIn !== null && startsIn < 24 * 3600
    ? startsIn < 60
      ? "< 1m"
      : startsIn < 3600
      ? `${Math.ceil(startsIn / 60)}m`
      : `${Math.floor(startsIn / 3600)}h ${Math.floor((startsIn % 3600) / 60)}m`
    : null;

  const periodLabel = (() => {
    if (!match.period) return null;
    if (isBasketball) return match.period <= 4 ? `Q${match.period}` : `OT${match.period - 4}`;
    return match.period === 1 ? "1H" : match.period === 2 ? "2H" : "ET";
  })();

  const homeWins = isFinal && match.homeTeam.score !== null && match.awayTeam.score !== null
    && match.homeTeam.score > match.awayTeam.score;
  const awayWins = isFinal && match.homeTeam.score !== null && match.awayTeam.score !== null
    && match.awayTeam.score > match.homeTeam.score;

  return (
    <Link href={`/match/${match.id}?sport=${match.sport}&league=${match.league}`}>
      <div
        data-testid="match-row"
        className={cn(
          "group flex items-center gap-0 border-b border-border/50 cursor-pointer",
          "hover:bg-secondary/40 transition-colors",
          isLive && "bg-emerald-500/[0.03]"
        )}
      >
        {/* ── Left: status / time ── */}
        <div className="w-20 shrink-0 flex flex-col items-center justify-center px-2 py-3 border-r border-border/30">
          {isLive ? (
            <>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 mb-0.5">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                LIVE
              </span>
              <span className="font-mono font-black text-emerald-400 text-sm tabular-nums leading-none">
                {clockStr ?? "—"}
              </span>
              {periodLabel && (
                <span className="text-[9px] text-muted-foreground mt-0.5">{periodLabel}</span>
              )}
            </>
          ) : isFinal ? (
            <span className="text-[11px] font-bold text-muted-foreground">FT</span>
          ) : (
            <>
              <span className="text-sm font-bold text-foreground/80 tabular-nums leading-none">
                {kickOffTime ?? "—"}
              </span>
              {startsInLabel && (
                <span className="text-[9px] text-blue-400 mt-0.5">in {startsInLabel}</span>
              )}
            </>
          )}
        </div>

        {/* ── League badge (optional) ── */}
        {showLeague && (
          <div className="w-24 shrink-0 px-2 hidden sm:flex items-center">
            <span className="text-[10px] text-muted-foreground/70 truncate leading-tight">{match.leagueName}</span>
          </div>
        )}

        {/* ── Centre: Home team ── */}
        <div className="flex-1 flex items-center gap-2 px-3 py-3 justify-end">
          <span className={cn(
            "text-sm font-semibold text-right leading-tight truncate max-w-[120px]",
            isFinal && !homeWins ? "text-muted-foreground" : "text-foreground",
            homeWins && "font-black"
          )}>
            {match.homeTeam.name}
          </span>
          <Logo logo={match.homeTeam.logo} name={match.homeTeam.name} />
        </div>

        {/* ── Score block ── */}
        <div className={cn(
          "w-20 shrink-0 flex items-center justify-center gap-1.5 px-2",
          isLive && "text-primary"
        )}>
          <span className={cn(
            "text-xl font-black tabular-nums min-w-[1.5rem] text-center",
            !isLive && !isFinal && "text-muted-foreground/25",
            isLive && "text-primary"
          )}>
            {match.homeTeam.score !== null ? match.homeTeam.score : "–"}
          </span>
          <span className="text-muted-foreground/40 text-sm">:</span>
          <span className={cn(
            "text-xl font-black tabular-nums min-w-[1.5rem] text-center",
            !isLive && !isFinal && "text-muted-foreground/25",
            isLive && "text-primary"
          )}>
            {match.awayTeam.score !== null ? match.awayTeam.score : "–"}
          </span>
        </div>

        {/* ── Away team ── */}
        <div className="flex-1 flex items-center gap-2 px-3 py-3 justify-start">
          <Logo logo={match.awayTeam.logo} name={match.awayTeam.name} />
          <span className={cn(
            "text-sm font-semibold leading-tight truncate max-w-[120px]",
            isFinal && !awayWins ? "text-muted-foreground" : "text-foreground",
            awayWins && "font-black"
          )}>
            {match.awayTeam.name}
          </span>
        </div>

        {/* ── Right: Venue ── */}
        <div className="w-28 shrink-0 px-2 hidden xl:flex items-center">
          <span className="text-[10px] text-muted-foreground/50 truncate">{match.venue}</span>
        </div>
      </div>
    </Link>
  );
}
