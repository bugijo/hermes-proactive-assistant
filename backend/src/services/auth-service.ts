import { authRepository } from "../repositories/auth-repository";
import { domainRepository } from "../repositories/domain-repository";
import { hashPassword, hashToken, randomToken, verifyPassword } from "../utils/crypto";
import { ApiError } from "../utils/http";

const SESSION_HOURS = Number(process.env.HERMES_SESSION_HOURS ?? 12);

async function issueSession(user: { id: string; name: string; email: string; createdAt: string }) {
  const token = randomToken("hermes");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  authRepository.removeExpiredSessions();
  authRepository.saveSession({
    id: `session-${crypto.randomUUID()}`,
    userId: user.id,
    tokenHash: await hashToken(token),
    expiresAt,
  });
  return { token, expiresAt, user };
}

export const authService = {
  status() {
    return { hasUser: authRepository.hasUsers(), authenticationRequired: true };
  },
  async registerFirstUser(input: { name?: string; email?: string; password?: string }) {
    if (authRepository.hasUsers())
      throw new ApiError(409, "FIRST_USER_ALREADY_EXISTS", "O primeiro usuário já foi criado.");
    if (!input.name?.trim() || !input.email?.trim() || !input.password)
      throw new ApiError(400, "MISSING_CREDENTIALS", "Nome, e-mail e senha são obrigatórios.");
    if (input.password.length < 10)
      throw new ApiError(400, "WEAK_PASSWORD", "A senha deve ter pelo menos 10 caracteres.");
    const user = authRepository.createUser({
      id: `user-${crypto.randomUUID()}`,
      name: input.name.trim(),
      email: input.email.trim(),
      passwordHash: await hashPassword(input.password),
    });
    domainRepository.logAction({
      userId: user.id,
      action: "auth.first_user.created",
      entityType: "users",
      entityId: user.id,
      confirmationStatus: "confirmed",
    });
    return issueSession(user);
  },
  async login(input: { email?: string; password?: string }) {
    if (!input.email || !input.password)
      throw new ApiError(400, "MISSING_CREDENTIALS", "E-mail e senha são obrigatórios.");
    const user = authRepository.findByEmail(input.email);
    const passwordHash = authRepository.passwordHash(input.email);
    if (!user || !passwordHash || !(await verifyPassword(input.password, passwordHash)))
      throw new ApiError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    domainRepository.logAction({
      userId: user.id,
      action: "auth.login",
      entityType: "users",
      entityId: user.id,
      confirmationStatus: "confirmed",
    });
    return issueSession(user);
  },
  async authenticate(token: string) {
    return authRepository.findActiveSession(await hashToken(token));
  },
  async logout(token: string) {
    const session = await this.authenticate(token);
    if (session) {
      authRepository.revokeSession(session.sessionId);
      domainRepository.logAction({
        userId: session.id,
        action: "auth.logout",
        entityType: "users",
        entityId: session.id,
        confirmationStatus: "confirmed",
      });
    }
  },
};
