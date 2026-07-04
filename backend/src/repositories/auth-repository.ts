import { db } from "../database";
import type { AuthUser } from "../models/domain";

const mapUser = (row: { id: string; name: string; email: string; createdAt: string }): AuthUser =>
  row;

export const authRepository = {
  hasUsers() {
    return (
      ((db.query("SELECT COUNT(*) as count FROM users").get() as { count: number }).count ?? 0) > 0
    );
  },
  createUser(input: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    pinHash: string;
  }) {
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, pin_hash) VALUES (?, ?, ?, ?, ?)",
    ).run(input.id, input.name, input.email, input.passwordHash, input.pinHash);
    return this.findByEmail(input.email)!;
  },
  findByEmail(email: string) {
    const row = db
      .query("SELECT id, name, email, created_at as createdAt FROM users WHERE email = ?")
      .get(email) as AuthUser | null;
    return row ? mapUser(row) : null;
  },
  getSecrets(email: string) {
    return db
      .query(
        "SELECT id, password_hash as passwordHash, pin_hash as pinHash FROM users WHERE email = ?",
      )
      .get(email) as { id: string; passwordHash: string; pinHash: string } | null;
  },
  saveSession(input: { id: string; userId: string; tokenHash: string; expiresAt: string }) {
    db.prepare(
      "INSERT INTO auth_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    ).run(input.id, input.userId, input.tokenHash, input.expiresAt);
  },
};
