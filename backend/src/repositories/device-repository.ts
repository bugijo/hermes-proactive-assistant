import { db } from "../database";
import type { DeviceRecord, PairingCode } from "../models/domain";

const parseMetadata = (value?: string | null) => (value ? JSON.parse(value) : undefined);

export const deviceRepository = {
  list(): DeviceRecord[] {
    return (
      db
        .query(
          "SELECT id, name, type, connected, ip, last_sync as lastSync, token_hash as token, public_key as publicKey, revoked, metadata FROM devices ORDER BY created_at DESC",
        )
        .all() as Array<DeviceRecord & { connected: number; revoked: number; metadata?: string }>
    ).map((device) => ({
      ...device,
      connected: Boolean(device.connected),
      revoked: Boolean(device.revoked),
      metadata: parseMetadata(device.metadata),
    }));
  },
  revoke(id: string) {
    db.prepare(
      "UPDATE devices SET revoked = 1, connected = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(id);
  },
  createPairingCode(input: { code: string; publicKey: string; expiresAt: string }): PairingCode {
    db.prepare("INSERT INTO pairing_codes (code, public_key, expires_at) VALUES (?, ?, ?)").run(
      input.code,
      input.publicKey,
      input.expiresAt,
    );
    return {
      code: input.code,
      expiresAt: input.expiresAt,
      qrPayload: JSON.stringify({
        type: "hermes-pc-pair",
        code: input.code,
        publicKey: input.publicKey,
      }),
    };
  },
  claimPairingCode(input: {
    code: string;
    deviceName: string;
    deviceType: string;
    publicKey: string;
    tokenHash: string;
  }) {
    const code = db
      .query("SELECT code, expires_at as expiresAt, claimed FROM pairing_codes WHERE code = ?")
      .get(input.code) as { code: string; expiresAt: string; claimed: number } | null;
    if (!code || code.claimed || new Date(code.expiresAt).getTime() < Date.now()) return null;
    const id = `device-${crypto.randomUUID()}`;
    db.prepare(
      "INSERT INTO devices (id, name, type, connected, public_key, token_hash, metadata) VALUES (?, ?, ?, 1, ?, ?, ?)",
    ).run(
      id,
      input.deviceName,
      input.deviceType,
      input.publicKey,
      input.tokenHash,
      JSON.stringify({ pairedAt: new Date().toISOString() }),
    );
    db.prepare("UPDATE pairing_codes SET claimed = 1 WHERE code = ?").run(input.code);
    return id;
  },
};
