import { Router } from "express";
import {
  SPORTS_CONFIG,
  getAllScoreboards,
  getScoreboard,
  getMatch,
  getTeam,
  type Sport,
} from "../lib/espn";

const router = Router();

const SUPPORTED_SPORTS = Object.keys(SPORTS_CONFIG) as Sport[];

function isSport(s: string): s is Sport {
  return SUPPORTED_SPORTS.includes(s as Sport);
}

router.get("/sports", (_req, res) => {
  const sports = SUPPORTED_SPORTS.map((sport) => ({
    id: sport,
    label: SPORTS_CONFIG[sport].label,
    leagues: Object.entries(SPORTS_CONFIG[sport].leagues).map(([id, name]) => ({
      id,
      name,
    })),
  }));
  res.json({ sports });
});

router.get("/sports/:sport/leagues", (req, res) => {
  const { sport } = req.params;
  if (!sport || !isSport(sport)) {
    res.status(404).json({ error: `Sport "${sport}" not supported. Supported: ${SUPPORTED_SPORTS.join(", ")}` });
    return;
  }
  const leagues = Object.entries(SPORTS_CONFIG[sport].leagues).map(([id, name]) => ({
    id,
    name,
    sport,
  }));
  res.json({ sport, leagues });
});

router.get("/sports/:sport/scoreboard", async (req, res) => {
  const { sport } = req.params;
  const { league } = req.query as { league?: string };

  if (!sport || !isSport(sport)) {
    res.status(404).json({ error: `Sport "${sport}" not supported.` });
    return;
  }

  let matches;
  if (league) {
    const validLeagues = Object.keys(SPORTS_CONFIG[sport].leagues);
    if (!validLeagues.includes(league)) {
      res.status(400).json({
        error: `League "${league}" not found. Available: ${validLeagues.join(", ")}`,
      });
      return;
    }
    matches = await getScoreboard(sport, league);
  } else {
    matches = await getAllScoreboards(sport);
  }

  res.json({
    sport,
    league: league ?? "all",
    fetchedAt: new Date().toISOString(),
    matchCount: matches.length,
    matches,
  });
});

router.get("/sports/:sport/matches/:matchId", async (req, res) => {
  const { sport, matchId } = req.params;
  const { league } = req.query as { league?: string };

  if (!sport || !isSport(sport)) {
    res.status(404).json({ error: `Sport "${sport}" not supported.` });
    return;
  }

  const leagueId = league ?? Object.keys(SPORTS_CONFIG[sport].leagues)[0] ?? "";
  const match = await getMatch(sport, leagueId, matchId ?? "");

  if (!match) {
    res.status(404).json({ error: `Match "${matchId}" not found.` });
    return;
  }

  res.json({ match });
});

router.get("/sports/:sport/teams/:teamId", async (req, res) => {
  const { sport, teamId } = req.params;
  const { league } = req.query as { league?: string };

  if (!sport || !isSport(sport)) {
    res.status(404).json({ error: `Sport "${sport}" not supported.` });
    return;
  }

  const leagueId = league ?? Object.keys(SPORTS_CONFIG[sport].leagues)[0] ?? "";
  const team = await getTeam(sport, leagueId, teamId ?? "");

  if (!team) {
    res.status(404).json({ error: `Team "${teamId}" not found.` });
    return;
  }

  res.json({ team });
});

export default router;
