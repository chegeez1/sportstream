import { MatchCard } from "./MatchCard";
import type { Match } from "@/lib/api";

interface LeagueSectionProps {
  leagueName: string;
  matches: Match[];
  sport?: string;
}

export function LeagueSection({ leagueName, matches, sport }: LeagueSectionProps) {
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
            <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">
              {liveCount} LIVE
            </span>
          )}
        </div>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
