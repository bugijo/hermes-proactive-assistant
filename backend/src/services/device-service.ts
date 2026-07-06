import { deviceRepository } from "../repositories/device-repository";
import { domainRepository } from "../repositories/domain-repository";
import { hashToken, randomToken } from "../utils/crypto";
import { ApiError } from "../utils/http";

export const deviceService = {
  listDevices: deviceRepository.list,
  async createPairingToken(userId: string, ttlSeconds = 300) {
    const ttl = Math.max(1, Math.min(ttlSeconds, 300));
    const token = randomToken("pair");
    const item = deviceRepository.createPairingToken({
      id: `pairing-${crypto.randomUUID()}`,
      code: crypto.randomUUID().slice(0, 8).toUpperCase(),
      tokenHash: await hashToken(token),
      publicKey: `mock-ed25519:${crypto.randomUUID()}`,
      userId,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    });
    domainRepository.logAction({
      userId,
      action: "pairing.token.created",
      entityType: "pairing_tokens",
      entityId: item.id,
      confirmationStatus: "confirmed",
      details: { expiresAt: item.expiresAt },
    });
    return {
      ...item,
      token,
      qrPayload: JSON.stringify({
        version: 1,
        type: "hermes-pc-pairing",
        pairingId: item.id,
        code: item.code,
        token,
        ephemeralPublicKey: item.publicKey,
        expiresAt: item.expiresAt,
      }),
    };
  },
  async claimPairingToken(input: {
    code?: string;
    token?: string;
    deviceName?: string;
    publicKey?: string;
  }) {
    if (!input.code || !input.token || !input.deviceName || !input.publicKey)
      throw new ApiError(
        400,
        "INVALID_PAIRING_PAYLOAD",
        "Código, token, nome e chave pública são obrigatórios.",
      );
    const pairing = deviceRepository.findActivePairingToken(
      input.code,
      await hashToken(input.token),
    );
    if (!pairing) {
      domainRepository.logAction({
        action: "pairing.claim.failed",
        entityType: "pairing_tokens",
        sensitivity: "high",
        confirmationStatus: "pending_confirmation",
        details: { code: input.code },
      });
      throw new ApiError(
        410,
        "PAIRING_TOKEN_INVALID_OR_EXPIRED",
        "Token de pareamento inválido, usado ou expirado.",
      );
    }
    const deviceId = deviceRepository.createPendingDevice({
      name: input.deviceName,
      type: "desktop",
      publicKey: input.publicKey,
      metadata: { pairingId: pairing.id, requestedAt: new Date().toISOString() },
    });
    deviceRepository.markPairingTokenUsed(pairing.id);
    domainRepository.logAction({
      userId: pairing.createdBy,
      action: "pairing.claim.pending_approval",
      entityType: "devices",
      entityId: deviceId,
      sensitivity: "high",
      confirmationStatus: "pending_confirmation",
    });
    return { id: deviceId, status: "pending_approval" as const };
  },
  approveDevice(userId: string, id: string) {
    if (!deviceRepository.approve(id))
      throw new ApiError(404, "DEVICE_NOT_FOUND", "Computador não encontrado.");
    domainRepository.logAction({
      userId,
      action: "device.approved",
      entityType: "devices",
      entityId: id,
      sensitivity: "high",
      confirmationStatus: "confirmed",
    });
    return { id, status: "offline" as const };
  },
  revokeDevice(userId: string, id: string) {
    if (!deviceRepository.revoke(id))
      throw new ApiError(404, "DEVICE_NOT_FOUND", "Computador não encontrado.");
    domainRepository.logAction({
      userId,
      action: "device.revoked",
      entityType: "devices",
      entityId: id,
      sensitivity: "high",
      confirmationStatus: "confirmed",
    });
    return { ok: true };
  },
  expirePairingToken(id: string) {
    deviceRepository.expirePairingToken(id);
  },
};
