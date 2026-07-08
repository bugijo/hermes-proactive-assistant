import { promotionCategories } from "../../../src/services/mock-hermes-data";
import { db } from "../database";
import { requireAuth, bearerToken } from "../middleware/auth";
import { domainRepository } from "../repositories/domain-repository";
import { taskRepository } from "../repositories/task-repository";
import { nativeRepository } from "../repositories/native-repository";
import { authService } from "../services/auth-service";
import { deviceService } from "../services/device-service";
import { ApiError, json } from "../utils/http";
import { enforceRateLimit } from "../middleware/rate-limit";
import { schemas, validatedJson } from "../utils/validation";

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
  context: { clientIp: string } = { clientIp: "local" },
) {
  const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  const method = request.method;
  enforceRateLimit("general", context.clientIp);

  if (method === "GET" && path === "/health")
    return json({ ok: true, service: "hermes-mobile-api" });
  if (method === "GET" && path === "/api/auth/status") return json(authService.status());
  if (method === "POST" && path === "/api/auth/register") {
    enforceRateLimit("register", context.clientIp);
    return json(
      await authService.registerFirstUser(await validatedJson(request, schemas.register)),
      {
        status: 201,
      },
    );
  }
  if (method === "POST" && path === "/api/auth/login") {
    enforceRateLimit("login", context.clientIp);
    return json(await authService.login(await validatedJson(request, schemas.login)));
  }
  if (method === "POST" && path === "/api/pairing/claim") {
    enforceRateLimit("pairingClaim", context.clientIp);
    return json(
      await deviceService.claimPairingToken(await validatedJson(request, schemas.pairingClaim)),
      {
        status: 201,
      },
    );
  }

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
      const item = domainRepository.createSuggestion(
        await validatedJson(request, schemas.suggestionCreate),
      );
      audit("suggestion.created", "suggestions", item.id, "draft");
      return json(item, { status: 201 });
    }
  }
  const suggestionId = resourceId(path, "suggestions");
  if (suggestionId && (method === "PATCH" || method === "PUT")) {
    const body = await validatedJson(request, schemas.suggestionUpdate);
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
    await validatedJson(request, schemas.confirmedDelete);
    domainRepository.deleteSuggestion(suggestionId);
    audit("suggestion.deleted", "suggestions", suggestionId);
    return json({ ok: true });
  }

  if (path === "/api/promotions") {
    if (method === "GET")
      return json({ categories: promotionCategories, offers: domainRepository.promotions() });
    if (method === "POST") {
      const item = domainRepository.createPromotion(
        await validatedJson(request, schemas.promotionCreate),
      );
      audit("promotion.created", "promotions", item.id, "confirmed");
      return json(item, { status: 201 });
    }
  }
  const promotionId = resourceId(path, "promotions");
  if (promotionId && (method === "PATCH" || method === "PUT")) {
    const item = domainRepository.updatePromotion(
      promotionId,
      await validatedJson(request, schemas.promotionUpdate),
    );
    audit("promotion.updated", "promotions", promotionId);
    return json(item);
  }
  if (promotionId && method === "DELETE") {
    await validatedJson(request, schemas.confirmedDelete);
    domainRepository.deletePromotion(promotionId);
    audit("promotion.deleted", "promotions", promotionId);
    return json({ ok: true });
  }

  if (path === "/api/automations") {
    if (method === "GET") return json(domainRepository.automations());
    if (method === "POST") {
      const item = domainRepository.createAutomation(
        await validatedJson(request, schemas.automationCreate),
      );
      audit("automation.created", "automations", item.id, "draft");
      return json(item, { status: 201 });
    }
  }
  const automationId = resourceId(path, "automations");
  if (automationId && (method === "PATCH" || method === "PUT")) {
    const body = await validatedJson(request, schemas.automationUpdate);
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
    await validatedJson(request, schemas.confirmedDelete);
    domainRepository.deleteAutomation(automationId);
    audit("automation.deleted", "automations", automationId);
    return json({ ok: true });
  }

  if (path === "/api/permissions") {
    if (method === "GET") return json(domainRepository.permissions());
    if (method === "POST") {
      const item = domainRepository.createPermission(
        await validatedJson(request, schemas.permissionCreate),
      );
      audit("permission.created", "permissions", item.id);
      return json(item, { status: 201 });
    }
  }
  const permissionId = resourceId(path, "permissions");
  if (permissionId && (method === "PATCH" || method === "PUT")) {
    const body = await validatedJson(request, schemas.permissionUpdate);
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
    await validatedJson(request, schemas.confirmedDelete);
    domainRepository.deletePermission(permissionId);
    audit("permission.deleted", "permissions", permissionId);
    return json({ ok: true });
  }

  if (path === "/api/security-settings") {
    if (method === "GET") return json(domainRepository.securitySettings());
    if (method === "POST")
      throw new ApiError(
        409,
        "SECURITY_POLICY_READ_ONLY",
        "Políticas de segurança são somente leitura.",
      );
  }
  const securityId = resourceId(path, "security-settings");
  if (securityId && (method === "PATCH" || method === "PUT")) {
    await validatedJson(request, schemas.securityUpdate);
    throw new ApiError(
      409,
      "SECURITY_POLICY_READ_ONLY",
      "Políticas de segurança são somente leitura.",
    );
  }
  if (securityId && method === "DELETE") {
    await validatedJson(request, schemas.confirmedDelete);
    throw new ApiError(
      409,
      "SECURITY_POLICY_READ_ONLY",
      "Políticas de segurança são somente leitura.",
    );
  }

  if (path === "/api/chat") {
    if (method === "GET") return json(domainRepository.chatMessages());
    if (method === "POST") {
      const body = await validatedJson(request, schemas.chatCreate);
      const text = body.text;
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
    const body = await validatedJson(request, schemas.chatUpdate);
    const item = domainRepository.updateChatMessage(chatId, body);
    audit("chat.message.updated", "chat_messages", chatId, confirmation(body.confirmationStatus));
    return json(item);
  }
  if (chatId && method === "DELETE") {
    await validatedJson(request, schemas.confirmedDelete);
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
  if (method === "POST" && path === "/api/pairing-tokens") {
    enforceRateLimit("pairingToken", context.clientIp);
    const body = await validatedJson(request, schemas.pairingTokenCreate);
    const ttlSeconds = process.env.NODE_ENV === "test" ? body.ttlSeconds : undefined;
    return json(await deviceService.createPairingToken(auth.user.id, ttlSeconds), {
      status: 201,
    });
  }
  const expirePairingId = path.match(/^\/api\/pairing-tokens\/([^/]+)\/expire$/)?.[1];
  if (expirePairingId && method === "POST") {
    deviceService.expirePairingToken(expirePairingId);
    audit("pairing.token.expired", "pairing_tokens", expirePairingId);
    return json({ ok: true });
  }
  if (method === "POST" && path === "/api/devices/pairing-code") {
    enforceRateLimit("pairingToken", context.clientIp);
    return json(await deviceService.createPairingToken(auth.user.id), { status: 201 });
  }
  if (method === "POST" && path === "/api/devices/claim") {
    enforceRateLimit("pairingClaim", context.clientIp);
    return json(
      await deviceService.claimPairingToken(await validatedJson(request, schemas.pairingClaim)),
      { status: 201 },
    );
  }
  const approveDeviceId = path.match(/^\/api\/devices\/([^/]+)\/approve$/)?.[1];
  if (approveDeviceId && method === "POST") {
    await validatedJson(request, schemas.confirmedDelete);
    return json(deviceService.approveDevice(auth.user.id, approveDeviceId));
  }
  const deviceId = resourceId(path, "devices");
  if (deviceId && method === "DELETE") {
    await validatedJson(request, schemas.confirmedDelete);
    return json(deviceService.revokeDevice(auth.user.id, deviceId));
  }
  if (method === "GET" && path === "/api/tasks") return json(taskRepository.listTasks());
  if (method === "POST" && path === "/api/tasks") {
    const item = taskRepository.createTask(await validatedJson(request, schemas.taskCreate));
    audit("task.created", "tasks", item.id, "draft");
    return json(item, { status: 201 });
  }
  const taskId = resourceId(path, "tasks");
  if (taskId && (method === "PATCH" || method === "PUT")) {
    const item = taskRepository.updateTask(
      taskId,
      await validatedJson(request, schemas.taskUpdate),
    );
    if (!item) throw new ApiError(404, "NOT_FOUND", "Tarefa não encontrada.");
    audit("task.updated", "tasks", taskId);
    return json(item);
  }
  if (taskId && method === "DELETE") {
    await validatedJson(request, schemas.confirmedDelete);
    taskRepository.deleteTask(taskId);
    audit("task.deleted", "tasks", taskId, "confirmed");
    return json({ ok: true });
  }
  if (method === "GET" && path === "/api/notifications")
    return json(taskRepository.listNotifications());
  if (method === "POST" && path === "/api/notifications") {
    const body = await validatedJson(request, schemas.notificationCreate);
    const item = nativeRepository.createNotification({
      title: body.title,
      description: body.description,
      type: body.type,
      scheduledFor: body.scheduledFor,
    });
    audit("notification.created", "notifications", item.id, "confirmed", { type: body.type });
    return json(item, { status: 201 });
  }
  const notificationRead = path.match(/^\/api\/notifications\/([^/]+)\/read$/)?.[1];
  if (notificationRead && method === "POST") {
    taskRepository.markNotificationRead(notificationRead);
    audit("notification.read", "notifications", notificationRead);
    return json({ ok: true });
  }

  if (path === "/api/preferences/notifications") {
    if (method === "GET") return json(nativeRepository.preferences(auth.user.id));
    if (method === "PUT" || method === "PATCH") {
      const item = nativeRepository.savePreferences(
        auth.user.id,
        await validatedJson(request, schemas.preferences),
      );
      audit(
        "notification_preferences.updated",
        "notification_preferences",
        auth.user.id,
        "confirmed",
        item,
      );
      return json(item);
    }
  }

  if (method === "POST" && path === "/api/native-actions") {
    const body = await validatedJson(request, schemas.nativeAction);
    const unavailable = new Set([
      "send_message",
      "purchase",
      "delete_file",
      "remote_command",
      "control_screen",
    ]);
    if (unavailable.has(body.action)) {
      audit("native_action.blocked", "native_action_requests", undefined, "pending_confirmation", {
        action: body.action,
      });
      throw new ApiError(403, "ACTION_NOT_AVAILABLE", "Esta ação não está disponível nesta fase.");
    }
    if (body.action === "open_app" && body.confirmationStatus !== "confirmed") {
      audit(
        "native_action.confirmation_required",
        "native_action_requests",
        undefined,
        "pending_confirmation",
        { action: body.action },
      );
      throw new ApiError(
        409,
        "CONFIRMATION_REQUIRED",
        "Confirmação explícita é obrigatória para abrir aplicativos.",
      );
    }
    const item = nativeRepository.createNativeAction({
      userId: auth.user.id,
      action: body.action,
      payload: body.payload,
      confirmationStatus: body.confirmationStatus ?? "draft",
    });
    audit(
      "native_action.recorded",
      "native_action_requests",
      item.id,
      confirmation(body.confirmationStatus),
      { action: body.action },
    );
    return json(item, { status: 201 });
  }

  if (method === "POST" && path === "/api/action-logs") {
    const body = await validatedJson(request, schemas.clientNote);
    return json(
      domainRepository.logAction({
        userId: auth.user.id,
        action: "client.note.created",
        entityType: "client_notes",
        sensitivity: "normal",
        confirmationStatus: "draft",
        details: { source: "client", message: body.message, context: body.context },
      }),
      { status: 201 },
    );
  }

  throw new ApiError(404, "NOT_FOUND", "Endpoint não encontrado.");
}
