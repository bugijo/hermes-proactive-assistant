import { ApiError } from "../utils/http";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const limits = () => ({
  windowMs: positiveInteger(process.env.HERMES_RATE_LIMIT_WINDOW_MS, 60_000),
  general: positiveInteger(process.env.HERMES_GENERAL_RATE_LIMIT_MAX, 300),
  register: positiveInteger(process.env.HERMES_REGISTER_RATE_LIMIT_MAX, 3),
  login: positiveInteger(process.env.HERMES_LOGIN_RATE_LIMIT_MAX, 5),
  pairingToken: positiveInteger(process.env.HERMES_PAIRING_TOKEN_RATE_LIMIT_MAX, 10),
  pairingClaim: positiveInteger(process.env.HERMES_PAIRING_CLAIM_RATE_LIMIT_MAX, 10),
});

export type RateLimitScope = "general" | "register" | "login" | "pairingToken" | "pairingClaim";

export function enforceRateLimit(scope: RateLimitScope, clientKey: string, now = Date.now()) {
  const policy = limits();
  const maximum = policy[scope];
  const key = `${scope}:${clientKey}`;
  const current = buckets.get(key);
  const bucket =
    !current || current.resetAt <= now ? { count: 0, resetAt: now + policy.windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 10_000) {
    for (const [storedKey, stored] of buckets) {
      if (stored.resetAt <= now) buckets.delete(storedKey);
    }
  }

  if (bucket.count > maximum) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Muitas tentativas. Aguarde antes de tentar novamente.",
      undefined,
      retryAfter,
    );
  }
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
