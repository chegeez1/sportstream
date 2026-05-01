export const SPORTS = ["soccer", "basketball"] as const;

export const SOCCER_LEAGUES = [
  { id: "eng.1", name: "English Premier League" },
  { id: "esp.1", name: "La Liga" },
  { id: "ger.1", name: "Bundesliga" },
  { id: "fra.1", name: "Ligue 1" },
  { id: "ita.1", name: "Serie A" },
  { id: "uefa.champions", name: "UEFA Champions League" },
];

export const BASKETBALL_LEAGUES = [
  { id: "nba", name: "NBA" },
  { id: "wnba", name: "WNBA" },
];

export interface NavSection {
  title: string;
  items: { id: string; label: string }[];
}

export const NAV: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "base-url", label: "Base URL & Versioning" },
      { id: "response-format", label: "Response Format" },
      { id: "authentication", label: "Authentication" },
    ],
  },
  {
    title: "REST Endpoints",
    items: [
      { id: "status", label: "GET /status" },
      { id: "sports", label: "GET /sports" },
      { id: "leagues", label: "GET /sports/:sport/leagues" },
      { id: "scoreboard", label: "GET /sports/:sport/scoreboard" },
      { id: "match-detail", label: "GET /sports/:sport/matches/:id" },
      { id: "team-detail", label: "GET /sports/:sport/teams/:id" },
    ],
  },
  {
    title: "Real-Time",
    items: [
      { id: "websocket", label: "WebSocket" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "rate-limits", label: "Rate Limits" },
      { id: "errors", label: "Error Codes" },
      { id: "types", label: "Data Types" },
    ],
  },
];

export const MATCH_EXAMPLE = {
  id: "740942",
  sport: "soccer",
  league: "eng.1",
  leagueName: "English Premier League",
  status: "in-progress",
  statusDetail: "67'",
  clock: "67'",
  period: 2,
  homeTeam: {
    id: "382",
    name: "Arsenal",
    abbreviation: "ARS",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/383.png",
    score: "2",
  },
  awayTeam: {
    id: "364",
    name: "Chelsea",
    abbreviation: "CHE",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/363.png",
    score: "1",
  },
  venue: "Emirates Stadium, London",
  startTime: "2024-05-01T19:00:00Z",
};
