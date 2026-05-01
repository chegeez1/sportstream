import { logger } from "./logger";
import { recordPoll } from "./stats";
import { broadcastScoreUpdate } from "./websocket";
import { SPORTS_CONFIG, getScoreboard, type Sport } from "./espn";

const POLL_INTERVAL_MS = 30_000;

let pollTimer: ReturnType<typeof setTimeout> | null = null;

async function pollAll() {
  const sports = Object.keys(SPORTS_CONFIG) as Sport[];
  let success = true;

  for (const sport of sports) {
    const leagues = Object.keys(SPORTS_CONFIG[sport].leagues);
    for (const league of leagues) {
      try {
        const matches = await getScoreboard(sport, league);
        broadcastScoreUpdate(sport, league, matches);
      } catch (err) {
        logger.error({ err, sport, league }, "Poll error");
        success = false;
      }
    }
  }

  const nextPollAt = Date.now() + POLL_INTERVAL_MS;
  recordPoll(success, nextPollAt);

  pollTimer = setTimeout(pollAll, POLL_INTERVAL_MS);
}

export function startPoller() {
  logger.info({ intervalMs: POLL_INTERVAL_MS }, "Starting live score poller");
  pollAll().catch((err) => logger.error({ err }, "Initial poll failed"));
}

export function stopPoller() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
    logger.info("Poller stopped");
  }
}
