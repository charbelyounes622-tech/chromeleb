import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";

export default async function handler(_request: Request, _context: Context) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!user.roles?.includes("admin")) return Response.json({ error: "Owner access required." }, { status: 403 });

  const store = getStore("chrome-leb-orders");
  const result = await store.list({ prefix: "order:" });
  const orders = await Promise.all(result.blobs.map(async ({ key }) => JSON.parse((await store.get(key, { type: "text" })) ?? "{}")));
  orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return Response.json({ orders: orders.slice(0, 100), email: user.email });
}

export const config = { path: "/api/admin-orders" };
