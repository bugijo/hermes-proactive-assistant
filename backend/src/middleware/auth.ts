import { authService } from "../services/auth-service";
import { ApiError } from "../utils/http";

export function bearerToken(request: Request) {
  const header = request.headers.get("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function requireAuth(request: Request) {
  const token = bearerToken(request);
  const user = token ? await authService.authenticate(token) : null;
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Sessão ausente, inválida ou expirada.");
  return { token: token!, user };
}
