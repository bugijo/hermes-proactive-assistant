import { db } from "../database";
import type { AuthUser } from "../models/domain";

export const authRepository = {
  hasUsers: () =>
    (db.query("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count > 0,
  createUser(input: { id: string; name: string; email: string; passwordHash: string }) {
    db.prepare("INSERT INTO users (id,name,email,password_hash,pin_hash) VALUES (?,?,?,?,?)").run(
      input.id,
      input.name,
      input.email.toLowerCase(),
      input.passwordHash,
      input.passwordHash,
    );
    return this.findByEmail(input.email)!;
  },
  findByEmail(email: string) {
    return db
      .query("SELECT id,name,email,created_at AS createdAt FROM users WHERE email = ?")
      .get(email.toLowerCase()) as AuthUser | null;
  },
  passwordHash(email: string) {
    return (
      db
        .query("SELECT password_hash AS passwordHash FROM users WHERE email = ?")
        .get(email.toLowerCase()) as { passwordHash: string } | null
    )?.passwordHash;
  },
  saveSession(input: { id: string; userId: string; tokenHash: string; expiresAt: string }) {
    db.prepare("INSERT INTO auth_sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)").run(
      input.id,
      input.userId,
      input.tokenHash,
      input.expiresAt,
    );
  },
  findActiveSession(tokenHash: string) {
    return db
      .query(
        `SELECT s.id AS sessionId, u.id, u.name, u.email, u.created_at AS createdAt, s.expires_at AS expiresAt
      FROM auth_sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND julianday(s.expires_at) > julianday('now')`,
      )
      .get(tokenHash) as (AuthUser & { sessionId: string; expiresAt: string }) | null;
  },
  revokeSession(sessionId: string) {
    db.prepare("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      sessionId,
    );
  },
  removeExpiredSessions() {
    db.prepare(
      "DELETE FROM auth_sessions WHERE julianday(expires_at) <= julianday('now') OR revoked_at IS NOT NULL",
    ).run();
  },
};
