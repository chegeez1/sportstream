import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/api";

// ── Clock helpers ────────────────────────────────────────
function parseSoccerSecs(clock: string): number | null {
  const m = parseInt(clock.replace(/'.*/g, "").trim(), 10);
  return isNaN(m) ? null : m * 60;
}

function parseBasketballSecs(clock: string): number | null {
  const parts = clock.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10), s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
  }
  return null;
}

function secsToMSS(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

function secsToPrime(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return s > 0 ? `${m}'${s}` : `${m}'`;
}

function periodLabel(sport: string, period: number) {
  if (sport === "soccer") {
    if (period === 1) return "1st Half";
    if (period === 2) return "2nd Half";
    return "Extra Time";
  }
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4}`;
}

// ── Team Logo ────────────────────────────────────────────
function TeamLogo({ logo, name }: { logo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0">
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={name}
      className="h-9 w-9 object-contain rounded-full shrink-0"
      onError={() => setErr(true)}
    />
  );
}

// ── Match Card ───────────────────────────────────────────
interface MatchCardProps {
  match: Match;
  compact?: boolean;
  fetchedAt?: number;
}

export function MatchCard({ match, compact, fetchedAt }: MatchCardProps) {
  const isLive = match.status === "in-progress";
  const isFinal = match.status === "final";
  const isScheduled = match.status === "scheduled";
  const isBasketball = match.sport === "basketball";
  const hasPeriod = match.period > 0;

  // Track when the clock baseline was established
  const baseRef = useRef<{ secs: number; at: number } | null>(null);

  useEffect(() => {
    if (!isLive || !match.clock) { baseRef.current = null; return; }
    const secs = isBasketball
      ? parseBasketballSecs(match.clock)
      : parseSoccerSecs(match.clock);
    if (secs !== null) {
      baseRef.current = { secs, at: fetchedAt ?? Date.now() };
    }
  }, [match.clock, isLive, isBasketball, fetchedAt]);

  // Ticking clock state
  const [clockSecs, setClockSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!isLive || !match.clock) { setClockSecs(null); return; }
    const base = baseRef.current;
    if (!base) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - base.at) / 1000);
      if (isBasketball) {
        setClockSecs(Math.max(0, base.secs - elapsed));
      } else {
        const halfMax = (match.period ?? 1) <= 1 ? 45 * 60 : 90 * 60;
        setClockSecs(Math.min(base.secs + elapsed, halfMax + 5 * 60));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isLive, match.clock, match.period, isBasketball]);

  const clockDisplay = clockSecs === null
    ? (match.clock || null)
    : isBasketball ? secsToMSS(clockSecs) : secsToPrime(clockSecs);

  const minutesElapsed = clockSecs !== null && !isBasketball
    ? Math.floor(clockSecs / 60) : null;

  const minsRemInHalf = minutesElapsed !== null
    ? Math.max(0, ((match.period ?? 1) <= 1 ? 45 : 90) - minutesElapsed)
    : null;

  // Countdown for scheduled matches
  const [startsInSecs, setStartsInSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!isScheduled || !match.startTime) { setStartsInSecs(null); return; }
    const kick = new Date(match.startTime).getTime();
    const update = () => setStartsInSecs(Math.max(0, Math.floor((kick - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isScheduled, match.startTime]);

  const kickOffTime = match.startTime
    ? new Date(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const startsInLabel = startsInSecs !== null && startsInSecs < 24 * 3600
    ? startsInSecs < 3600
      ? `${Math.ceil(startsInSecs / 60)}m`
      : `${Math.floor(startsInSecs / 3600)}h ${Math.floor((startsInSecs % 3600) / 60)}m`
    : null;

  return (
    <Link href={`/match/${match.id}?sport=${match.sport}&league=${match.league}`}>
      <div
        data-testid="match-card"
        className={cn(
          "group relative bg-card border rounded-xl cursor-pointer transition-all duration-200 overflow-hidden",
          "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
          isLive && "border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.06)]",
          !isLive && !isFinal && "border-card-border",
          isFinal && "border-card-border opacity-85",
          compact ? "p-3" : "p-4"
        )}
      >
        {/* Top accent bar for live games */}
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />
        )}

        {/* ── Header: status + period ── */}
        <div className="flex items-center justify-between mb-3">

          {/* Left: live badge / kick-off time / FT */}
          {isLive ? (
            <div className="flex items-center gap-2">
              {/* Pulsing LIVE pill */}
              <span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-widest rounded-full px-2 py-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                LIVE
              </span>
              {/* Ticking clock */}
              {clockDisplay && (
                <span className="font-mono font-black text-sm text-emerald-400 tabular-nums">
                  {clockDisplay}
                </span>
              )}
            </div>
          ) : isFinal ? (
            <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">Full Time</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground/80 tabular-nums">{kickOffTime}</span>
              {startsInLabel && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                  in {startsInLabel}
                </span>
              )}
            </div>
          )}

          {/* Right: period label */}
          {isLive && hasPeriod && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary border border-border rounded-full px-2 py-0.5">
              {periodLabel(match.sport, match.period)}
            </span>
          )}
        </div>

        {/* ── Teams + Scores ── */}
        <div className="space-y-2">
          {[
            { team: match.homeTeam },
            { team: match.awayTeam },
          ].map(({ team }) => {
            const isWinner = isFinal
              && team.score !== null && match.homeTeam.score !== null && match.awayTeam.score !== null
              && team.score > (team === match.homeTeam ? match.awayTeam.score : match.homeTeam.score);

            return (
              <div key={team.name} className="flex items-center gap-3">
                <TeamLogo logo={team.logo} name={team.name} />
                <span className={cn(
                  "flex-1 font-semibold text-sm leading-tight truncate",
                  isFinal && !isWinner ? "text-muted-foreground" : "text-foreground"
                )}>
                  {team.name}
                </span>
                <span className={cn(
                  "text-2xl font-black tabular-nums min-w-[2ch] text-right",
                  isLive ? "text-primary" : isFinal ? "text-foreground" : "text-muted-foreground/25"
                )}>
                  {team.score !== null ? team.score : "–"}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Time remaining bar (live only) ── */}
        {isLive && (minsRemInHalf !== null || (isBasketball && clockDisplay)) && (
          <div className="mt-3 pt-2.5 border-t border-emerald-500/15 flex items-center justify-between gap-2 text-[11px]">
            {!isBasketball && minsRemInHalf !== null && (
              minsRemInHalf > 0 ? (
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{minsRemInHalf}</span> min{minsRemInHalf !== 1 ? "s" : ""} left in half
                </span>
              ) : (
                <span className="text-amber-400 font-bold">Stoppage time</span>
              )
            )}
            {isBasketball && clockSecs !== null && (
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground font-mono">{secsToMSS(clockSecs)}</span> remaining in {periodLabel(match.sport, match.period)}
              </span>
            )}
            {/* Progress bar across the half */}
            {!isBasketball && minutesElapsed !== null && (
              <div className="flex-1 max-w-20 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (minutesElapsed / ((match.period ?? 1) <= 1 ? 45 : 45)) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Venue ── */}
        {!compact && match.venue && (
          <div className={cn("mt-3 pt-2.5 border-t", isLive ? "border-emerald-500/10" : "border-border")}>
            <p className="text-[11px] text-muted-foreground truncate">{match.venue}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
