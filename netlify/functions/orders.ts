import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import { calculateTotals } from "../../lib/pricing";

const productIds = new Set(["nocturne", "lucent", "smoke-arc", "umber"]);

type Payload = {
  customerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
  items?: Array<{ productId?: string; quantity?: number }>;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : "";
}

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = (await request.json()) as Payload;
    const customerName = clean(payload.customerName, 100);
    const phone = clean(payload.phone, 40);
    const email = clean(payload.email, 120);
    const city = clean(payload.city, 100);
    const address = clean(payload.address, 300);
    const notes = clean(payload.notes, 300);
    const items = (payload.items ?? []).filter((item) =>
      typeof item.productId === "string" && productIds.has(item.productId) && Number.isInteger(item.quantity) && Number(item.quantity) > 0 && Number(item.quantity) <= 10,
    ).map((item) => ({ productId: item.productId as string, quantity: Number(item.quantity) }));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    if (customerName.length < 2 || phone.length < 7 || city.length < 2 || address.length < 8 || itemCount < 1 || itemCount > 20) {
      return Response.json({ error: "Please check your delivery details and bag." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email or leave it blank." }, { status: 400 });
    }

    const totals = calculateTotals(itemCount);
    const orderNumber = `CHL-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const order = { orderNumber, customerName, phone, email, city, address, notes, items, ...totals, paymentMethod: "cash_on_delivery", status: "new", createdAt: new Date().toISOString() };
    await getStore("chrome-leb-orders").set(`order:${orderNumber}`, JSON.stringify(order));
    return Response.json({ orderNumber }, { status: 201 });
  } catch {
    return Response.json({ error: "Order could not be placed. Please try again." }, { status: 500 });
  }
}

export const config = { path: "/api/orders" };
