interface EndpointStat {
  hits: number;
  errors: number;
  lastHit?: number;
}

interface StatsStore {
  startedAt: number;
  totalRequests: number;
  totalErrors: number;
  endpoints: Record<string, EndpointStat>;
  connectedClients: number;
  lastPollAt?: number;
  nextPollAt?: number;
  pollCount: number;
  pollErrors: number;
}

const store: StatsStore = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  endpoints: {},
  connectedClients: 0,
  pollCount: 0,
  pollErrors: 0,
};

export function recordRequest(path: string, isError = false) {
  store.totalRequests++;
  if (isError) store.totalErrors++;
  const key = normalizePath(path);
  if (!store.endpoints[key]) {
    store.endpoints[key] = { hits: 0, errors: 0 };
  }
  store.endpoints[key]!.hits++;
  store.endpoints[key]!.lastHit = Date.now();
  if (isError) store.endpoints[key]!.errors++;
}

export function setConnectedClients(count: number) {
  store.connectedClients = count;
}

export function recordPoll(success: boolean, nextPollAt: number) {
  store.lastPollAt = Date.now();
  store.nextPollAt = nextPollAt;
  store.pollCount++;
  if (!success) store.pollErrors++;
}

export function getStats() {
  const uptimeMs = Date.now() - store.startedAt;
  return {
    uptime: formatUptime(uptimeMs),
    uptimeMs,
    startedAt: new Date(store.startedAt).toISOString(),
    requests: {
      total: store.totalRequests,
      errors: store.totalErrors,
      successRate:
        store.totalRequests === 0
          ? 100
          : Math.round(((store.totalRequests - store.totalErrors) / store.totalRequests) * 100),
    },
    websocket: {
      connectedClients: store.connectedClients,
    },
    polling: {
      count: store.pollCount,
      errors: store.pollErrors,
      lastPollAt: store.lastPollAt ? new Date(store.lastPollAt).toISOString() : null,
      nextPollAt: store.nextPollAt ? new Date(store.nextPollAt).toISOString() : null,
    },
    endpoints: Object.entries(store.endpoints)
      .sort((a, b) => b[1].hits - a[1].hits)
      .map(([path, stat]) => ({
        path,
        hits: stat.hits,
        errors: stat.errors,
        lastHit: stat.lastHit ? new Date(stat.lastHit).toISOString() : null,
      })),
  };
}

function normalizePath(path: string): string {
  return path
    .replace(/\/\d+/g, "/:id")
    .replace(/\?.*$/, "");
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
