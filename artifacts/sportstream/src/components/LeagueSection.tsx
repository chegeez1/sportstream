import { MatchCard } from "./MatchCard";
import type { Match } from "@/lib/api";

interface LeagueSectionProps {
  leagueName: string;
  matches: Match[];
  sport?: string;
  fetchedAt?: number;
}

export function LeagueSection({ leagueName, matches, sport, fetchedAt }: LeagueSectionProps) {
  const liveCount = matches.filter((m) => m.status === "in-progress").length;

  return (
    <section className="mb-8" data-testid="league-section">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {sport && (
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              {sport === "soccer" ? "Football" : "Basketball"}
            </span>
          )}
          <h2 className="text-base font-bold text-foreground">{leagueName}</h2>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              {liveCount} LIVE
            </span>
          )}
        </div>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} fetchedAt={fetchedAt} />
        ))}
      </div>
    </section>
  );
}
