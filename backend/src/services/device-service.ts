import { deviceRepository } from "../repositories/device-repository";
import { hashToken, randomToken } from "../utils/crypto";

export const deviceService = {
  listDevices: deviceRepository.list,
  revokeDevice(id: string) {
    deviceRepository.revoke(id);
    return { ok: true };
  },
  createPairingCode() {
    return deviceRepository.createPairingCode({
      code: crypto.randomUUID().slice(0, 8).toUpperCase(),
      publicKey: randomToken("pc_pub"),
      expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    });
  },
  async claimPairingCode(input: {
    code?: string;
    deviceName?: string;
    deviceType?: string;
    publicKey?: string;
  }) {
    if (!input.code || !input.deviceName) throw new Error("INVALID_PAIRING_PAYLOAD");
    const token = randomToken("device");
    const id = await deviceRepository.claimPairingCode({
      code: input.code,
      deviceName: input.deviceName,
      deviceType: input.deviceType ?? "mobile",
      publicKey: input.publicKey ?? randomToken("mobile_pub"),
      tokenHash: await hashToken(token),
    });
    if (!id) throw new Error("PAIRING_CODE_INVALID");
    return { id, token };
  },
};
