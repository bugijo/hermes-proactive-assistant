ALTER TABLE auth_sessions ADD COLUMN revoked_at TEXT;
CREATE INDEX idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at);

