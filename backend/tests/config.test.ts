import { expect, test } from "bun:test";
import { resolveBindHost } from "../src/config";

test("API usa loopback como bind padrão", () => {
  expect(resolveBindHost({})).toBe("127.0.0.1");
});

test("bind LAN exige variável explícita", () => {
  expect(resolveBindHost({ HERMES_BIND_HOST: "0.0.0.0" })).toBe("0.0.0.0");
});
