import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  automations,
  devicePermissions,
  hermesPc,
  hermesStatus,
  initialChat,
  offers,
  securitySettings,
  suggestions,
} from "../../../src/services/mock-hermes-data";
import type {
  Automation,
  ChatMessage,
  DevicePermission,
  Offer,
  SecuritySetting,
  Suggestion,
} from "../../../src/types/hermes";

const dbPath = resolve(import.meta.dir, "../../data/hermes.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

const toJson = (value: unknown) => JSON.stringify(value);
const fromJson = <T>(value: string | null | undefined, fallback: T): T =>
  value ? (JSON.parse(value) as T) : fallback;

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      biometric_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      time TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      target REAL NOT NULL,
      score REAL NOT NULL,
      status TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      impact TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      granted INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      card TEXT,
      session_id TEXT DEFAULT 'default',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      connected INTEGER NOT NULL DEFAULT 0,
      ip TEXT,
      last_sync TEXT,
      metadata TEXT,
      token_hash TEXT,
      public_key TEXT,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE IF NOT EXISTS pairing_codes (
      code TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      claimed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'média',
      category TEXT NOT NULL DEFAULT 'Geral',
      reminder_at TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      sensitivity TEXT NOT NULL DEFAULT 'normal',
      requires_confirmation INTEGER NOT NULL DEFAULT 0,
      confirmed INTEGER NOT NULL DEFAULT 0,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const statement of [
    "ALTER TABLE devices ADD COLUMN token_hash TEXT",
    "ALTER TABLE devices ADD COLUMN public_key TEXT",
    "ALTER TABLE devices ADD COLUMN revoked INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE chat_messages ADD COLUMN session_id TEXT DEFAULT 'default'",
  ]) {
    try {
      db.run(statement);
    } catch {
      // Column already exists in local development databases.
    }
  }
}

