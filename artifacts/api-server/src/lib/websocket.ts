import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { logger } from "./logger";
import { setConnectedClients } from "./stats";
import type { Match } from "./espn";

interface ClientSubscription {
  sport?: string;
  league?: string;
}

interface ConnectedClient {
  ws: WebSocket;
  sub: ClientSubscription;
  connectedAt: number;
  id: string;
}

const clients = new Map<string, ConnectedClient>();
let clientIdCounter = 0;

export function createWss(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const sport = url.searchParams.get("sport") ?? undefined;
    const league = url.searchParams.get("league") ?? undefined;
    const id = `client_${++clientIdCounter}`;

    const client: ConnectedClient = {
      ws,
      sub: { sport, league },
      connectedAt: Date.now(),
      id,
    };

    clients.set(id, client);
    setConnectedClients(clients.size);
    logger.info({ id, sport, league }, "WebSocket client connected");

    ws.send(
      JSON.stringify({
        type: "connected",
        clientId: id,
        subscription: { sport, league },
        message: "Connected to SportStream API. You will receive live score updates.",
      }),
    );

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (msg["type"] === "subscribe") {
          client.sub.sport = (msg["sport"] as string) ?? client.sub.sport;
          client.sub.league = (msg["league"] as string) ?? client.sub.league;
          ws.send(
            JSON.stringify({
              type: "subscribed",
              subscription: client.sub,
            }),
          );
          logger.info({ id, sub: client.sub }, "Client updated subscription");
        } else if (msg["type"] === "ping") {
          ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      clients.delete(id);
      setConnectedClients(clients.size);
      logger.info({ id }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err, id }, "WebSocket error");
      clients.delete(id);
      setConnectedClients(clients.size);
    });
  });

  return wss;
}

export function broadcastScoreUpdate(sport: string, league: string, matches: Match[]) {
  const payload = JSON.stringify({
    type: "score_update",
    sport,
    league,
    ts: new Date().toISOString(),
    matchCount: matches.length,
    matches,
  });

  let sent = 0;
  for (const client of clients.values()) {
    const { sub, ws } = client;
    if (ws.readyState !== WebSocket.OPEN) continue;
    const sportMatch = !sub.sport || sub.sport === sport;
    const leagueMatch = !sub.league || sub.league === league;
    if (sportMatch && leagueMatch) {
      ws.send(payload);
      sent++;
    }
  }

  if (sent > 0) {
    logger.info({ sport, league, sent, matches: matches.length }, "Broadcasted score update");
  }
}

export function getConnectedClientCount(): number {
  return clients.size;
}

export function getClientList() {
  return Array.from(clients.values()).map((c) => ({
    id: c.id,
    sport: c.sub.sport ?? "all",
    league: c.sub.league ?? "all",
    connectedAt: new Date(c.connectedAt).toISOString(),
  }));
}
