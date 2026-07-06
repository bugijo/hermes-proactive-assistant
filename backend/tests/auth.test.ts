import { expect, test } from "bun:test";
import { hashPassword, hashToken, verifyPassword } from "../src/utils/crypto";

test("Argon2id protege e verifica senhas", async () => {
  const stored = await hashPassword("uma-senha-local-forte");
  expect(stored).not.toContain("uma-senha-local-forte");
  expect(await verifyPassword("uma-senha-local-forte", stored)).toBe(true);
  expect(await verifyPassword("senha-incorreta", stored)).toBe(false);
});

test("tokens são persistidos apenas como SHA-256", async () => {
  const token = "hermes_token_secreto";
  const digest = await hashToken(token);
  expect(digest).not.toContain(token);
  expect(digest).toHaveLength(64);
});
