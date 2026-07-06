import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";

let proc: Bun.Subprocess | undefined;
let token = "";
const port = 8899;
const baseUrl = `http://127.0.0.1:${port}`;
const dbPath = `/tmp/hermes-api-test-${process.pid}.sqlite`;

async function api(path: string, init: RequestInit = {}, authenticated = true) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

beforeAll(async () => {
  proc = Bun.spawn([process.execPath, "backend/src/server.ts"], {
    env: {
      ...process.env,
      HERMES_API_PORT: String(port),
      HERMES_DB_PATH: dbPath,
      HERMES_SEED: "false",
      NODE_ENV: "test",
    },
    stdout: "ignore",
    stderr: "inherit",
  });
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(`${baseUrl}/health`)).ok) return;
    } catch {
      /* starting */
    }
    await Bun.sleep(50);
  }
  throw new Error("API de teste não iniciou");
});

afterAll(() => {
  proc?.kill();
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      unlinkSync(`${dbPath}${suffix}`);
    } catch {
      /* already absent */
    }
  }
});

describe("API local Fase 3", () => {
  test("health check", async () => {
    const { response, body } = await api("/health", {}, false);
    expect(response.status).toBe(200);
    expect(body.data.ok).toBe(true);
  });

  test("endpoint privado rejeita chamada sem token", async () => {
    const { response, body } = await api("/api/suggestions", {}, false);
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("cria somente o primeiro usuário", async () => {
    const input = {
      name: "Teste Local",
      email: "local@example.test",
      password: "senha-local-forte",
    };
    const first = await api(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(input) },
      false,
    );
    expect(first.response.status).toBe(201);
    expect(first.body.data.token).toBeString();
    token = first.body.data.token;
    const second = await api(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(input) },
      false,
    );
    expect(second.response.status).toBe(409);
    expect(second.body.error.code).toBe("FIRST_USER_ALREADY_EXISTS");
  });

  test("login válido e inválido", async () => {
    const valid = await api(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: "local@example.test", password: "senha-local-forte" }),
      },
      false,
    );
    expect(valid.response.status).toBe(200);
    expect(valid.body.data.expiresAt).toBeString();
    token = valid.body.data.token;
    const invalid = await api(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: "local@example.test", password: "senha-errada" }),
      },
      false,
    );
    expect(invalid.response.status).toBe(401);
    expect(invalid.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("cria e altera sugestão e gera logs", async () => {
    const created = await api("/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        type: "task",
        title: "Revisar backup",
        description: "Somente preparar revisão",
        time: "agora",
      }),
    });
    expect(created.response.status).toBe(201);
    expect(created.body.data.state).toBe("pending");
    const suggestionId = created.body.data.id;
    const updated = await api(`/api/suggestions/${suggestionId}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "approved", confirmationStatus: "confirmed" }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.body.data.state).toBe("approved");
    const logs = await api("/api/action-logs");
    expect(
      logs.body.data.some(
        (log: { action: string; entityId: string }) =>
          log.action === "suggestion.updated" && log.entityId === suggestionId,
      ),
    ).toBe(true);
  });
});
