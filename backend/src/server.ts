import { handleHttpRoute } from "./routes/http-routes";
import { jsonHeaders, errorJson, ApiError } from "./utils/http";
import { bearerToken } from "./middleware/auth";
import { authService } from "./services/auth-service";
import { resolveBindHost } from "./config";

const port = Number(process.env.HERMES_API_PORT ?? 8787);
const hostname = resolveBindHost();
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
  hostname,
  async fetch(request, server) {
    if (request.method === "OPTIONS") return new Response(null, { headers: jsonHeaders });

    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const token = bearerToken(request);
      const authenticated = token ? await authService.authenticate(token) : null;
      if (!authenticated)
        return errorJson(new ApiError(401, "UNAUTHORIZED", "Sessão inválida para WebSocket."));
      const upgraded = server.upgrade(request, { data: { authenticated: true } });
      return upgraded
        ? undefined
        : errorJson(new ApiError(400, "WEBSOCKET_UPGRADE_FAILED", "Falha ao abrir WebSocket."));
    }

    try {
      const response = await handleHttpRoute(request, publish, {
        clientIp: server.requestIP(request)?.address ?? "unknown",
      });
      return response ?? errorJson(new ApiError(404, "NOT_FOUND", "Endpoint não encontrado."));
    } catch (error) {
      if (!(error instanceof ApiError)) console.error(error);
      return errorJson(error instanceof Error ? error : new Error("Internal server error"));
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

console.log(`Hermes Mobile API running at http://${hostname}:${server.port}`);
