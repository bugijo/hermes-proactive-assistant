export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": process.env.HERMES_ALLOWED_ORIGIN ?? "http://localhost:8080",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify({ data }), { ...init, headers: { ...jsonHeaders, ...init.headers } });

export const errorJson = (error: ApiError | Error) => {
  const apiError =
    error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "Erro interno da API.");
  return new Response(
    JSON.stringify({
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details === undefined ? {} : { details: apiError.details }),
        ...(apiError.retryAfter === undefined ? {} : { retryAfter: apiError.retryAfter }),
      },
    }),
    {
      status: apiError.status,
      headers: {
        ...jsonHeaders,
        ...(apiError.retryAfter === undefined
          ? {}
          : { "Retry-After": String(apiError.retryAfter) }),
      },
    },
  );
};

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "O corpo deve ser JSON válido.");
  }
}
