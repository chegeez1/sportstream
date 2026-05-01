/**
 * Derives the API base URL from the current page's origin so the docs
 * work on any domain — dev, staging, or production — without changes.
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

/** Returns just the current host (e.g. "example.replit.app") */
export function getHost(): string {
  if (typeof window === "undefined") return "localhost";
  return window.location.host;
}
