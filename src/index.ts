import { onRequestPost as createOrder } from "../functions/api/orders";
import { onRequestGet as listOrders } from "../functions/api/admin-orders";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_ACCESS_CODE: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const configuredEnv = { ...env, SUPABASE_URL: env.SUPABASE_URL || "https://gzsbjwvefmegxclhpoye.supabase.co" };
    if (path === "/api/public-config" && request.method === "GET") {
      return Response.json({ supabaseUrl: configuredEnv.SUPABASE_URL, supabaseAnonKey: env.SUPABASE_ANON_KEY }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (path.startsWith("/api/orders") && request.method === "POST") return createOrder({ request, env: configuredEnv });
    if (path.startsWith("/api/admin-orders") && request.method === "GET") {
      try {
        return await listOrders({ request, env: configuredEnv });
      } catch {
        return Response.json({ error: "The dashboard service is not available yet." }, { status: 500 });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
