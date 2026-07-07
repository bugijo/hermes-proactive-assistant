import { describe, expect, test } from "bun:test";
import { createPlatformService } from "./index";
import { requireNativeConfirmation } from "../native/action-guard";

describe("fallback web da ponte nativa", () => {
  test("usa adapter web quando Capacitor não está disponível", async () => {
    const service = createPlatformService(false);
    expect(service.platform).toBe("web");
    expect(service.native).toBe(false);
    expect((await service.getNetwork()).connected).toBe(true);
    expect(await service.openApp("android.settings.SETTINGS")).toBe(false);
  });

  test("bloqueia abertura de app sem confirmação", () => {
    expect(() => requireNativeConfirmation("open_app", false)).toThrow("CONFIRMATION_REQUIRED");
    expect(() => requireNativeConfirmation("open_app", true)).not.toThrow();
  });
});
