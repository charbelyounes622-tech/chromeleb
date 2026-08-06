interface Env { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; ADMIN_ACCESS_CODE: string; }
type FunctionContext<T> = { request: Request; env: T };
const statuses = new Set(["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"]);
const serverHeaders = (key: string): Record<string, string> => {
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return headers;
};
export const onRequestGet = async ({ request, env }: FunctionContext<Env>) => {
  const missing = [!env.SUPABASE_URL && "SUPABASE_URL", !env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", ");
  if (missing) return Response.json({ error: `Cloudflare is missing: ${missing}.` }, { status: 503 });
  const code = request.headers.get("X-Admin-Code");
  if (!code || code !== env.ADMIN_ACCESS_CODE) return Response.json({ error: "The access code is not correct." }, { status: 403 });
  const orders = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=100`, { headers: serverHeaders(env.SUPABASE_SERVICE_ROLE_KEY) });
  if (!orders.ok) {
    const detail = await orders.text();
    return Response.json({ error: `Supabase could not load orders (status ${orders.status}): ${detail.slice(0, 180)}` }, { status: 500 });
  }
  const rows = await orders.json() as Array<{ order_number: string; customer_name: string; phone: string; city: string; address: string; notes?: string; items?: unknown; item_count: number; total_cents: number; status: string; created_at: string }>;
  const activity = await fetch(`${env.SUPABASE_URL}/rest/v1/store_activity?select=event_type,created_at&created_at=gte.${encodeURIComponent(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())}`, { headers: serverHeaders(env.SUPABASE_SERVICE_ROLE_KEY) }).then(async (response) => response.ok ? await response.json() as Array<{ event_type: string; created_at: string }> : []).catch(() => [] as Array<{ event_type: string; created_at: string }>);
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const activitySummary = { recentVisits: activity.filter((event) => event.event_type === "visit" && new Date(event.created_at).getTime() >= fiveMinutesAgo).length, bagOpensToday: activity.filter((event) => event.event_type === "bag_open").length, enabled: activity.length > 0 };
  return Response.json({ activity: activitySummary, orders: rows.map((row) => ({
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    notes: row.notes,
    items: Array.isArray(row.items) ? row.items.filter((item): item is { productId: string; quantity: number } => !!item && typeof item === "object" && typeof (item as { productId?: unknown }).productId === "string" && typeof (item as { quantity?: unknown }).quantity === "number") : [],
    itemCount: row.item_count,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
  })) });
};

export const onRequestPatch = async ({ request, env }: FunctionContext<Env>) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Dashboard service is not configured." }, { status: 503 });
  if (request.headers.get("X-Admin-Code") !== env.ADMIN_ACCESS_CODE) return Response.json({ error: "The access code is not correct." }, { status: 403 });
  const input = await request.json().catch(() => null) as { orderNumber?: unknown; status?: unknown } | null;
  if (!input || typeof input.orderNumber !== "string" || typeof input.status !== "string" || !statuses.has(input.status)) return Response.json({ error: "Invalid order update." }, { status: 400 });
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(input.orderNumber)}`, { method: "PATCH", headers: { ...serverHeaders(env.SUPABASE_SERVICE_ROLE_KEY), "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status: input.status }) });
  if (!response.ok) return Response.json({ error: "Could not update order status." }, { status: 500 });
  return Response.json({ ok: true });
};
