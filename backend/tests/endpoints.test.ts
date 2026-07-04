import { afterAll, beforeAll, expect, test } from "bun:test";

let proc: Bun.Subprocess;
const baseUrl = "http://127.0.0.1:8899";

beforeAll(async () => {
  proc = Bun.spawn(["bun", "backend/src/server.ts"], {
    env: { ...process.env, HERMES_API_PORT: "8899" },
    stdout: "ignore",
    stderr: "inherit",
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(() => {
  proc.kill();
});

test("health and dashboard endpoints respond", async () => {
  const health = await fetch(`${baseUrl}/health`).then((res) => res.json());
  expect(health.ok).toBe(true);

  const dashboard = await fetch(`${baseUrl}/api/dashboard`).then((res) => res.json());
  expect(typeof dashboard.cpu).toBe("number");
  expect(typeof dashboard.taskCount).toBe("number");
});

test("chat endpoint persists a local response", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Teste endpoint" }),
  });
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(body.role).toBe("hermes");
});
