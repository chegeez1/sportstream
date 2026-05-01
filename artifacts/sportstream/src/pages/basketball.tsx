import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard } from "@/lib/api";
import { LeagueSection } from "@/components/LeagueSection";
import { LeagueSectionSkeleton } from "@/components/MatchSkeleton";
import { Activity } from "lucide-react";

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground font-semibold text-lg">No basketball matches right now</p>
      <p className="text-muted-foreground text-sm mt-1">Check back during NBA game hours</p>
    </div>
  );
}

export default function BasketballPage() {
  const query = useQuery({
    queryKey: ["scoreboard", "basketball"],
    queryFn: () => fetchScoreboard("basketball"),
    refetchInterval: 30000,
  });

  const matches = query.data?.matches ?? [];
  const liveCount = matches.filter((m) => m.status === "in-progress").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-sidebar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-foreground">Basketball</h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full px-3 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                {liveCount} Live
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            NBA game scores updated in real time
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {query.isLoading ? (
          <LeagueSectionSkeleton />
        ) : matches.length === 0 ? (
          <EmptyState />
        ) : (
          <LeagueSection leagueName="NBA" matches={matches} />
        )}
      </div>
    </div>
  );
}
