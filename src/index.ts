import { onRequestPost as createOrder } from "../functions/api/orders";
import { onRequestGet as listOrders } from "../functions/api/admin-orders";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_EMAIL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/api/public-config" && request.method === "GET") {
      return Response.json({ supabaseUrl: env.SUPABASE_URL, supabaseAnonKey: env.SUPABASE_ANON_KEY }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (path === "/api/orders" && request.method === "POST") return createOrder({ request, env });
    if (path === "/api/admin-orders" && request.method === "GET") return listOrders({ request, env });
    return env.ASSETS.fetch(request);
  },
};
