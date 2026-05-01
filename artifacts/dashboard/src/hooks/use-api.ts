import { useQuery } from "@tanstack/react-query";

// Stats
export interface StatsResponse {
  stats: {
    uptime: number;
    requests: { total: number; errors: number; successRate: number };
    websocket: { connectedClients: number };
    polling: { count: number; errors: number; lastPollAt: string | null; nextPollAt: string | null };
    endpoints: Array<{ path: string; hits: number; errors: number; lastHit: string | null }>;
  };
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/admin/stats").then((res) => {
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<StatsResponse>;
    }),
    refetchInterval: 5000,
  });
}

// Clients
export interface Client {
  id: string;
  sport: string;
  league: string;
  connectedAt: string;
}

export interface ClientsResponse {
  count: number;
  clients: Client[];
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => fetch("/api/admin/clients").then((res) => {
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json() as Promise<ClientsResponse>;
    }),
    refetchInterval: 10000,
  });
}

// Config
export interface ConfigResponse {
  sports: Array<{ sport: string; label: string; leagues: Array<{ id: string; name: string }> }>;
  pollIntervalSeconds: number;
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => fetch("/api/admin/config").then((res) => {
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json() as Promise<ConfigResponse>;
    }),
  });
}

// Scores
export interface Match {
  id: string;
  sport: string;
  league: string;
  leagueName: string;
  status: string;
  statusDetail: string;
  clock: string;
  period: number;
  homeTeam: { id: string; name: string; abbreviation: string; logo: string; score: string };
  awayTeam: { id: string; name: string; abbreviation: string; logo: string; score: string };
  venue?: string;
  startTime?: string;
}

export interface ScoreboardResponse {
  sport: string;
  league: string;
  matchCount: number;
  matches: Match[];
}

export function useScores(sport: "soccer" | "basketball") {
  return useQuery({
    queryKey: ["scores", sport],
    queryFn: () => fetch(`/api/sports/${sport}/scoreboard`).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${sport} scores`);
      return res.json() as Promise<ScoreboardResponse>;
    }),
    refetchInterval: 30000,
  });
}
