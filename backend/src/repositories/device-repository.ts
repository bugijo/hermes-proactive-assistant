import { db } from "../database";
import type { DeviceRecord, PairingToken } from "../models/domain";

const parseMetadata = (value?: string | null) => (value ? JSON.parse(value) : undefined);

export const deviceRepository = {
  list(): DeviceRecord[] {
    return (
      db
        .query(
          "SELECT id,name,type,connected,ip,last_sync AS lastSync,public_key AS publicKey,revoked,approval_status AS approvalStatus,paired_at AS pairedAt,metadata FROM devices ORDER BY created_at DESC",
        )
        .all() as Array<DeviceRecord & { connected: number; revoked: number; metadata?: string }>
    ).map((device) => ({
      ...device,
      connected: Boolean(device.connected),
      revoked: Boolean(device.revoked),
      status: device.revoked
        ? "revoked"
        : device.approvalStatus === "pending"
          ? "pending_approval"
          : device.connected
            ? "connected"
            : "offline",
      metadata: parseMetadata(device.metadata),
    }));
  },
  createPairingToken(input: {
    id: string;
    code: string;
    tokenHash: string;
    publicKey: string;
    userId: string;
    expiresAt: string;
  }): PairingToken {
    db.prepare(
      "INSERT INTO pairing_tokens (id,code,token_hash,public_key,created_by,expires_at) VALUES (?,?,?,?,?,?)",
    ).run(input.id, input.code, input.tokenHash, input.publicKey, input.userId, input.expiresAt);
    return {
      id: input.id,
      code: input.code,
      publicKey: input.publicKey,
      expiresAt: input.expiresAt,
      status: "waiting",
    };
  },
  findActivePairingToken(code: string, tokenHash: string) {
    return db
      .query(
        "SELECT id,code,public_key AS publicKey,created_by AS createdBy,expires_at AS expiresAt FROM pairing_tokens WHERE code=? AND token_hash=? AND used_at IS NULL AND julianday(expires_at)>julianday('now')",
      )
      .get(code, tokenHash) as {
      id: string;
      code: string;
      publicKey: string;
      createdBy: string;
      expiresAt: string;
    } | null;
  },
  markPairingTokenUsed(id: string) {
    db.prepare("UPDATE pairing_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
  },
  expirePairingToken(id: string) {
    db.prepare("UPDATE pairing_tokens SET expires_at=datetime('now','-1 second') WHERE id=?").run(
      id,
    );
  },
  createPendingDevice(input: {
    name: string;
    type: string;
    publicKey: string;
    metadata?: unknown;
  }) {
    const id = `device-${crypto.randomUUID()}`;
    db.prepare(
      "INSERT INTO devices (id,name,type,connected,public_key,approval_status,metadata) VALUES (?,?,?,0,?,'pending',?)",
    ).run(id, input.name, input.type, input.publicKey, JSON.stringify(input.metadata ?? {}));
    return id;
  },
  approve(id: string) {
    return db
      .prepare(
        "UPDATE devices SET approval_status='approved',paired_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revoked=0",
      )
      .run(id).changes;
  },
  revoke(id: string) {
    return db
      .prepare(
        "UPDATE devices SET revoked=1,connected=0,approval_status='revoked',token_hash=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .run(id).changes;
  },
};
