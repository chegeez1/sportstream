import { logger } from "./logger";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

export const SPORTS_CONFIG = {
  soccer: {
    label: "Soccer / Football",
    leagues: {
      "eng.1": "English Premier League",
      "esp.1": "La Liga",
      "ger.1": "Bundesliga",
      "fra.1": "Ligue 1",
      "ita.1": "Serie A",
      "uefa.champions": "UEFA Champions League",
    },
  },
  basketball: {
    label: "Basketball",
    leagues: {
      nba: "NBA",
      wnba: "WNBA",
    },
  },
} as const;

export type Sport = keyof typeof SPORTS_CONFIG;

async function espnFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SportStreamAPI/1.0)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`ESPN fetch failed: ${res.status} ${url}`);
  }
  return res.json();
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  score?: string;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  leagueName: string;
  status: string;
  statusDetail: string;
  clock?: string;
  period?: number;
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  startTime: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
  color?: string;
  location: string;
  sport: string;
  leagueId: string;
}

function parseCompetitor(c: Record<string, unknown>): Team {
  const team = (c["team"] as Record<string, unknown>) ?? {};
  const logos = (team["logos"] as Record<string, unknown>[]) ?? [];
  return {
    id: String(team["id"] ?? ""),
    name: String(team["displayName"] ?? team["name"] ?? ""),
    abbreviation: String(team["abbreviation"] ?? ""),
    logo: logos[0] ? String(logos[0]["href"]) : undefined,
    score: c["score"] !== undefined ? String(c["score"]) : undefined,
  };
}

function parseEvent(
  event: Record<string, unknown>,
  sport: string,
  league: string,
  leagueName: string,
): Match {
  const competitions = (event["competitions"] as Record<string, unknown>[]) ?? [];
  const comp = competitions[0] ?? {};
  const status = (comp["status"] as Record<string, unknown>) ?? {};
  const statusType = (status["type"] as Record<string, unknown>) ?? {};
  const competitors = (comp["competitors"] as Record<string, unknown>[]) ?? [];
  const venue = comp["venue"] as Record<string, unknown> | undefined;

  const home = competitors.find((c) => (c as Record<string, unknown>)["homeAway"] === "home") as Record<string, unknown> | undefined;
  const away = competitors.find((c) => (c as Record<string, unknown>)["homeAway"] === "away") as Record<string, unknown> | undefined;

  return {
    id: String(event["id"] ?? ""),
    sport,
    league,
    leagueName,
    status: String(statusType["name"] ?? "scheduled"),
    statusDetail: String(statusType["detail"] ?? status["displayClock"] ?? ""),
    clock: status["displayClock"] ? String(status["displayClock"]) : undefined,
    period: status["period"] ? Number(status["period"]) : undefined,
    homeTeam: home ? parseCompetitor(home) : { id: "", name: "TBD", abbreviation: "TBD" },
    awayTeam: away ? parseCompetitor(away) : { id: "", name: "TBD", abbreviation: "TBD" },
    venue: venue ? String((venue["fullName"] as string) ?? "") : undefined,
    startTime: String(comp["date"] ?? event["date"] ?? ""),
  };
}

export async function getScoreboard(sport: Sport, league: string): Promise<Match[]> {
  try {
    const url = `${ESPN_BASE}/${sport}/${league}/scoreboard`;
    const data = (await espnFetch(url)) as Record<string, unknown>;
    const events = (data["events"] as Record<string, unknown>[]) ?? [];
    const leagueName =
      SPORTS_CONFIG[sport].leagues[league as keyof (typeof SPORTS_CONFIG)[typeof sport]] ?? league;
    return events.map((e) => parseEvent(e, sport, league, leagueName));
  } catch (err) {
    logger.error({ err, sport, league }, "Failed to fetch scoreboard");
    return [];
  }
}

export async function getAllScoreboards(sport: Sport): Promise<Match[]> {
  const leagues = Object.keys(SPORTS_CONFIG[sport].leagues);
  const results = await Promise.allSettled(
    leagues.map((league) => getScoreboard(sport, league)),
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function getMatch(sport: Sport, league: string, matchId: string): Promise<Match | null> {
  try {
    const url = `${ESPN_BASE}/${sport}/${league}/summary?event=${matchId}`;
    const data = (await espnFetch(url)) as Record<string, unknown>;
    const header = (data["header"] as Record<string, unknown>) ?? {};
    const competitions = (header["competitions"] as Record<string, unknown>[]) ?? [];
    if (!competitions.length) return null;
    const comp = competitions[0];
    const fakeEvent: Record<string, unknown> = {
      id: matchId,
      competitions: [comp],
      date: (comp as Record<string, unknown>)["date"],
    };
    const leagueName =
      SPORTS_CONFIG[sport].leagues[league as keyof (typeof SPORTS_CONFIG)[typeof sport]] ?? league;
    return parseEvent(fakeEvent, sport, league, leagueName);
  } catch (err) {
    logger.error({ err, sport, league, matchId }, "Failed to fetch match");
    return null;
  }
}

export async function getTeam(sport: Sport, leagueId: string, teamId: string): Promise<TeamDetail | null> {
  try {
    const url = `${ESPN_BASE}/${sport}/${leagueId}/teams/${teamId}`;
    const data = (await espnFetch(url)) as Record<string, unknown>;
    const teamWrapper = (data["team"] as Record<string, unknown>) ?? {};
    const logos = (teamWrapper["logos"] as Record<string, unknown>[]) ?? [];
    return {
      id: String(teamWrapper["id"] ?? teamId),
      name: String(teamWrapper["name"] ?? ""),
      abbreviation: String(teamWrapper["abbreviation"] ?? ""),
      displayName: String(teamWrapper["displayName"] ?? ""),
      logo: logos[0] ? String(logos[0]["href"]) : undefined,
      color: teamWrapper["color"] ? `#${teamWrapper["color"]}` : undefined,
      location: String(teamWrapper["location"] ?? ""),
      sport,
      leagueId,
    };
  } catch (err) {
    logger.error({ err, sport, teamId }, "Failed to fetch team");
    return null;
  }
}
