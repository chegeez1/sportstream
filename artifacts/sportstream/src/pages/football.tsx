import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, type Match } from "@/lib/api";
import { MatchRow } from "@/components/MatchRow";
import { Activity, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const LEAGUES = [
  { id: "eng.1",          name: "English Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "esp.1",          name: "La Liga",                flag: "🇪🇸" },
  { id: "ger.1",          name: "Bundesliga",             flag: "🇩🇪" },
  { id: "fra.1",          name: "Ligue 1",                flag: "🇫🇷" },
  { id: "ita.1",          name: "Serie A",                flag: "🇮🇹" },
  { id: "uefa.champions", name: "Champions League",       flag: "⭐" },
];

export default function FootballPage() {
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["scoreboard", "soccer"],
    queryFn: () => fetchScoreboard("soccer"),
    refetchInterval: 30000,
  });

  const matches = query.data?.matches ?? [];
  const filtered = leagueFilter ? matches.filter((m) => m.league === leagueFilter) : matches;

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const order = { "in-progress": 0, scheduled: 1, final: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1)
      || new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  }), [filtered]);

  const groups = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of sorted) {
      if (!map.has(m.league)) map.set(m.league, []);
      map.get(m.league)!.push(m);
    }
    return Array.from(map.entries())
      .map(([id, ms]) => ({ id, name: ms[0]?.leagueName ?? id, matches: ms }))
      .sort((a, b) => {
        const aL = a.matches.filter((m) => m.status === "in-progress").length;
        const bL = b.matches.filter((m) => m.status === "in-progress").length;
        return bL - aL;
      });
  }, [sorted]);

  const liveCount = matches.filter((m) => m.status === "in-progress").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-2xl font-black text-foreground">⚽ Football</h1>
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

      {/* League filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setLeagueFilter(null)}
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full border transition-all",
            leagueFilter === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All Leagues ({matches.length})
        </button>
        {LEAGUES.map((l) => {
          const count = matches.filter((m) => m.league === l.id).length;
          if (!count) return null;
          return (
            <button
              key={l.id}
              onClick={() => setLeagueFilter(leagueFilter === l.id ? null : l.id)}
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-full border transition-all",
                leagueFilter === l.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {l.flag} {l.name} ({count})
            </button>
          );
        })}
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-muted-foreground">
          <Activity className="h-10 w-10 opacity-15" />
          <p className="font-semibold">No matches found</p>
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
          {leagueFilter ? (
            sorted.map((m) => (
              <MatchRow key={m.id} match={m} fetchedAt={query.dataUpdatedAt} showLeague={false} />
            ))
          ) : (
            groups.map((group, gi) => {
              const groupLive = group.matches.filter((m) => m.status === "in-progress").length;
              const leagueMeta = LEAGUES.find((l) => l.id === group.id);
              return (
                <div key={group.id} className={cn(gi > 0 && "border-t border-border")}>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-sidebar border-b border-border">
                    <span className="text-sm font-bold">
                      {leagueMeta?.flag} {group.name}
                    </span>
                    {groupLive > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded px-1.5 py-0.5">
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                        </span>
                        {groupLive} live
                      </span>
                    )}
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{group.matches.length} matches</span>
                  </div>
                  {group.matches.map((m) => (
                    <MatchRow key={m.id} match={m} fetchedAt={query.dataUpdatedAt} showLeague={false} />
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
