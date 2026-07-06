ALTER TABLE devices ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE devices ADD COLUMN paired_at TEXT;
CREATE TABLE pairing_tokens (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  created_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by) REFERENCES users(id)
);
CREATE INDEX idx_pairing_tokens_expiry ON pairing_tokens(expires_at);
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY,
  battery_saver INTEGER NOT NULL DEFAULT 0,
  limit_mobile_data INTEGER NOT NULL DEFAULT 1,
  quiet_hours_enabled INTEGER NOT NULL DEFAULT 1,
  quiet_start TEXT NOT NULL DEFAULT '22:00',
  quiet_end TEXT NOT NULL DEFAULT '07:00',
  sync_frequency TEXT NOT NULL DEFAULT '30m',
  notifications_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'general';
ALTER TABLE notifications ADD COLUMN scheduled_for TEXT;
CREATE TABLE native_action_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
