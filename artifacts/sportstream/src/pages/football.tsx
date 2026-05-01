import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, SOCCER_LEAGUES, type Match } from "@/lib/api";
import { LeagueSection } from "@/components/LeagueSection";
import { LeagueSectionSkeleton } from "@/components/MatchSkeleton";
import { Activity } from "lucide-react";

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground font-semibold text-lg">No football matches right now</p>
      <p className="text-muted-foreground text-sm mt-1">Check back when the next fixtures kick off</p>
    </div>
  );
}

export default function FootballPage() {
  const query = useQuery({
    queryKey: ["scoreboard", "soccer", "all"],
    queryFn: () => fetchScoreboard("soccer"),
    refetchInterval: 30000,
  });

  const matches = query.data?.matches ?? [];
  const liveCount = matches.filter((m) => m.status === "in-progress").length;

  const byLeague = new Map<string, { leagueName: string; matches: Match[] }>();
  for (const match of matches) {
    if (!byLeague.has(match.league)) {
      byLeague.set(match.league, { leagueName: match.leagueName, matches: [] });
    }
    byLeague.get(match.league)!.matches.push(match);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-sidebar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-foreground">Football</h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full px-3 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {liveCount} Live
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            All football scores — Premier League, La Liga, Bundesliga, Ligue 1, Serie A, Champions League
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {SOCCER_LEAGUES.map((league) => {
              const count = byLeague.get(league.id)?.matches.length ?? 0;
              return (
                <span
                  key={league.id}
                  className="text-xs px-2.5 py-1 rounded bg-secondary text-muted-foreground font-medium"
                >
                  {league.name} {count > 0 ? `(${count})` : ""}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {query.isLoading ? (
          <>
            <LeagueSectionSkeleton />
            <LeagueSectionSkeleton />
          </>
        ) : matches.length === 0 ? (
          <EmptyState />
        ) : (
          Array.from(byLeague.entries()).map(([leagueId, { leagueName, matches: leagueMatches }]) => (
            <LeagueSection key={leagueId} leagueName={leagueName} matches={leagueMatches} fetchedAt={query.dataUpdatedAt} />
          ))
        )}
      </div>
    </div>
  );
}
