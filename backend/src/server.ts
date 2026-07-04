import { handleHttpRoute } from "./routes/http-routes";
import { jsonHeaders, json } from "./utils/http";

const port = Number(process.env.HERMES_API_PORT ?? 8787);
const sockets = new Set<ServerWebSocket>();
type ServerWebSocket = Parameters<
  NonNullable<Parameters<typeof Bun.serve>[0]["websocket"]>["open"]
>[0];

function publish(topic: string, payload: unknown) {
  const message = JSON.stringify({ topic, payload, createdAt: new Date().toISOString() });
  for (const socket of sockets) socket.send(message);
}

const server = Bun.serve<{ authenticated?: boolean }>({
  port,
  async fetch(request, server) {
    if (request.method === "OPTIONS") return new Response(null, { headers: jsonHeaders });

    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(request, { data: { authenticated: true } });
      return upgraded ? undefined : json({ error: "WebSocket upgrade failed" }, { status: 400 });
    }

    try {
      const response = await handleHttpRoute(request, publish);
      return response ?? json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Internal server error";
      const status =
        message.includes("INVALID") || message.includes("MISSING") || message.includes("EXISTS")
          ? 400
          : 500;
      return json({ error: message }, { status });
    }
  },
  websocket: {
    open(socket) {
      sockets.add(socket);
      socket.send(
        JSON.stringify({
          topic: "connection",
          payload: { ok: true },
          createdAt: new Date().toISOString(),
        }),
      );
    },
    message(socket, message) {
      publish("client.message", { message: String(message) });
      socket.send(
        JSON.stringify({
          topic: "typing",
          payload: { role: "hermes", typing: false },
          createdAt: new Date().toISOString(),
        }),
      );
    },
    close(socket) {
      sockets.delete(socket);
    },
  },
});

console.log(`Hermes Mobile API running at http://localhost:${server.port}`);
