interface Env { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; ADMIN_EMAIL: string; }
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Sign in required." }, { status: 401 });
  const user = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` } });
  const identity = await user.json() as { email?: string };
  if (!user.ok || identity.email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) return Response.json({ error: "Owner access required." }, { status: 403 });
  const orders = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=100`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!orders.ok) return Response.json({ error: "Could not load orders." }, { status: 500 });
  return Response.json({ orders: await orders.json() });
};
