import { expect, test } from "bun:test";
import { hashSecret, signJwt, verifyJwt, verifySecret } from "../src/utils/crypto";

test("hashSecret verifies valid secrets and rejects invalid ones", async () => {
  const stored = await hashSecret("1234");
  expect(await verifySecret("1234", stored)).toBe(true);
  expect(await verifySecret("0000", stored)).toBe(false);
});

test("JWT signing and verification round trip", async () => {
  const token = await signJwt({ sub: "user-1" }, "test-secret", 60);
  const payload = await verifyJwt<{ sub: string }>(token, "test-secret");
  expect(payload?.sub).toBe("user-1");
  expect(await verifyJwt(token, "wrong-secret")).toBeNull();
});
