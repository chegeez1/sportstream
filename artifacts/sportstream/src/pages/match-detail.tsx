import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, type Match } from "@/lib/api";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function TeamLogoLarge({ logo, name }: { logo: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={name}
      className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-full"
      onError={() => setErr(true)}
    />
  );
}

function StatusPill({ match }: { match: Match }) {
  if (match.status === "in-progress") {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-red-400 font-bold text-sm tracking-wider">
          {match.clock ? `${match.clock}` : "LIVE"}
        </span>
        {match.period > 0 && (
          <span className="text-red-400/70 text-xs">
            {match.sport === "soccer"
              ? match.period === 1 ? "1st Half" : "2nd Half"
              : `Quarter ${match.period}`}
          </span>
        )}
      </div>
    );
  }
  if (match.status === "final") {
    return (
      <div className="flex items-center gap-2 bg-secondary border border-border rounded-full px-4 py-1.5">
        <span className="text-muted-foreground font-bold text-sm tracking-wider">FULL TIME</span>
      </div>
    );
  }
  const date = new Date(match.startTime);
  return (
    <div className="flex items-center gap-2 bg-secondary border border-border rounded-full px-4 py-1.5">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground font-semibold text-sm">
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

function MatchDetailSkeleton() {
  return (
    <div className="animate-pulse max-w-2xl mx-auto">
      <div className="h-6 w-32 bg-secondary rounded mb-8" />
      <div className="bg-card border border-card-border rounded-2xl p-8">
        <div className="h-4 w-24 bg-secondary rounded mx-auto mb-6" />
        <div className="flex items-center justify-between gap-8">
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="h-24 w-24 bg-secondary rounded-full" />
            <div className="h-5 w-28 bg-secondary rounded" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-28 bg-secondary rounded-xl" />
            <div className="h-4 w-16 bg-secondary rounded" />
          </div>
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="h-24 w-24 bg-secondary rounded-full" />
            <div className="h-5 w-28 bg-secondary rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchDetailProps {
  match: Match;
}

function MatchDetailView({ match }: MatchDetailProps) {
  const isLive = match.status === "in-progress";
  const isFinal = match.status === "final";
  const hasScore = match.homeTeam.score !== null && match.awayTeam.score !== null;

  const homeWins = hasScore && match.homeTeam.score! > match.awayTeam.score!;
  const awayWins = hasScore && match.awayTeam.score! > match.homeTeam.score!;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/">
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to scores
        </button>
      </Link>

      <div className={cn(
        "bg-card border rounded-2xl overflow-hidden",
        isLive ? "border-red-500/20" : "border-card-border"
      )}>
        {isLive && (
          <div className="h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />
        )}

        <div className="p-6 sm:p-8">
          {/* League + status */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              {match.leagueName}
            </span>
            <StatusPill match={match} />
          </div>

          {/* Score board */}
          <div className="flex items-center justify-between gap-4 sm:gap-8 mb-8">
            {/* Home */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <TeamLogoLarge logo={match.homeTeam.logo} name={match.homeTeam.name} />
              <div className="text-center">
                <p className={cn(
                  "font-bold text-base sm:text-lg leading-tight",
                  homeWins ? "text-foreground" : isFinal ? "text-muted-foreground" : "text-foreground"
                )}>
                  {match.homeTeam.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{match.homeTeam.abbreviation}</p>
                {homeWins && isFinal && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 mt-1 inline-block">WINNER</span>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-5xl sm:text-6xl font-black tabular-nums",
                  (isLive || isFinal) && hasScore ? "text-foreground" : "text-muted-foreground/20"
                )}>
                  {match.homeTeam.score !== null ? match.homeTeam.score : "–"}
                </span>
                <span className="text-2xl text-muted-foreground/30 font-light">:</span>
                <span className={cn(
                  "text-5xl sm:text-6xl font-black tabular-nums",
                  (isLive || isFinal) && hasScore ? "text-foreground" : "text-muted-foreground/20"
                )}>
                  {match.awayTeam.score !== null ? match.awayTeam.score : "–"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground/50 font-medium">HOME — AWAY</span>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <TeamLogoLarge logo={match.awayTeam.logo} name={match.awayTeam.name} />
              <div className="text-center">
                <p className={cn(
                  "font-bold text-base sm:text-lg leading-tight",
                  awayWins ? "text-foreground" : isFinal ? "text-muted-foreground" : "text-foreground"
                )}>
                  {match.awayTeam.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{match.awayTeam.abbreviation}</p>
                {awayWins && isFinal && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 mt-1 inline-block">WINNER</span>
                )}
              </div>
            </div>
          </div>

          {/* Match info */}
          <div className="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {match.venue && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary/50" />
                <span className="truncate">{match.venue}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-primary/50" />
              <span>
                {new Date(match.startTime).toLocaleDateString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isLive && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Score updates automatically every 30 seconds
        </p>
      )}
    </div>
  );
}

export default function MatchDetailPage() {
  const [match, params] = useRoute("/match/:id");

  const searchParams = new URLSearchParams(window.location.search);
  const sport = (searchParams.get("sport") as "soccer" | "basketball") ?? "soccer";
  const league = searchParams.get("league") ?? undefined;
  const matchId = params?.id ?? "";

  const query = useQuery({
    queryKey: ["scoreboard", sport, league],
    queryFn: () => fetchScoreboard(sport, league),
    refetchInterval: 30000,
    enabled: !!matchId,
  });

  const foundMatch = query.data?.matches.find((m) => m.id === matchId);

  if (!match) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {query.isLoading ? (
          <MatchDetailSkeleton />
        ) : !foundMatch ? (
          <div className="max-w-2xl mx-auto">
            <Link href="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-8 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to scores
              </button>
            </Link>
            <div className="text-center py-16">
              <p className="text-muted-foreground font-semibold text-lg">Match not found</p>
              <p className="text-muted-foreground text-sm mt-1">This match may have ended or been removed</p>
            </div>
          </div>
        ) : (
          <MatchDetailView match={foundMatch} />
        )}
      </div>
    </div>
  );
}
