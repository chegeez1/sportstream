import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/api";

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={name}
      className="h-10 w-10 object-contain rounded-full shrink-0"
      onError={() => setErr(true)}
    />
  );
}

function StatusBadge({ match }: { match: Match }) {
  if (match.status === "in-progress") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-xs font-bold text-red-400 tracking-wider">
          {match.clock || match.statusDetail || "LIVE"}
        </span>
      </div>
    );
  }
  if (match.status === "final") {
    return (
      <span className="text-xs font-semibold text-muted-foreground tracking-wider">FT</span>
    );
  }
  // scheduled
  const date = new Date(match.startTime);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <span className="text-xs font-semibold text-muted-foreground">{timeStr}</span>
  );
}

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export function MatchCard({ match, compact }: MatchCardProps) {
  const isLive = match.status === "in-progress";
  const isFinal = match.status === "final";

  return (
    <Link href={`/match/${match.id}?sport=${match.sport}&league=${match.league}`}>
      <div
        data-testid="match-card"
        className={cn(
          "group relative bg-card border border-card-border rounded-xl cursor-pointer transition-all duration-200",
          "hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5",
          isLive && "border-red-500/20 bg-card",
          compact ? "p-3" : "p-4"
        )}
      >
        {/* Live glow strip */}
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />
        )}

        {/* Header: status */}
        <div className="flex items-center justify-between mb-3">
          <StatusBadge match={match} />
          {match.period > 0 && isLive && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {match.sport === "soccer"
                ? match.period === 1 ? "1st Half" : "2nd Half"
                : `Q${match.period}`}
            </span>
          )}
        </div>

        {/* Teams + Score */}
        <div className="space-y-2.5">
          {/* Home team */}
          <div className="flex items-center gap-3">
            <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
            <span className={cn(
              "flex-1 font-semibold text-sm leading-tight",
              isFinal && match.homeTeam.score !== null && match.awayTeam.score !== null
                ? match.homeTeam.score > match.awayTeam.score
                  ? "text-foreground"
                  : "text-muted-foreground"
                : "text-foreground"
            )}>
              {match.homeTeam.name}
            </span>
            <span className={cn(
              "text-2xl font-black tabular-nums min-w-[2ch] text-right",
              isLive ? "text-foreground" : isFinal ? "text-foreground" : "text-muted-foreground/30"
            )}>
              {match.homeTeam.score !== null ? match.homeTeam.score : "–"}
            </span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-3">
            <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />
            <span className={cn(
              "flex-1 font-semibold text-sm leading-tight",
              isFinal && match.homeTeam.score !== null && match.awayTeam.score !== null
                ? match.awayTeam.score > match.homeTeam.score
                  ? "text-foreground"
                  : "text-muted-foreground"
                : "text-foreground"
            )}>
              {match.awayTeam.name}
            </span>
            <span className={cn(
              "text-2xl font-black tabular-nums min-w-[2ch] text-right",
              isLive ? "text-foreground" : isFinal ? "text-foreground" : "text-muted-foreground/30"
            )}>
              {match.awayTeam.score !== null ? match.awayTeam.score : "–"}
            </span>
          </div>
        </div>

        {/* Footer: venue */}
        {!compact && match.venue && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground truncate">{match.venue}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
