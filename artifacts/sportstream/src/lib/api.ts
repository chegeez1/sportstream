export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: number | null;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  leagueName: string;
  status: "scheduled" | "in-progress" | "final";
  statusDetail: string;
  clock: string;
  period: number;
  homeTeam: Team;
  awayTeam: Team;
  venue: string;
  startTime: string;
}

export interface ScoreboardResponse {
  sport: string;
  league: string;
  matchCount: number;
  matches: Match[];
}

/**
 * Derives the API base URL from the current page's origin so the app works
 * on any domain — dev, staging, or production — without changes.
 */
export function getApiBase(): string {
  if (typeof window === "undefined") return "/api";
  return `${window.location.origin}/api`;
}

/**
 * Derives the WebSocket URL from the current page's origin.
 * Automatically uses wss:// on HTTPS and ws:// on HTTP.
 */
export function getWsUrl(path = "/api/ws"): string {
  if (typeof window === "undefined") return `ws://localhost/api/ws`;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}${path}`;
}

export async function fetchScoreboard(
  sport: "soccer" | "basketball",
  league?: string,
): Promise<ScoreboardResponse> {
  const base = getApiBase();
  const url = league
    ? `${base}/sports/${sport}/scoreboard?league=${league}`
    : `${base}/sports/${sport}/scoreboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch scoreboard: ${res.status}`);
  return res.json();
}

export async function fetchMatch(
  sport: "soccer" | "basketball",
  id: string,
  league?: string,
): Promise<Match> {
  const base = getApiBase();
  const url = league
    ? `${base}/sports/${sport}/matches/${id}?league=${league}`
    : `${base}/sports/${sport}/matches/${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch match: ${res.status}`);
  return res.json();
}

export const SOCCER_LEAGUES = [
  { id: "eng.1", name: "Premier League" },
  { id: "esp.1", name: "La Liga" },
  { id: "ger.1", name: "Bundesliga" },
  { id: "fra.1", name: "Ligue 1" },
  { id: "ita.1", name: "Serie A" },
  { id: "uefa.champions", name: "Champions League" },
] as const;

export const BASKETBALL_LEAGUES = [
  { id: "nba", name: "NBA" },
] as const;
