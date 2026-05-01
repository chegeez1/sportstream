import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { createWss } from "./lib/websocket";
import { startPoller } from "./lib/poller";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
const wss = createWss();

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://localhost`);
  if (url.pathname === "/api/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  logger.info({ port }, "Server listening");
  startPoller();
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
