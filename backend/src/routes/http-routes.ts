import { promotionCategories } from "../../../src/services/mock-hermes-data";
import { db } from "../database";
import { requireAuth, bearerToken } from "../middleware/auth";
import { domainRepository } from "../repositories/domain-repository";
import { taskRepository } from "../repositories/task-repository";
import { authService } from "../services/auth-service";
import { deviceService } from "../services/device-service";
import { ApiError, json, readJson } from "../utils/http";

const resourceId = (path: string, resource: string) => {
  const match = path.match(new RegExp(`^/api/${resource}/([^/]+)$`));
  return match?.[1];
};
const confirmation = (value: unknown): "draft" | "pending_confirmation" | "confirmed" =>
  value === "draft" || value === "pending_confirmation" || value === "confirmed"
    ? value
    : "confirmed";

function pcStatus() {
  const row = db
    .query(
      "SELECT connected,ip,last_sync AS lastSync,metadata FROM devices WHERE id='hermes-pc-local'",
    )
    .get() as { connected: number; ip?: string; lastSync?: string; metadata?: string } | null;
  const metadata = row?.metadata ? JSON.parse(row.metadata) : { tasks: [], modules: [] };
  return {
    connected: Boolean(row?.connected),
    ip: row?.ip ?? "local",
    lastSync: row?.lastSync ?? "nunca",
    tasks: metadata.tasks ?? [],
    modules: metadata.modules ?? [],
  };
}

