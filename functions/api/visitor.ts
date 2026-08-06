interface Env { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; }
type FunctionContext<T> = { request: Request; env: T };

const headersFor = (key: string): Record<string, string> => {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return headers;
};

export const onRequestPost = async ({ request, env }: FunctionContext<Env>) => {
  const input = await request.json().catch(() => null) as { event?: unknown } | null;
  if (!input || (input.event !== "visit" && input.event !== "bag_open")) return Response.json({ error: "Invalid activity." }, { status: 400 });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ ok: true });
  await fetch(`${env.SUPABASE_URL}/rest/v1/store_activity`, { method: "POST", headers: headersFor(env.SUPABASE_SERVICE_ROLE_KEY), body: JSON.stringify({ event_type: input.event }) }).catch(() => undefined);
  return Response.json({ ok: true });
};
