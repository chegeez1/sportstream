import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, type Match } from "@/lib/api";
import { SportsSidebar, type LeagueFilter } from "@/components/SportsSidebar";
import { MatchRow } from "@/components/MatchRow";
import { Activity, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mobile league pill selector ──────────────────────────
const MOBILE_TABS = [
  { label: "All",    filter: { sport: "all" as const } },
  { label: "⚽ EPL",  filter: { sport: "soccer" as const, league: "eng.1" } },
  { label: "🇪🇸 Liga", filter: { sport: "soccer" as const, league: "esp.1" } },
  { label: "🇩🇪 BL",  filter: { sport: "soccer" as const, league: "ger.1" } },
  { label: "🇫🇷 L1",  filter: { sport: "soccer" as const, league: "fra.1" } },
  { label: "🇮🇹 SA",  filter: { sport: "soccer" as const, league: "ita.1" } },
  { label: "⭐ UCL",  filter: { sport: "soccer" as const, league: "uefa.champions" } },
  { label: "🏀 NBA",  filter: { sport: "basketball" as const, league: "nba" } },
];

// ── League group header ──────────────────────────────────
function LeagueHeader({
  name, matchCount, liveCount,
}: { name: string; matchCount: number; liveCount: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-sidebar border-b border-border sticky top-0 z-10">
      <span className="text-sm font-bold text-foreground">{name}</span>
      {liveCount > 0 && (
        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded px-1.5 py-0.5">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {liveCount} live
        </span>
      )}
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{matchCount} match{matchCount !== 1 ? "es" : ""}</span>
    </div>
  );
}

// ── Table header ─────────────────────────────────────────
function TableHeader({ showLeague }: { showLeague: boolean }) {
  return (
    <div className="flex items-center gap-0 border-b border-border bg-card/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
      <div className="w-20 shrink-0 px-2 py-1.5 text-center border-r border-border/30">Time</div>
      {showLeague && <div className="w-24 shrink-0 px-2 py-1.5 hidden sm:block">League</div>}
      <div className="flex-1 px-3 py-1.5 text-right">Home</div>
      <div className="w-20 shrink-0 text-center">Score</div>
      <div className="flex-1 px-3 py-1.5">Away</div>
      <div className="w-28 shrink-0 px-2 py-1.5 hidden xl:block">Venue</div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────
function EmptyState({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <Activity className="h-10 w-10 opacity-15" />
      <p className="font-semibold">{text ?? "No matches found"}</p>
      <p className="text-sm text-muted-foreground/60">Check back when the next fixtures kick off</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function Home() {
  const [filter, setFilter] = useState<LeagueFilter>({ sport: "all" });

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
  const isRefetching = soccerQuery.isFetching || basketballQuery.isFetching;

  const allSoccer = soccerQuery.data?.matches ?? [];
  const allBasketball = basketballQuery.data?.matches ?? [];
  const allMatches = [...allSoccer, ...allBasketball];

  // ── Derived counts for sidebar ──
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    allMatches.forEach((m) => { c[m.league] = (c[m.league] ?? 0) + 1; });
    return c;
  }, [allMatches]);

  const liveCounts = useMemo(() => {
    const c: Record<string, number> = {};
    allMatches.filter((m) => m.status === "in-progress")
      .forEach((m) => { c[m.league] = (c[m.league] ?? 0) + 1; });
    return c;
  }, [allMatches]);

  // ── Filter logic ──
  const filtered: Match[] = useMemo(() => {
    if (filter.league) {
      return allMatches.filter((m) => m.league === filter.league);
    }
    if (filter.sport === "soccer") return allSoccer;
    if (filter.sport === "basketball") return allBasketball;
    return allMatches;
  }, [filter, allMatches, allSoccer, allBasketball]);

  // Sort: live first, then scheduled by time, then final
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const order = { "in-progress": 0, scheduled: 1, final: 2 };
    const ao = order[a.status] ?? 1;
    const bo = order[b.status] ?? 1;
    if (ao !== bo) return ao - bo;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  }), [filtered]);

  // ── Group by league for multi-league views ──
  const groupByLeague = !filter.league;
  const groups = useMemo<{ leagueId: string; leagueName: string; sport: string; matches: Match[] }[]>(() => {
    if (!groupByLeague) return [];
    const map = new Map<string, { leagueName: string; sport: string; matches: Match[] }>();
    for (const m of sorted) {
      if (!map.has(m.league)) map.set(m.league, { leagueName: m.leagueName, sport: m.sport, matches: [] });
      map.get(m.league)!.matches.push(m);
    }
    // Sort groups: those with live matches first
    return Array.from(map.entries())
      .map(([leagueId, v]) => ({ leagueId, ...v }))
      .sort((a, b) => {
        const aLive = a.matches.filter((m) => m.status === "in-progress").length;
        const bLive = b.matches.filter((m) => m.status === "in-progress").length;
        return bLive - aLive;
      });
  }, [groupByLeague, sorted]);

  const liveCount = allMatches.filter((m) => m.status === "in-progress").length;
  const fetchedAt = soccerQuery.dataUpdatedAt || basketballQuery.dataUpdatedAt;
  const soccerFetchedAt = soccerQuery.dataUpdatedAt;
  const basketballFetchedAt = basketballQuery.dataUpdatedAt;

  const getFetchedAt = (m: Match) =>
    m.sport === "soccer" ? soccerFetchedAt : basketballFetchedAt;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 flex gap-5">
      {/* ── Sidebar ── */}
      <SportsSidebar
        active={filter}
        onSelect={setFilter}
        counts={counts}
        liveCounts={liveCounts}
      />

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-foreground">
              {filter.league
                ? sorted[0]?.leagueName ?? "Matches"
                : filter.sport === "soccer"
                ? "Football"
                : filter.sport === "basketball"
                ? "Basketball"
                : "All Matches"}
            </h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {liveCount} live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isRefetching && <RefreshCw className="h-3 w-3 animate-spin" />}
            <span>{sorted.length} matches</span>
          </div>
        </div>

        {/* ── Mobile league pills ── */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {MOBILE_TABS.map((tab) => {
            const isActive =
              JSON.stringify(tab.filter) === JSON.stringify(filter);
            return (
              <button
                key={tab.label}
                onClick={() => setFilter(tab.filter as LeagueFilter)}
                className={cn(
                  "shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Match list ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading live scores…</span>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState text="No matches for this selection" />
        ) : groupByLeague ? (
          /* Grouped by league */
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {groups.map((group, gi) => {
              const groupLive = group.matches.filter((m) => m.status === "in-progress").length;
              return (
                <div key={group.leagueId} className={cn(gi > 0 && "border-t border-border")}>
                  <LeagueHeader
                    name={group.leagueName}
                    matchCount={group.matches.length}
                    liveCount={groupLive}
                  />
                  <TableHeader showLeague={false} />
                  {group.matches.map((m) => (
                    <MatchRow key={m.id} match={m} fetchedAt={getFetchedAt(m)} showLeague={false} />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single league / sport flat list */
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <TableHeader showLeague={false} />
            {sorted.map((m) => (
              <MatchRow key={m.id} match={m} fetchedAt={getFetchedAt(m)} showLeague={false} />
            ))}
          </div>
        )}

        {/* Quick links to other pages */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: "⚽ All Football", f: { sport: "soccer" as const } },
            { label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League", f: { sport: "soccer" as const, league: "eng.1" } },
            { label: "🇪🇸 La Liga",     f: { sport: "soccer" as const, league: "esp.1" } },
            { label: "🇩🇪 Bundesliga",  f: { sport: "soccer" as const, league: "ger.1" } },
            { label: "🇫🇷 Ligue 1",     f: { sport: "soccer" as const, league: "fra.1" } },
            { label: "🇮🇹 Serie A",     f: { sport: "soccer" as const, league: "ita.1" } },
            { label: "⭐ Champions Lg", f: { sport: "soccer" as const, league: "uefa.champions" } },
            { label: "🏀 NBA",          f: { sport: "basketball" as const, league: "nba" } },
          ].map(({ label, f }) => {
            const count = f.league ? (counts[f.league] ?? 0) : 0;
            if (JSON.stringify(f) === JSON.stringify(filter)) return null;
            return (
              <button
                key={label}
                onClick={() => setFilter(f)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-card-border rounded-lg text-xs font-semibold hover:border-primary/40 transition-all"
              >
                {label}
                {count > 0 && <span className="text-muted-foreground">({count})</span>}
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
