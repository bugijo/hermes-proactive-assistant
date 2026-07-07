import type { PlatformService } from "./contracts";

type SecureStorage = Pick<PlatformService, "secureGet" | "secureRemove">;

export async function readSecureValue(storage: SecureStorage, key: string) {
  try {
    return await storage.secureGet(key);
  } catch {
    try {
      await storage.secureRemove(key);
    } catch {
      // Fail closed: an unreadable secret must behave like an absent session.
    }
    return null;
  }
}
