export function resolveBindHost(env: Record<string, string | undefined> = process.env) {
  const value = env.HERMES_BIND_HOST?.trim();
  return value || "127.0.0.1";
}