function isSeeded(table: string) {
  const row = db.query(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
  return row.count > 0;
}

export function seed() {
  if (!isSeeded("suggestions")) {
    const stmt = db.prepare(
      "INSERT INTO suggestions (id, type, title, description, time) VALUES (?, ?, ?, ?, ?)",
    );
    suggestions.forEach((item) =>
      stmt.run(item.id, item.type, item.title, item.description, item.time),
    );
  }

  if (!isSeeded("promotions")) {
    const stmt = db.prepare(
      "INSERT INTO promotions (id, category, name, price, target, score, status, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    offers.forEach((item) =>
      stmt.run(
        item.id,
        item.category,
        item.name,
        item.price,
        item.target,
        item.score,
        item.status,
        item.url,
      ),
    );
  }

  if (!isSeeded("automations")) {
    const stmt = db.prepare(
      "INSERT INTO automations (id, name, description, enabled, frequency, impact, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    automations.forEach((item) =>
      stmt.run(
        item.id,
        item.name,
        item.description,
        item.enabled ? 1 : 0,
        item.frequency,
        item.impact,
        toJson(item.permissions),
      ),
    );
  }

  if (!isSeeded("permissions")) {
    const stmt = db.prepare(
      "INSERT INTO permissions (id, title, description, granted) VALUES (?, ?, ?, ?)",
    );
    devicePermissions.forEach((item) =>
      stmt.run(item.id, item.title, item.description, item.granted ? 1 : 0),
    );
  }

  if (!isSeeded("chat_messages")) {
    const stmt = db.prepare("INSERT INTO chat_messages (id, role, text, card) VALUES (?, ?, ?, ?)");
    initialChat.forEach((item) =>
      stmt.run(item.id, item.role, item.text, item.card ? toJson(item.card) : null),
    );
  }

  if (!isSeeded("devices")) {
    db.prepare(
      "INSERT INTO devices (id, name, type, connected, ip, last_sync, metadata, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "hermes-pc-local",
      "Hermes PC",
      "desktop",
      hermesPc.connected ? 1 : 0,
      hermesPc.ip,
      hermesPc.lastSync,
      toJson({ modules: hermesPc.modules, tasks: hermesPc.tasks }),
      0,
    );
  }

  if (!isSeeded("tasks")) {
    const stmt = db.prepare(
      "INSERT INTO tasks (id, title, description, priority, category, reminder_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    stmt.run(
      "task-1",
      "Revisar sugestões do Hermes",
      "Validar ações pendentes antes de executar.",
      "alta",
      "Hermes",
      null,
      "pendente",
    );
    stmt.run(
      "task-2",
      "Sincronizar Hermes PC",
      "Confirmar pareamento e sync local.",
      "média",
      "PC",
      null,
      "em andamento",
    );
  }

  if (!isSeeded("notifications")) {
    const stmt = db.prepare(
      "INSERT INTO notifications (id, title, description, read) VALUES (?, ?, ?, ?)",
    );
    stmt.run(
      "notif-1",
      "Hermes pronto",
      "API local iniciada e aguardando comandos confirmados.",
      0,
    );
  }

  db.prepare("INSERT OR IGNORE INTO chat_sessions (id, title) VALUES (?, ?)").run(
    "default",
    "Sessão inicial",
  );

  db.prepare("INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)").run(
    "hermes_status",
    toJson(hermesStatus),
  );
  db.prepare("INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)").run(
    "security_settings",
    toJson(securitySettings),
  );
}

export const repositories = {
  status() {
    const row = db.query("SELECT value FROM app_state WHERE key = 'hermes_status'").get() as {
      value: string;
    } | null;
    return fromJson(row?.value, hermesStatus);
  },
  suggestions(): Suggestion[] {
    return db
      .query("SELECT id, type, title, description, time FROM suggestions ORDER BY created_at DESC")
      .all() as Suggestion[];
  },
  promotions(): Offer[] {
    return db
      .query(
        "SELECT id, category, name, price, target, score, status, url FROM promotions ORDER BY score DESC",
      )
      .all() as Offer[];
  },
  automations(): Automation[] {
    return (
      db
        .query(
          "SELECT id, name, description, enabled, frequency, impact, permissions FROM automations ORDER BY id",
        )
        .all() as Array<
        Omit<Automation, "enabled" | "permissions"> & { enabled: number; permissions: string }
      >
    ).map((item) => ({
      ...item,
      enabled: Boolean(item.enabled),
      permissions: fromJson<string[]>(item.permissions, []),
    }));
  },
  permissions(): DevicePermission[] {
    return (
      db
        .query("SELECT id, title, description, granted FROM permissions ORDER BY id")
        .all() as Array<Omit<DevicePermission, "granted"> & { granted: number }>
    ).map((item) => ({ ...item, granted: Boolean(item.granted) }));
  },
  chatMessages(): ChatMessage[] {
    return (
      db.query("SELECT id, role, text, card FROM chat_messages ORDER BY created_at").all() as Array<
        Omit<ChatMessage, "card"> & { card: string | null }
      >
    ).map((item) => ({ ...item, card: fromJson(item.card, undefined) }));
  },
  addChatMessage(message: ChatMessage) {
    db.prepare("INSERT INTO chat_messages (id, role, text, card) VALUES (?, ?, ?, ?)").run(
      message.id,
      message.role,
      message.text,
      message.card ? toJson(message.card) : null,
    );
  },
  pcStatus() {
    const row = db
      .query(
        "SELECT connected, ip, last_sync as lastSync, metadata FROM devices WHERE id = 'hermes-pc-local'",
      )
      .get() as { connected: number; ip: string; lastSync: string; metadata: string } | null;
    const metadata = fromJson(row?.metadata, { modules: hermesPc.modules, tasks: hermesPc.tasks });
    return {
      connected: Boolean(row?.connected),
      ip: row?.ip ?? hermesPc.ip,
      lastSync: row?.lastSync ?? hermesPc.lastSync,
      tasks: metadata.tasks,
      modules: metadata.modules,
    };
  },
  securitySettings(): SecuritySetting[] {
    const row = db.query("SELECT value FROM app_state WHERE key = 'security_settings'").get() as {
      value: string;
    } | null;
    return fromJson(row?.value, securitySettings);
  },
  logAction(input: {
    action: string;
    entityType?: string;
    entityId?: string;
    sensitivity?: string;
    requiresConfirmation?: boolean;
    confirmed?: boolean;
    details?: unknown;
  }) {
    const id = `log-${Date.now()}-${crypto.randomUUID()}`;
    db.prepare(
      "INSERT INTO action_logs (id, action, entity_type, entity_id, sensitivity, requires_confirmation, confirmed, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.sensitivity ?? "normal",
      input.requiresConfirmation ? 1 : 0,
      input.confirmed ? 1 : 0,
      input.details ? toJson(input.details) : null,
    );
    return id;
  },
  actionLogs() {
    return db
      .query(
        "SELECT id, action, entity_type as entityType, entity_id as entityId, sensitivity, requires_confirmation as requiresConfirmation, confirmed, details, created_at as createdAt FROM action_logs ORDER BY created_at DESC LIMIT 100",
      )
      .all();
  },
};

migrate();
seed();
