import { onRequestPost as createOrder } from "../functions/api/orders";
import { onRequestGet as listOrders } from "../functions/api/admin-orders";

interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_EMAIL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/api/orders" && request.method === "POST") return createOrder({ request, env });
    if (path === "/api/admin-orders" && request.method === "GET") return listOrders({ request, env });
    return env.ASSETS.fetch(request);
  },
};
