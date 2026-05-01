import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, SOCCER_LEAGUES, BASKETBALL_LEAGUES, type Match } from "@/lib/api";
import { LeagueSection } from "@/components/LeagueSection";
import { LeagueSectionSkeleton } from "@/components/MatchSkeleton";
import { Activity, ChevronRight } from "lucide-react";
import { Link } from "wouter";

function HeroBanner({ liveCount, totalMatches }: { liveCount: number; totalMatches: number }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-sidebar via-sidebar to-background border-b border-border">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.07),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-primary text-sm font-bold tracking-widest uppercase">Live Now</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight mb-4">
            Real-Time<br />
            <span className="text-primary">Sports Scores</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Live football and basketball scores, updated every 30 seconds. Never miss a goal.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-2xl font-black text-primary">{liveCount}</span>
              <span className="text-muted-foreground ml-2">matches live</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-2xl font-black text-foreground">{totalMatches}</span>
              <span className="text-muted-foreground ml-2">total today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ sport }: { sport?: string }) {
  return (
    <div className="text-center py-16">
      <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground font-semibold text-lg">
        No {sport ? `${sport} ` : ""}matches right now
      </p>
      <p className="text-muted-foreground text-sm mt-1">Check back when the next fixtures kick off</p>
    </div>
  );
}

export default function Home() {
  const soccerQuery = useQuery({
    queryKey: ["scoreboard", "soccer"],
    queryFn: () => fetchScoreboard("soccer"),
    refetchInterval: 30000,
  });

  const basketballQuery = useQuery({
    queryKey: ["scoreboard", "basketball"],
    queryFn: () => fetchScoreboard("basketball"),
    refetchInterval: 30000,
  });

  const isLoading = soccerQuery.isLoading || basketballQuery.isLoading;

  // Group soccer by league
  const soccerByLeague = new Map<string, { leagueName: string; matches: Match[] }>();
  if (soccerQuery.data?.matches) {
    for (const match of soccerQuery.data.matches) {
      if (!soccerByLeague.has(match.league)) {
        soccerByLeague.set(match.league, { leagueName: match.leagueName, matches: [] });
      }
      soccerByLeague.get(match.league)!.matches.push(match);
    }
  }

  const basketballMatches = basketballQuery.data?.matches ?? [];
  const allMatches = [
    ...(soccerQuery.data?.matches ?? []),
    ...basketballMatches,
  ];
  const liveCount = allMatches.filter((m) => m.status === "in-progress").length;

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner liveCount={liveCount} totalMatches={allMatches.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Quick links */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link href="/football">
            <button
              data-testid="quick-link-football"
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-card-border rounded-lg text-sm font-semibold hover:border-primary/40 transition-all group"
            >
              Football Scores
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </Link>
          <Link href="/basketball">
            <button
              data-testid="quick-link-basketball"
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-card-border rounded-lg text-sm font-semibold hover:border-primary/40 transition-all group"
            >
              Basketball Scores
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </Link>
        </div>

        {isLoading ? (
          <>
            <LeagueSectionSkeleton />
            <LeagueSectionSkeleton />
          </>
        ) : allMatches.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Soccer sections */}
            {soccerByLeague.size > 0 && Array.from(soccerByLeague.entries()).map(([leagueId, { leagueName, matches }]) => (
              <LeagueSection
                key={leagueId}
                leagueName={leagueName}
                matches={matches}
                sport="soccer"
              />
            ))}

            {/* Basketball section */}
            {basketballMatches.length > 0 && (
              <LeagueSection
                leagueName="NBA"
                matches={basketballMatches}
                sport="basketball"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
