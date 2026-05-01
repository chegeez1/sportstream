import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard } from "@/lib/api";
import { MatchRow } from "@/components/MatchRow";
import { Activity, RefreshCw } from "lucide-react";
import { useMemo } from "react";

const LEAGUES = [
  { id: "nba",  name: "NBA",  flag: "🏀" },
  { id: "wnba", name: "WNBA", flag: "🏀" },
];

export default function BasketballPage() {
  const query = useQuery({
    queryKey: ["scoreboard", "basketball"],
    queryFn: () => fetchScoreboard("basketball"),
    refetchInterval: 30000,
  });

  const matches = query.data?.matches ?? [];

  const sorted = useMemo(() => [...matches].sort((a, b) => {
    const order = { "in-progress": 0, scheduled: 1, final: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1)
      || new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  }), [matches]);

  const liveCount = matches.filter((m) => m.status === "in-progress").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-2xl font-black text-foreground">🏀 Basketball</h1>
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            {liveCount} live
          </span>
        )}
        {query.isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />}
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-muted-foreground">
          <Activity className="h-10 w-10 opacity-15" />
          <p className="font-semibold">No basketball matches today</p>
          <p className="text-sm text-muted-foreground/60">Check back during NBA game hours</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="flex items-center gap-0 border-b border-border bg-card/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            <div className="w-20 shrink-0 px-2 py-1.5 text-center border-r border-border/30">Time</div>
            <div className="flex-1 px-3 py-1.5 text-right">Home</div>
            <div className="w-20 shrink-0 text-center">Score</div>
            <div className="flex-1 px-3 py-1.5">Away</div>
            <div className="w-28 shrink-0 px-2 py-1.5 hidden xl:block">Venue</div>
          </div>
          {sorted.map((m) => (
            <MatchRow key={m.id} match={m} fetchedAt={query.dataUpdatedAt} showLeague={false} />
          ))}
        </div>
      )}
    </div>
  );
}