function snapshot(user: { name: string }) {
  return {
    user: { name: user.name },
    status: domainRepository.status(),
    suggestions: domainRepository.suggestions(),
    offers: domainRepository.promotions(),
    promotionCategories,
    automations: domainRepository.automations(),
    devicePermissions: domainRepository.permissions(),
    pc: pcStatus(),
    securitySettings: domainRepository.securitySettings(),
    initialChat: domainRepository.chatMessages(),
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
  const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  const method = request.method;

  if (method === "GET" && path === "/health")
    return json({ ok: true, service: "hermes-mobile-api" });
  if (method === "GET" && path === "/api/auth/status") return json(authService.status());
  if (method === "POST" && path === "/api/auth/register")
    return json(await authService.registerFirstUser(await readJson(request)), { status: 201 });
  if (method === "POST" && path === "/api/auth/login")
    return json(await authService.login(await readJson(request)));

  const auth = await requireAuth(request);
  const audit = (
    action: string,
    entityType?: string,
    entityId?: string,
    confirmationStatus: "draft" | "pending_confirmation" | "confirmed" = "confirmed",
    details?: unknown,
  ) =>
    domainRepository.logAction({
      userId: auth.user.id,
      action,
      entityType,
      entityId,
      confirmationStatus,
      details,
    });

  if (method === "POST" && path === "/api/auth/logout") {
    await authService.logout(bearerToken(request)!);
    return json({ ok: true });
  }
  if (method === "GET" && path === "/api/snapshot") return json(snapshot(auth.user));
  if (method === "GET" && path === "/api/status") return json(domainRepository.status());
  if (method === "GET" && path === "/api/dashboard") return json(taskRepository.metrics());

  if (path === "/api/suggestions") {
    if (method === "GET") return json(domainRepository.suggestions());
    if (method === "POST") {
      const item = domainRepository.createSuggestion(await readJson(request));
      audit("suggestion.created", "suggestions", item.id, "draft");
      return json(item, { status: 201 });
    }
  }
  const suggestionId = resourceId(path, "suggestions");
  if (suggestionId && (method === "PATCH" || method === "PUT")) {
    const body = await readJson<Record<string, unknown>>(request);
    const item = domainRepository.updateSuggestion(suggestionId, body);
    audit(
      "suggestion.updated",
      "suggestions",
      suggestionId,
      confirmation(body.confirmationStatus),
      { state: body.state },
    );
    return json(item);
  }
  if (suggestionId && method === "DELETE") {
    domainRepository.deleteSuggestion(suggestionId);
    audit("suggestion.deleted", "suggestions", suggestionId);
    return json({ ok: true });
  }

  if (path === "/api/promotions") {
    if (method === "GET")
      return json({ categories: promotionCategories, offers: domainRepository.promotions() });
    if (method === "POST") {
      const item = domainRepository.createPromotion(await readJson(request));
      audit("promotion.created", "promotions", item.id, "confirmed");
      return json(item, { status: 201 });
    }
  }
  const promotionId = resourceId(path, "promotions");
  if (promotionId && (method === "PATCH" || method === "PUT")) {
    const item = domainRepository.updatePromotion(promotionId, await readJson(request));
    audit("promotion.updated", "promotions", promotionId);
    return json(item);
  }
  if (promotionId && method === "DELETE") {
    domainRepository.deletePromotion(promotionId);
    audit("promotion.deleted", "promotions", promotionId);
    return json({ ok: true });
  }

  if (path === "/api/automations") {
    if (method === "GET") return json(domainRepository.automations());
    if (method === "POST") {
      const item = domainRepository.createAutomation(await readJson(request));
      audit("automation.created", "automations", item.id, "draft");
      return json(item, { status: 201 });
    }
  }
  const automationId = resourceId(path, "automations");
  if (automationId && (method === "PATCH" || method === "PUT")) {
    const body = await readJson<Record<string, unknown>>(request);
    const item = domainRepository.updateAutomation(automationId, body);
    audit(
      "automation.updated",
      "automations",
      automationId,
      confirmation(body.confirmationStatus),
      { enabled: body.enabled },
    );
    return json(item);
  }
  if (automationId && method === "DELETE") {
    domainRepository.deleteAutomation(automationId);
    audit("automation.deleted", "automations", automationId);
    return json({ ok: true });
  }

  if (path === "/api/permissions") {
    if (method === "GET") return json(domainRepository.permissions());
    if (method === "POST") {
      const item = domainRepository.createPermission(await readJson(request));
      audit("permission.created", "permissions", item.id);
      return json(item, { status: 201 });
    }
  }
  const permissionId = resourceId(path, "permissions");
  if (permissionId && (method === "PATCH" || method === "PUT")) {
    const body = await readJson<Record<string, unknown>>(request);
    const item = domainRepository.updatePermission(permissionId, body);
    audit(
      "permission.updated",
      "permissions",
      permissionId,
      confirmation(body.confirmationStatus),
      { granted: body.granted },
    );
    return json(item);
  }
  if (permissionId && method === "DELETE") {
    domainRepository.deletePermission(permissionId);
    audit("permission.deleted", "permissions", permissionId);
    return json({ ok: true });
  }

  if (path === "/api/security-settings") {
    if (method === "GET") return json(domainRepository.securitySettings());
    if (method === "POST") {
      const item = domainRepository.createSecuritySetting(await readJson(request));
      audit("security_setting.created", "security_settings", item.id);
      return json(item, { status: 201 });
    }
  }
  const securityId = resourceId(path, "security-settings");
  if (securityId && (method === "PATCH" || method === "PUT")) {
    const body = await readJson<Record<string, unknown>>(request);
    const item = domainRepository.updateSecuritySetting(securityId, body);
    audit(
      "security_setting.updated",
      "security_settings",
      securityId,
      confirmation(body.confirmationStatus),
      { enabled: body.enabled },
    );
    return json(item);
  }
  if (securityId && method === "DELETE") {
    domainRepository.deleteSecuritySetting(securityId);
    audit("security_setting.deleted", "security_settings", securityId);
    return json({ ok: true });
  }

  if (path === "/api/chat") {
    if (method === "GET") return json(domainRepository.chatMessages());
    if (method === "POST") {
      const body = await readJson<{
        text?: string;
        sessionId?: string;
        confirmationStatus?: "draft" | "pending_confirmation" | "confirmed";
      }>(request);
      const text = body.text?.trim();
      if (!text) throw new ApiError(400, "TEXT_REQUIRED", "A mensagem não pode ficar vazia.");
      const userMessage = domainRepository.addChatMessage({
        role: "user",
        text,
        sessionId: body.sessionId,
        confirmationStatus: body.confirmationStatus ?? "draft",
      });
      const reply = domainRepository.addChatMessage({
        role: "hermes",
        text: "Recebi. A solicitação ficou como rascunho local; qualquer ação sensível exigirá sua confirmação.",
        sessionId: body.sessionId,
        confirmationStatus: "draft",
      });
      audit(
        "chat.message.created",
        "chat_messages",
        userMessage.id,
        body.confirmationStatus ?? "draft",
      );
      publish("chat", { type: "chat.message", message: reply });
      return json(reply, { status: 201 });
    }
  }
  const chatId = resourceId(path, "chat");
  if (chatId && (method === "PATCH" || method === "PUT")) {
    const body = await readJson<Record<string, unknown>>(request);
    const item = domainRepository.updateChatMessage(chatId, body);
    audit("chat.message.updated", "chat_messages", chatId, confirmation(body.confirmationStatus));
    return json(item);
  }
  if (chatId && method === "DELETE") {
    domainRepository.deleteChatMessage(chatId);
    audit("chat.message.deleted", "chat_messages", chatId);
    return json({ ok: true });
  }

  if (method === "GET" && path === "/api/action-logs") return json(domainRepository.actionLogs());
  if (method === "GET" && path === "/api/pc") return json(pcStatus());
  if (method === "GET" && path === "/api/pc/sync") {
    audit("pc.sync.requested", "devices", "hermes-pc-local", "pending_confirmation");
    return json({ ok: true, status: "pending_confirmation", pc: pcStatus() });
  }
  if (method === "GET" && path === "/api/devices") return json(deviceService.listDevices());
  if (method === "POST" && path === "/api/devices/pairing-code") {
    const item = deviceService.createPairingCode();
    audit("device.pairing.draft_created", "pairing_codes", item.code, "draft");
    return json({ ...item, status: "draft" }, { status: 201 });
  }
  if (method === "POST" && path === "/api/devices/claim") {
    const item = await deviceService.claimPairingCode(await readJson(request));
    audit("device.pairing.claimed", "devices", item.id, "confirmed");
    return json(item, { status: 201 });
  }
  const deviceId = resourceId(path, "devices");
  if (deviceId && method === "DELETE") {
    deviceService.revokeDevice(deviceId);
    audit("device.revoked", "devices", deviceId, "confirmed");
    return json({ ok: true });
  }
  if (method === "GET" && path === "/api/tasks") return json(taskRepository.listTasks());
  if (method === "POST" && path === "/api/tasks") {
    const item = taskRepository.createTask(await readJson(request));
    audit("task.created", "tasks", item.id, "draft");
    return json(item, { status: 201 });
  }
  const taskId = resourceId(path, "tasks");
  if (taskId && (method === "PATCH" || method === "PUT")) {
    const item = taskRepository.updateTask(taskId, await readJson(request));
    if (!item) throw new ApiError(404, "NOT_FOUND", "Tarefa não encontrada.");
    audit("task.updated", "tasks", taskId);
    return json(item);
  }
  if (taskId && method === "DELETE") {
    taskRepository.deleteTask(taskId);
    audit("task.deleted", "tasks", taskId, "confirmed");
    return json({ ok: true });
  }
  if (method === "GET" && path === "/api/notifications")
    return json(taskRepository.listNotifications());
  const notificationRead = path.match(/^\/api\/notifications\/([^/]+)\/read$/)?.[1];
  if (notificationRead && method === "POST") {
    taskRepository.markNotificationRead(notificationRead);
    audit("notification.read", "notifications", notificationRead);
    return json({ ok: true });
  }

  if (method === "POST" && path === "/api/action-logs") {
    const body = await readJson<{
      action?: string;
      entityType?: string;
      entityId?: string;
      sensitivity?: string;
      confirmationStatus?: "draft" | "pending_confirmation" | "confirmed";
      details?: unknown;
    }>(request);
    if (!body.action) throw new ApiError(400, "ACTION_REQUIRED", "A ação é obrigatória.");
    return json(
      domainRepository.logAction({ ...body, action: body.action, userId: auth.user.id }),
      { status: 201 },
    );
  }

  throw new ApiError(404, "NOT_FOUND", "Endpoint não encontrado.");
}
