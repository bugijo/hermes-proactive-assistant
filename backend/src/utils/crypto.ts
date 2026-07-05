const encoder = new TextEncoder();

export async function hashPassword(password: string) {
  return Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 65536, timeCost: 3 });
}

export function verifyPassword(password: string, hash: string) {
  return Bun.password.verify(password, hash);
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}_${crypto.randomUUID().replaceAll("-", "")}`;
}
