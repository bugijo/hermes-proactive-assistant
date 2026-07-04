import { authService } from "../services/auth-service";

export async function requireAuth(request: Request) {
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return null;
  return authService.verifyToken(token);
}
