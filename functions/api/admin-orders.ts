interface Env { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; ADMIN_ACCESS_CODE: string; }
type FunctionContext<T> = { request: Request; env: T };
const serverHeaders = (key: string) => key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
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
  const rows = await orders.json() as Array<{ order_number: string; customer_name: string; phone: string; city: string; address: string; notes?: string; item_count: number; total_cents: number; status: string; created_at: string }>;
  return Response.json({ orders: rows.map((row) => ({
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    notes: row.notes,
    itemCount: row.item_count,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
  })) });
};
