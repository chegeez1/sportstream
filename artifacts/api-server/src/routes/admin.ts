import { Router } from "express";
import { getStats } from "../lib/stats";
import { getClientList, getConnectedClientCount } from "../lib/websocket";
import { SPORTS_CONFIG } from "../lib/espn";

const router = Router();

router.get("/admin/stats", (_req, res) => {
  const stats = getStats();
  res.json({ stats });
});

router.get("/admin/clients", (_req, res) => {
  const clients = getClientList();
  res.json({
    count: getConnectedClientCount(),
    clients,
  });
});

router.get("/admin/config", (_req, res) => {
  const config = Object.entries(SPORTS_CONFIG).map(([sport, data]) => ({
    sport,
    label: data.label,
    leagues: Object.entries(data.leagues).map(([id, name]) => ({ id, name })),
  }));
  res.json({ sports: config, pollIntervalSeconds: 30 });
});

export default router;
