import { authRepository } from "../repositories/auth-repository";
import { hashSecret, randomToken, signJwt, verifyJwt, verifySecret } from "../utils/crypto";

const jwtSecret = process.env.HERMES_JWT_SECRET ?? "dev-hermes-mobile-secret-change-me";

async function issueSession(user: { id: string; name: string; email: string; createdAt: string }) {
  const token = await signJwt({ sub: user.id, email: user.email }, jwtSecret);
  await authRepository.saveSession({
    id: randomToken("session"),
    userId: user.id,
    tokenHash: await hashSecret(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
  });
  return { token, user };
}

export const authService = {
  status() {
    return {
      hasUser: authRepository.hasUsers(),
      biometricsAvailable: false,
      biometricsPlanned: true,
    };
  },
  async registerFirstUser(input: {
    name?: string;
    email?: string;
    password?: string;
    pin?: string;
  }) {
    if (authRepository.hasUsers()) throw new Error("FIRST_USER_ALREADY_EXISTS");
    if (!input.email || !input.password || !input.pin) throw new Error("MISSING_CREDENTIALS");
    const user = await authRepository.createUser({
      id: `user-${crypto.randomUUID()}`,
      name: input.name ?? "Hermes User",
      email: input.email,
      passwordHash: await hashSecret(input.password),
      pinHash: await hashSecret(input.pin),
    });
    return issueSession(user);
  },
  async login(input: { email?: string; password?: string }) {
    if (!input.email || !input.password) throw new Error("MISSING_CREDENTIALS");
    const secrets = authRepository.getSecrets(input.email);
    const user = authRepository.findByEmail(input.email);
    if (!secrets || !user || !(await verifySecret(input.password, secrets.passwordHash)))
      throw new Error("INVALID_CREDENTIALS");
    return issueSession(user);
  },
  async unlock(input: { email?: string; pin?: string }) {
    if (!input.email || !input.pin) throw new Error("MISSING_PIN");
    const secrets = authRepository.getSecrets(input.email);
    const user = authRepository.findByEmail(input.email);
    if (!secrets || !user || !(await verifySecret(input.pin, secrets.pinHash)))
      throw new Error("INVALID_PIN");
    return issueSession(user);
  },
  verifyToken(token: string) {
    return verifyJwt<{ sub: string; email: string }>(token, jwtSecret);
  },
};
