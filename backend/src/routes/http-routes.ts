import { promotionCategories, user } from "../../../src/services/mock-hermes-data";
import { repositories } from "../database";
import type { ChatMessage } from "../../../src/types/hermes";
import { authService } from "../services/auth-service";
import { deviceService } from "../services/device-service";
import { taskRepository } from "../repositories/task-repository";
import { json, readJson } from "../utils/http";

function snapshot() {
  return {
    user,
    status: repositories.status(),
    suggestions: repositories.suggestions(),
    offers: repositories.promotions(),
    promotionCategories,
    automations: repositories.automations(),
    devicePermissions: repositories.permissions(),
    pc: repositories.pcStatus(),
    securitySettings: repositories.securitySettings(),
    initialChat: repositories.chatMessages(),
    metrics: taskRepository.metrics(),
    tasks: taskRepository.listTasks(),
    devices: deviceService.listDevices(),
    notifications: taskRepository.listNotifications(),
  };
}

export async function handleHttpRoute(
  request: Request,
  publish: (topic: string, payload: unknown) => void,
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "GET" && path === "/health")
    return json({ ok: true, service: "hermes-mobile-api" });

  if (request.method === "GET" && path === "/api/auth/status") return json(authService.status());
  if (request.method === "POST" && path === "/api/auth/register")
    return json(await authService.registerFirstUser(await readJson(request)), { status: 201 });
  if (request.method === "POST" && path === "/api/auth/login")
    return json(await authService.login(await readJson(request)));
  if (request.method === "POST" && path === "/api/auth/unlock")
    return json(await authService.unlock(await readJson(request)));

  if (request.method === "GET" && path === "/api/snapshot") return json(snapshot());
  if (request.method === "GET" && path === "/api/status") return json(repositories.status());
  if (request.method === "GET" && path === "/api/dashboard") return json(taskRepository.metrics());
  if (request.method === "GET" && path === "/api/suggestions")
    return json(repositories.suggestions());
  if (request.method === "GET" && path === "/api/promotions")
    return json({ categories: promotionCategories, offers: repositories.promotions() });
  if (request.method === "GET" && path === "/api/automations")
    return json(repositories.automations());
  if (request.method === "GET" && path === "/api/permissions")
    return json(repositories.permissions());
  if (request.method === "GET" && path === "/api/chat") return json(repositories.chatMessages());
  if (request.method === "GET" && path === "/api/pc") return json(repositories.pcStatus());
  if (request.method === "GET" && path === "/api/pc/sync") {
    repositories.logAction({
      action: "pc.sync.requested",
      entityType: "device",
      entityId: "hermes-pc-local",
    });
    publish("sync", { type: "sync", pc: repositories.pcStatus() });
    return json({ ok: true, pc: repositories.pcStatus() });
  }
  if (request.method === "GET" && path === "/api/action-logs")
    return json(repositories.actionLogs());

  if (request.method === "GET" && path === "/api/devices") return json(deviceService.listDevices());
  if (request.method === "POST" && path === "/api/devices/pairing-code")
    return json(deviceService.createPairingCode(), { status: 201 });
  if (request.method === "POST" && path === "/api/devices/claim")
    return json(await deviceService.claimPairingCode(await readJson(request)), { status: 201 });
  if (request.method === "DELETE" && path.startsWith("/api/devices/")) {
    const id = path.split("/").at(-1)!;
    repositories.logAction({
      action: "device.revoked",
      entityType: "devices",
      entityId: id,
      sensitivity: "high",
      requiresConfirmation: true,
      confirmed: true,
    });
    return json(deviceService.revokeDevice(id));
  }

  if (request.method === "GET" && path === "/api/tasks") return json(taskRepository.listTasks());
  if (request.method === "POST" && path === "/api/tasks")
    return json(taskRepository.createTask(await readJson(request)), { status: 201 });
  if ((request.method === "PUT" || request.method === "PATCH") && path.startsWith("/api/tasks/")) {
    const updated = taskRepository.updateTask(path.split("/").at(-1)!, await readJson(request));
    return updated ? json(updated) : json({ error: "Task not found" }, { status: 404 });
  }
  if (request.method === "DELETE" && path.startsWith("/api/tasks/")) {
    const id = path.split("/").at(-1)!;
    repositories.logAction({
      action: "task.deleted",
      entityType: "tasks",
      entityId: id,
      sensitivity: "normal",
      requiresConfirmation: true,
      confirmed: true,
    });
    taskRepository.deleteTask(id);
    return json({ ok: true });
  }

  if (request.method === "GET" && path === "/api/notifications")
    return json(taskRepository.listNotifications());
  if (
    request.method === "POST" &&
    path.startsWith("/api/notifications/") &&
    path.endsWith("/read")
  ) {
    const id = path.split("/").at(-2)!;
    taskRepository.markNotificationRead(id);
    return json({ ok: true });
  }

  if (request.method === "POST" && path === "/api/chat") {
    const body = await readJson<{ text?: string; confirmed?: boolean; sessionId?: string }>(
      request,
    );
    const text = body.text?.trim();
    if (!text) return json({ error: "Text is required" }, { status: 400 });

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    const hermesMessage: ChatMessage = {
      id: `h-${Date.now()}`,
      role: "hermes",
      text: "Recebi pela API local. Vou preparar a ação e pedir confirmação antes de qualquer etapa sensível.",
    };
    repositories.addChatMessage(userMessage);
    repositories.addChatMessage(hermesMessage);
    repositories.logAction({
      action: "chat.message.created",
      entityType: "chat_messages",
      entityId: hermesMessage.id,
      sensitivity: "low",
      requiresConfirmation: false,
      confirmed: Boolean(body.confirmed),
      details: { source: "local-api", sessionId: body.sessionId ?? "default" },
    });
    publish("chat", { type: "chat.message", message: hermesMessage });
    return json(hermesMessage, { status: 201 });
  }

  if (request.method === "POST" && path === "/api/action-logs") {
    const body = await readJson<{
      action?: string;
      entityType?: string;
      entityId?: string;
      sensitivity?: string;
      requiresConfirmation?: boolean;
      confirmed?: boolean;
      details?: unknown;
    }>(request);
    if (!body.action) return json({ error: "Action is required" }, { status: 400 });
    const id = repositories.logAction({
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      sensitivity: body.sensitivity,
      requiresConfirmation: body.requiresConfirmation,
      confirmed: body.confirmed,
      details: body.details,
    });
    return json({ id }, { status: 201 });
  }

  return null;
}
