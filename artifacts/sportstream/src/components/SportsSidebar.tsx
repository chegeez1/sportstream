import { cn } from "@/lib/utils";

export interface LeagueFilter {
  sport: "soccer" | "basketball" | "all";
  league?: string;
}

const SOCCER_LEAGUES = [
  { id: "eng.1",         name: "English Premier League", short: "EPL",         flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "esp.1",         name: "La Liga",                short: "La Liga",      flag: "🇪🇸" },
  { id: "ger.1",         name: "Bundesliga",             short: "Bundesliga",   flag: "🇩🇪" },
  { id: "fra.1",         name: "Ligue 1",                short: "Ligue 1",      flag: "🇫🇷" },
  { id: "ita.1",         name: "Serie A",                short: "Serie A",      flag: "🇮🇹" },
  { id: "uefa.champions",name: "Champions League",       short: "UCL",          flag: "⭐" },
];

const BASKETBALL_LEAGUES = [
  { id: "nba",  name: "NBA",  short: "NBA",  flag: "🇺🇸" },
  { id: "wnba", name: "WNBA", short: "WNBA", flag: "🇺🇸" },
];

interface Props {
  active: LeagueFilter;
  onSelect: (f: LeagueFilter) => void;
  counts?: Record<string, number>;
  liveCounts?: Record<string, number>;
}

function NavItem({
  label, flag, count, live, active, onClick,
}: {
  label: string; flag?: string; count?: number; live?: number;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all",
        active
          ? "bg-primary/15 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {flag && <span className="text-base leading-none shrink-0">{flag}</span>}
      <span className="flex-1 leading-tight truncate">{label}</span>
      {live ? (
        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded px-1.5 py-0.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {live}
        </span>
      ) : count !== undefined && count > 0 ? (
        <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">{count}</span>
      ) : null}
    </button>
  );
}

export function SportsSidebar({ active, onSelect, counts = {}, liveCounts = {} }: Props) {
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const allLive = Object.values(liveCounts).reduce((a, b) => a + b, 0);

  const isActive = (f: LeagueFilter) => {
    if (f.sport === "all" && active.sport === "all") return true;
    if (f.sport === "soccer" && !f.league && active.sport === "soccer" && !active.league) return true;
    if (f.sport === "basketball" && !f.league && active.sport === "basketball" && !active.league) return true;
    if (f.league && active.league === f.league) return true;
    return false;
  };

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-4 space-y-1">
        {/* All Matches */}
        <NavItem
          label="All Matches"
          flag="🏆"
          count={allCount}
          live={allLive}
          active={isActive({ sport: "all" })}
          onClick={() => onSelect({ sport: "all" })}
        />

        {/* Soccer */}
        <div className="pt-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 pb-1.5">
            ⚽ Football
          </p>
          <NavItem
            label="All Football"
            count={SOCCER_LEAGUES.reduce((a, l) => a + (counts[l.id] ?? 0), 0)}
            live={SOCCER_LEAGUES.reduce((a, l) => a + (liveCounts[l.id] ?? 0), 0)}
            active={isActive({ sport: "soccer" })}
            onClick={() => onSelect({ sport: "soccer" })}
          />
          {SOCCER_LEAGUES.map((l) => (
            <NavItem
              key={l.id}
              flag={l.flag}
              label={l.name}
              count={counts[l.id]}
              live={liveCounts[l.id]}
              active={isActive({ sport: "soccer", league: l.id })}
              onClick={() => onSelect({ sport: "soccer", league: l.id })}
            />
          ))}
        </div>

        {/* Basketball */}
        <div className="pt-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 pb-1.5">
            🏀 Basketball
          </p>
          <NavItem
            label="All Basketball"
            count={BASKETBALL_LEAGUES.reduce((a, l) => a + (counts[l.id] ?? 0), 0)}
            live={BASKETBALL_LEAGUES.reduce((a, l) => a + (liveCounts[l.id] ?? 0), 0)}
            active={isActive({ sport: "basketball" })}
            onClick={() => onSelect({ sport: "basketball" })}
          />
          {BASKETBALL_LEAGUES.map((l) => (
            <NavItem
              key={l.id}
              flag={l.flag}
              label={l.name}
              count={counts[l.id]}
              live={liveCounts[l.id]}
              active={isActive({ sport: "basketball", league: l.id })}
              onClick={() => onSelect({ sport: "basketball", league: l.id })}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
