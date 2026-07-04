const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(input: ArrayBuffer | Uint8Array | string) {
  const bytes =
    typeof input === "string"
      ? encoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(input: string) {
  const padded = input
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(data));
}

export async function hashSecret(secret: string, salt = crypto.randomUUID()) {
  const hash = await hmac(salt, secret);
  return `${salt}.${base64Url(hash)}`;
}

export async function verifySecret(secret: string, stored: string) {
  const [salt, expected] = stored.split(".");
  if (!salt || !expected) return false;
  return (await hashSecret(secret, salt)) === stored;
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 60 * 60 * 12,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;
  return `${unsigned}.${base64Url(await hmac(secret, unsigned))}`;
}

export async function verifyJwt<T extends Record<string, unknown>>(
  token: string,
  secret: string,
): Promise<T | null> {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const unsigned = `${header}.${payload}`;
  const expected = `${unsigned}.${base64Url(await hmac(secret, unsigned))}`;
  if (expected !== token) return null;
  const parsed = JSON.parse(decoder.decode(fromBase64Url(payload))) as T & { exp?: number };
  if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}

export function randomToken(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}_${crypto.randomUUID().replaceAll("-", "")}`;
}
