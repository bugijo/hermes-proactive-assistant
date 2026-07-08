import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";
import { Database } from "bun:sqlite";

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
      HERMES_GENERAL_RATE_LIMIT_MAX: "1000",
      HERMES_LOGIN_RATE_LIMIT_MAX: "5",
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

describe("API local Hermes Mobile", () => {
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

  test("chat funciona e persiste mensagens sem seed", async () => {
    const sent = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({ text: "Mensagem em banco limpo", confirmationStatus: "draft" }),
    });
    expect(sent.response.status).toBe(201);
    expect(sent.body.data.role).toBe("hermes");

    const stored = await api("/api/chat");
    expect(stored.response.status).toBe(200);
    expect(
      stored.body.data.some(
        (message: { role: string; text: string }) =>
          message.role === "user" && message.text === "Mensagem em banco limpo",
      ),
    ).toBe(true);
    expect(stored.body.data.some((message: { role: string }) => message.role === "hermes")).toBe(
      true,
    );
  });

  test("payloads inválidos retornam 400 sem gravar", async () => {
    const before = await api("/api/promotions");
    const cases = [
      ["/api/suggestions", { title: "Sem tipo" }],
      ["/api/promotions", { name: "Preço inválido", category: "QA", price: "dez" }],
      ["/api/automations", { name: "Automação", description: "Inválida", enabled: "false" }],
      ["/api/permissions", {}],
      ["/api/chat", { text: "   " }],
      ["/api/native-actions", { action: "qualquer_coisa" }],
    ] as const;

    for (const [path, body] of cases) {
      const result = await api(path, { method: "POST", body: JSON.stringify(body) });
      expect(result.response.status).toBe(400);
      expect(result.body.error.code).toBe("INVALID_PAYLOAD");
    }

    const invalidPreference = await api("/api/preferences/notifications", {
      method: "PUT",
      body: JSON.stringify({ quietStart: "banana" }),
    });
    expect(invalidPreference.response.status).toBe(400);

    const after = await api("/api/promotions");
    expect(after.body.data.offers).toHaveLength(before.body.data.offers.length);
  });

  test("mutação sensível sem confirmação não altera o SQLite", async () => {
    const created = await api("/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        type: "task",
        title: "Protegida",
        description: "Não deve ser apagada sem confirmação",
      }),
    });
    const id = created.body.data.id as string;

    const unconfirmedApproval = await api(`/api/suggestions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "approved" }),
    });
    expect(unconfirmedApproval.response.status).toBe(400);

    const unconfirmedDelete = await api(`/api/suggestions/${id}`, { method: "DELETE" });
    expect(unconfirmedDelete.response.status).toBe(400);
    const stored = await api("/api/suggestions");
    expect(stored.body.data.some((item: { id: string }) => item.id === id)).toBe(true);
  });

  test("auth e pairing validam payloads runtime", async () => {
    const invalidLogin = await api(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email: "inválido", password: "senha" }) },
      false,
    );
    expect(invalidLogin.response.status).toBe(400);
    expect(invalidLogin.body.error.code).toBe("INVALID_PAYLOAD");

    const invalidPairing = await api(
      "/api/pairing/claim",
      { method: "POST", body: JSON.stringify({ code: "123" }) },
      false,
    );
    expect(invalidPairing.response.status).toBe(400);
    expect(invalidPairing.body.error.code).toBe("INVALID_PAYLOAD");
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

  test("salva preferências de bateria e dados móveis", async () => {
    const updated = await api("/api/preferences/notifications", {
      method: "PUT",
      body: JSON.stringify({
        batterySaver: true,
        limitMobileData: false,
        notificationsEnabled: true,
      }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.body.data.batterySaver).toBe(true);
    expect(updated.body.data.limitMobileData).toBe(false);
  });

  test("cria notificação local persistida", async () => {
    const created = await api("/api/notifications", {
      method: "POST",
      body: JSON.stringify({
        title: "Preço-alvo",
        description: "SSD atingiu o valor configurado",
        type: "price_target",
      }),
    });
    expect(created.response.status).toBe(201);
    expect(created.body.data.id).toStartWith("notification-");
  });

  test("pareia, aprova e revoga um computador", async () => {
    const pairing = await api("/api/pairing-tokens", { method: "POST", body: "{}" });
    expect(pairing.response.status).toBe(201);
    expect(pairing.body.data.token.length).toBeGreaterThan(40);
    const ttl = new Date(pairing.body.data.expiresAt).getTime() - Date.now();
    expect(ttl).toBeGreaterThan(295_000);
    expect(ttl).toBeLessThanOrEqual(300_000);
    const inspection = new Database(dbPath, { readonly: true });
    const stored = inspection
      .query("SELECT token_hash AS tokenHash FROM pairing_tokens WHERE id = ?")
      .get(pairing.body.data.id) as { tokenHash: string };
    inspection.close();
    expect(stored.tokenHash).toHaveLength(64);
    expect(stored.tokenHash).not.toBe(pairing.body.data.token);
    const claimBody = {
      code: pairing.body.data.code,
      token: pairing.body.data.token,
      deviceName: "PC Teste",
      publicKey: "mock-pc-public-key",
    };
    const claim = await api(
      "/api/pairing/claim",
      {
        method: "POST",
        body: JSON.stringify(claimBody),
      },
      false,
    );
    expect(claim.response.status).toBe(201);
    expect(claim.body.data.status).toBe("pending_approval");
    const deviceId = claim.body.data.id;
    const beforeApproval = await api("/api/devices");
    expect(
      beforeApproval.body.data.find((item: { id: string }) => item.id === deviceId).status,
    ).toBe("pending_approval");
    const reused = await api(
      "/api/pairing/claim",
      { method: "POST", body: JSON.stringify(claimBody) },
      false,
    );
    expect(reused.response.status).toBe(410);
    const approved = await api(`/api/devices/${deviceId}/approve`, {
      method: "POST",
      body: JSON.stringify({ confirmationStatus: "confirmed" }),
    });
    expect(approved.body.data.status).toBe("offline");
    const unconfirmedRevoke = await api(`/api/devices/${deviceId}`, { method: "DELETE" });
    expect(unconfirmedRevoke.response.status).toBe(400);
    const revoked = await api(`/api/devices/${deviceId}`, {
      method: "DELETE",
      body: JSON.stringify({ confirmationStatus: "confirmed" }),
    });
    expect(revoked.body.data.ok).toBe(true);
    const devices = await api("/api/devices");
    expect(devices.body.data.find((item: { id: string }) => item.id === deviceId).status).toBe(
      "revoked",
    );
  });

  test("rejeita token de pareamento expirado", async () => {
    const pairing = await api("/api/pairing-tokens", {
      method: "POST",
      body: JSON.stringify({ ttlSeconds: 1 }),
    });
    await Bun.sleep(1100);
    const claim = await api(
      "/api/pairing/claim",
      {
        method: "POST",
        body: JSON.stringify({
          code: pairing.body.data.code,
          token: pairing.body.data.token,
          deviceName: "PC Atrasado",
          publicKey: "mock-expired-key",
        }),
      },
      false,
    );
    expect(claim.response.status).toBe(410);
    expect(claim.body.error.code).toBe("PAIRING_TOKEN_INVALID_OR_EXPIRED");
  });

  test("bloqueia ação sensível sem confirmação e ações fora de escopo", async () => {
    const unconfirmed = await api("/api/native-actions", {
      method: "POST",
      body: JSON.stringify({ action: "open_app", payload: { url: "android.settings.SETTINGS" } }),
    });
    expect(unconfirmed.response.status).toBe(409);
    expect(unconfirmed.body.error.code).toBe("CONFIRMATION_REQUIRED");
    const forbidden = await api("/api/native-actions", {
      method: "POST",
      body: JSON.stringify({ action: "delete_file", confirmationStatus: "confirmed" }),
    });
    expect(forbidden.response.status).toBe(403);
    expect(forbidden.body.error.code).toBe("ACTION_NOT_AVAILABLE");
  });

  test("políticas de segurança são somente leitura", async () => {
    const updated = await api("/api/security-settings/sec1", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false, confirmationStatus: "confirmed" }),
    });
    expect(updated.response.status).toBe(409);
    expect(updated.body.error.code).toBe("SECURITY_POLICY_READ_ONLY");
  });

  test("cliente não cria evento forense arbitrário", async () => {
    const forged = await api("/api/action-logs", {
      method: "POST",
      body: JSON.stringify({
        action: "device.approved",
        sensitivity: "high",
        confirmationStatus: "confirmed",
      }),
    });
    expect(forged.response.status).toBe(400);
    expect(forged.body.error.code).toBe("INVALID_PAYLOAD");

    const note = await api("/api/action-logs", {
      method: "POST",
      body: JSON.stringify({ message: "Observação local", context: { screen: "security" } }),
    });
    expect(note.response.status).toBe(201);
    const logs = await api("/api/action-logs");
    expect(
      logs.body.data.some((log: { action: string }) => log.action === "client.note.created"),
    ).toBe(true);
  });

  test("login repetido recebe 429 estruturado", async () => {
    let limited: Awaited<ReturnType<typeof api>> | undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      const result = await api(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email: "local@example.test", password: "senha-incorreta" }),
        },
        false,
      );
      if (result.response.status === 429) {
        limited = result;
        break;
      }
    }
    expect(limited?.body.error.code).toBe("RATE_LIMITED");
    expect(limited?.body.error.retryAfter).toBeGreaterThan(0);
    expect(Number(limited?.response.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});
