import { Database } from "bun:sqlite";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
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

const defaultPath = resolve(import.meta.dir, "../../data/hermes.sqlite");
const dbPath = resolve(process.env.HERMES_DB_PATH ?? defaultPath);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

const migrationsDir = resolve(import.meta.dir, "../../migrations");
const tableExists = (name: string) =>
  Boolean(db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));

export function migrate() {
  db.run(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const applied = new Set(
    (db.query("SELECT version FROM schema_migrations").all() as Array<{ version: string }>).map(
      ({ version }) => version,
    ),
  );

  // Databases created before numbered migrations already contain the original schema.
  if (tableExists("suggestions") && !applied.has("001_initial.sql")) {
    db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run("001_initial.sql");
    applied.add("001_initial.sql");
  }

  for (const file of files) {
    if (applied.has(file)) continue;
    const transaction = db.transaction(() => {
      const sql = readFileSync(resolve(migrationsDir, file), "utf8");
      // Legacy databases need a compatibility upgrade instead of the clean v2 migration.
      if (file === "002_session_revocation.sql" && tableExists("suggestions"))
        upgradeLegacySchema();
      else db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(file);
    });
    transaction();
  }
}

function addColumn(table: string, definition: string) {
  try {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (error) {
    if (!String(error).includes("duplicate column name")) throw error;
  }
}

function upgradeLegacySchema() {
  addColumn("auth_sessions", "revoked_at TEXT");
  addColumn("suggestions", "confirmation_status TEXT NOT NULL DEFAULT 'draft'");
  addColumn("promotions", "confirmation_status TEXT NOT NULL DEFAULT 'draft'");
  addColumn("automations", "confirmation_status TEXT NOT NULL DEFAULT 'draft'");
  addColumn("permissions", "confirmation_status TEXT NOT NULL DEFAULT 'draft'");
  addColumn("chat_messages", "confirmation_status TEXT NOT NULL DEFAULT 'draft'");
  addColumn("action_logs", "user_id TEXT");
  addColumn("action_logs", "confirmation_status TEXT NOT NULL DEFAULT 'draft'");
  db.exec(
    "CREATE TABLE IF NOT EXISTS security_settings (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, confirmation_status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash); CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at); CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at)",
  );
}

const seeded = (table: string) =>
  (db.query(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count > 0;

export function seedDevelopment() {
  if (process.env.NODE_ENV === "production" || process.env.HERMES_SEED === "false") return;
  const transaction = db.transaction(() => {
    if (!seeded("suggestions")) {
      const insert = db.prepare(
        "INSERT INTO suggestions (id,type,title,description,time) VALUES (?,?,?,?,?)",
      );
      suggestions.forEach((x) => insert.run(x.id, x.type, x.title, x.description, x.time));
    }
    if (!seeded("promotions")) {
      const insert = db.prepare(
        "INSERT INTO promotions (id,category,name,price,target,score,status,url) VALUES (?,?,?,?,?,?,?,?)",
      );
      offers.forEach((x) =>
        insert.run(x.id, x.category, x.name, x.price, x.target, x.score, x.status, x.url),
      );
    }
    if (!seeded("automations")) {
      const insert = db.prepare(
        "INSERT INTO automations (id,name,description,enabled,frequency,impact,permissions) VALUES (?,?,?,?,?,?,?)",
      );
      automations.forEach((x) =>
        insert.run(
          x.id,
          x.name,
          x.description,
          Number(x.enabled),
          x.frequency,
          x.impact,
          JSON.stringify(x.permissions),
        ),
      );
    }
    if (!seeded("permissions")) {
      const insert = db.prepare(
        "INSERT INTO permissions (id,title,description,granted) VALUES (?,?,?,?)",
      );
      devicePermissions.forEach((x) => insert.run(x.id, x.title, x.description, Number(x.granted)));
    }
    if (!seeded("security_settings")) {
      const insert = db.prepare(
        "INSERT INTO security_settings (id,title,description,enabled) VALUES (?,?,?,?)",
      );
      securitySettings.forEach((x) => insert.run(x.id, x.title, x.description, Number(x.enabled)));
    }
    db.prepare(
      "INSERT OR IGNORE INTO chat_sessions (id,title) VALUES ('default','Sessão inicial')",
    ).run();
    if (!seeded("chat_messages")) {
      const insert = db.prepare("INSERT INTO chat_messages (id,role,text,card) VALUES (?,?,?,?)");
      initialChat.forEach((x) =>
        insert.run(x.id, x.role, x.text, x.card ? JSON.stringify(x.card) : null),
      );
    }
    db.prepare(
      "INSERT OR IGNORE INTO devices (id,name,type,connected,ip,last_sync,metadata) VALUES (?,?,?,?,?,?,?)",
    ).run(
      "hermes-pc-local",
      "Hermes PC",
      "desktop",
      Number(hermesPc.connected),
      hermesPc.ip,
      hermesPc.lastSync,
      JSON.stringify({ modules: hermesPc.modules, tasks: hermesPc.tasks }),
    );
    db.prepare("INSERT OR IGNORE INTO app_state (key,value) VALUES ('hermes_status',?)").run(
      JSON.stringify(hermesStatus),
    );
  });
  transaction();
}

migrate();
seedDevelopment();
