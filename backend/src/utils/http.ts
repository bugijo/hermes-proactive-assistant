export const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": process.env.HERMES_ALLOWED_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { ...jsonHeaders, ...init.headers } });

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
