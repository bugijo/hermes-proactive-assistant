/* eslint-disable @typescript-eslint/no-explicit-any -- SQLite rows are runtime-shaped at this repository boundary. */
import { db } from "../database";
import { ApiError } from "../utils/http";

type ConfirmationStatus = "draft" | "pending_confirmation" | "confirmed";
const json = (value: unknown) => JSON.stringify(value);
const parse = <T>(value: string | null | undefined, fallback: T): T =>
  value ? (JSON.parse(value) as T) : fallback;
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const mustExist = (changes: number, entity: string) => {
  if (!changes) throw new ApiError(404, "NOT_FOUND", `${entity} não encontrado.`);
};

export const domainRepository = {
  status() {
    const row = db.query("SELECT value FROM app_state WHERE key = 'hermes_status'").get() as {
      value: string;
    } | null;
    return parse(row?.value, { state: "Ativo", battery: 78, connection: "Wi-Fi", pending: 0 });
  },
  suggestions() {
    return db
      .query(
        "SELECT id,type,title,description,time,state,confirmation_status AS confirmationStatus FROM suggestions ORDER BY created_at DESC",
      )
      .all();
  },
  createSuggestion(input: Record<string, unknown>) {
    if (!input.title || !input.description || !input.type)
      throw new ApiError(400, "INVALID_SUGGESTION", "Tipo, título e descrição são obrigatórios.");
    const newId = id("suggestion");
    db.prepare(
      "INSERT INTO suggestions (id,type,title,description,time,state,confirmation_status) VALUES (?,?,?,?,?,'pending','draft')",
    ).run(newId, input.type, input.title, input.description, input.time ?? "agora");
    return this.suggestions().find((x: any) => x.id === newId);
  },
  updateSuggestion(itemId: string, input: Record<string, unknown>) {
    const state = String(input.state ?? "pending");
    const confirmation = String(
      input.confirmationStatus ?? (state === "approved" ? "pending_confirmation" : "confirmed"),
    );
    const result = db
      .prepare(
        "UPDATE suggestions SET state=?, confirmation_status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .run(state, confirmation, itemId);
    mustExist(result.changes, "Sugestão");
    return this.suggestions().find((x: any) => x.id === itemId);
  },
  deleteSuggestion(itemId: string) {
    mustExist(db.prepare("DELETE FROM suggestions WHERE id=?").run(itemId).changes, "Sugestão");
  },

  promotions() {
    return db
      .query(
        "SELECT id,category,name,price,target,score,status,url,confirmation_status AS confirmationStatus FROM promotions ORDER BY score DESC",
      )
      .all();
  },
  createPromotion(input: Record<string, unknown>) {
    if (!input.name || !input.category)
      throw new ApiError(400, "INVALID_PROMOTION", "Nome e categoria são obrigatórios.");
    const newId = id("promotion");
    db.prepare(
      "INSERT INTO promotions (id,category,name,price,target,score,status,url) VALUES (?,?,?,?,?,?,?,?)",
    ).run(
      newId,
      input.category,
      input.name,
      Number(input.price ?? 0),
      Number(input.target ?? 0),
      Number(input.score ?? 0),
      input.status ?? "Esperar",
      input.url ?? "#",
    );
    return this.promotions().find((x: any) => x.id === newId);
  },
  updatePromotion(itemId: string, input: Record<string, unknown>) {
    const current = this.promotions().find((x: any) => x.id === itemId) as any;
    if (!current) throw new ApiError(404, "NOT_FOUND", "Promoção não encontrada.");
    db.prepare(
      "UPDATE promotions SET category=?,name=?,price=?,target=?,score=?,status=?,url=?,confirmation_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(
      input.category ?? current.category,
      input.name ?? current.name,
      input.price ?? current.price,
      input.target ?? current.target,
      input.score ?? current.score,
      input.status ?? current.status,
      input.url ?? current.url,
      input.confirmationStatus ?? current.confirmationStatus,
      itemId,
    );
    return this.promotions().find((x: any) => x.id === itemId);
  },
  deletePromotion(itemId: string) {
    mustExist(db.prepare("DELETE FROM promotions WHERE id=?").run(itemId).changes, "Promoção");
  },

  automations() {
    return (
      db
        .query(
          "SELECT id,name,description,enabled,frequency,impact,permissions,confirmation_status AS confirmationStatus FROM automations ORDER BY id",
        )
        .all() as any[]
    ).map((x) => ({ ...x, enabled: Boolean(x.enabled), permissions: parse(x.permissions, []) }));
  },
  createAutomation(input: Record<string, unknown>) {
    if (!input.name || !input.description)
      throw new ApiError(400, "INVALID_AUTOMATION", "Nome e descrição são obrigatórios.");
    const newId = id("automation");
    db.prepare(
      "INSERT INTO automations (id,name,description,enabled,frequency,impact,permissions) VALUES (?,?,?,?,?,?,?)",
    ).run(
      newId,
      input.name,
      input.description,
      Number(Boolean(input.enabled)),
      input.frequency ?? "Manual",
      input.impact ?? "baixo",
      json(input.permissions ?? []),
    );
    return this.automations().find((x: any) => x.id === newId);
  },
  updateAutomation(itemId: string, input: Record<string, unknown>) {
    const current = this.automations().find((x: any) => x.id === itemId) as any;
    if (!current) throw new ApiError(404, "NOT_FOUND", "Automação não encontrada.");
    db.prepare(
      "UPDATE automations SET name=?,description=?,enabled=?,frequency=?,impact=?,permissions=?,confirmation_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(
      input.name ?? current.name,
      input.description ?? current.description,
      Number(input.enabled ?? current.enabled),
      input.frequency ?? current.frequency,
      input.impact ?? current.impact,
      json(input.permissions ?? current.permissions),
      input.confirmationStatus ?? current.confirmationStatus,
      itemId,
    );
    return this.automations().find((x: any) => x.id === itemId);
  },
  deleteAutomation(itemId: string) {
    mustExist(db.prepare("DELETE FROM automations WHERE id=?").run(itemId).changes, "Automação");
  },

  permissions() {
    return (
      db
        .query(
          "SELECT id,title,description,granted,confirmation_status AS confirmationStatus FROM permissions ORDER BY id",
        )
        .all() as any[]
    ).map((x) => ({ ...x, granted: Boolean(x.granted) }));
  },
  createPermission(input: Record<string, unknown>) {
    const newId = id("permission");
    db.prepare("INSERT INTO permissions (id,title,description,granted) VALUES (?,?,?,?)").run(
      newId,
      input.title,
      input.description ?? "",
      Number(Boolean(input.granted)),
    );
    return this.permissions().find((x: any) => x.id === newId);
  },
  updatePermission(itemId: string, input: Record<string, unknown>) {
    const current = this.permissions().find((x: any) => x.id === itemId) as any;
    if (!current) throw new ApiError(404, "NOT_FOUND", "Permissão não encontrada.");
    db.prepare(
      "UPDATE permissions SET granted=?,confirmation_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(
      Number(input.granted ?? current.granted),
      input.confirmationStatus ?? current.confirmationStatus,
      itemId,
    );
    return this.permissions().find((x: any) => x.id === itemId);
  },
  deletePermission(itemId: string) {
    mustExist(db.prepare("DELETE FROM permissions WHERE id=?").run(itemId).changes, "Permissão");
  },

  securitySettings() {
    return (
      db
        .query(
          "SELECT id,title,description,enabled,confirmation_status AS confirmationStatus FROM security_settings ORDER BY id",
        )
        .all() as any[]
    ).map((x) => ({ ...x, enabled: Boolean(x.enabled) }));
  },
  createSecuritySetting(input: Record<string, unknown>) {
    const newId = id("security");
    db.prepare("INSERT INTO security_settings (id,title,description,enabled) VALUES (?,?,?,?)").run(
      newId,
      input.title,
      input.description ?? "",
      Number(input.enabled ?? true),
    );
    return this.securitySettings().find((x: any) => x.id === newId);
  },
  updateSecuritySetting(itemId: string, input: Record<string, unknown>) {
    const current = this.securitySettings().find((x: any) => x.id === itemId) as any;
    if (!current) throw new ApiError(404, "NOT_FOUND", "Configuração não encontrada.");
    db.prepare(
      "UPDATE security_settings SET enabled=?,confirmation_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(
      Number(input.enabled ?? current.enabled),
      input.confirmationStatus ?? current.confirmationStatus,
      itemId,
    );
    return this.securitySettings().find((x: any) => x.id === itemId);
  },
  deleteSecuritySetting(itemId: string) {
    mustExist(
      db.prepare("DELETE FROM security_settings WHERE id=?").run(itemId).changes,
      "Configuração",
    );
  },

  chatMessages() {
    return (
      db
        .query(
          "SELECT id,role,text,card,session_id AS sessionId,confirmation_status AS confirmationStatus FROM chat_messages ORDER BY created_at",
        )
        .all() as any[]
    ).map((x) => ({ ...x, card: parse(x.card, undefined) }));
  },
  addChatMessage(input: {
    role: string;
    text: string;
    sessionId?: string;
    confirmationStatus?: ConfirmationStatus;
    card?: unknown;
  }) {
    const newId = id(input.role === "user" ? "user" : "hermes");
    db.prepare(
      "INSERT INTO chat_messages (id,role,text,card,session_id,confirmation_status) VALUES (?,?,?,?,?,?)",
    ).run(
      newId,
      input.role,
      input.text,
      input.card ? json(input.card) : null,
      input.sessionId ?? "default",
      input.confirmationStatus ?? "draft",
    );
    return this.chatMessages().find((x: any) => x.id === newId);
  },
  deleteChatMessage(itemId: string) {
    mustExist(db.prepare("DELETE FROM chat_messages WHERE id=?").run(itemId).changes, "Mensagem");
  },
  updateChatMessage(itemId: string, input: Record<string, unknown>) {
    const current = this.chatMessages().find((x: any) => x.id === itemId) as any;
    if (!current) throw new ApiError(404, "NOT_FOUND", "Mensagem não encontrada.");
    db.prepare("UPDATE chat_messages SET text=?, confirmation_status=? WHERE id=?").run(
      input.text ?? current.text,
      input.confirmationStatus ?? current.confirmationStatus,
      itemId,
    );
    return this.chatMessages().find((x: any) => x.id === itemId);
  },

  logAction(input: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    sensitivity?: string;
    confirmationStatus?: ConfirmationStatus;
    details?: unknown;
  }) {
    const logId = id("log");
    const status = input.confirmationStatus ?? "draft";
    db.prepare(
      "INSERT INTO action_logs (id,user_id,action,entity_type,entity_id,sensitivity,requires_confirmation,confirmed,confirmation_status,details) VALUES (?,?,?,?,?,?,?,?,?,?)",
    ).run(
      logId,
      input.userId ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.sensitivity ?? "normal",
      Number(status === "pending_confirmation"),
      Number(status === "confirmed"),
      status,
      input.details ? json(input.details) : null,
    );
    return { id: logId };
  },
  actionLogs() {
    return db
      .query(
        "SELECT id,user_id AS userId,action,entity_type AS entityType,entity_id AS entityId,sensitivity,confirmation_status AS confirmationStatus,details,created_at AS createdAt FROM action_logs ORDER BY created_at DESC LIMIT 100",
      )
      .all();
  },
};
