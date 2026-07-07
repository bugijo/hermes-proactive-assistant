import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readSecureValue } from "./secure-storage";

describe("segurança de produção Android", () => {
  test("HTTP claro fica restrito ao source set debug", () => {
    const root = process.cwd();
    const main = readFileSync(resolve(root, "android/app/src/main/AndroidManifest.xml"), "utf8");
    const debug = readFileSync(resolve(root, "android/app/src/debug/AndroidManifest.xml"), "utf8");
    expect(main).toContain('android:usesCleartextTraffic="false"');
    expect(main).not.toContain('android:usesCleartextTraffic="true"');
    expect(debug).toContain('android:usesCleartextTraffic="true"');
  });

  test("payload cifrado inválido vira sessão ausente sem derrubar o app", async () => {
    let removed = false;
    const value = await readSecureValue(
      {
        secureGet: async () => {
          throw new Error("invalid encrypted payload");
        },
        secureRemove: async () => {
          removed = true;
        },
      },
      "hermes.session",
    );
    expect(value).toBeNull();
    expect(removed).toBe(true);
  });
});
