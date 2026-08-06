import { calculateTotals } from "../../lib/pricing";

interface Env { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; }
type FunctionContext<T> = { request: Request; env: T };
const productIds = new Set(["nocturne", "lucent", "smoke-arc", "umber"]);
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : "";
const serverHeaders = (key: string): Record<string, string> => {
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return headers;
};

export const onRequestPost = async ({ request, env }: FunctionContext<Env>) => {
  try {
    const input = await request.json() as Record<string, unknown>;
    const items = Array.isArray(input.items) ? input.items.filter((item): item is { productId: string; quantity: number } => !!item && typeof item === "object" && productIds.has((item as { productId?: string }).productId ?? "") && Number.isInteger((item as { quantity?: number }).quantity) && ((item as { quantity: number }).quantity > 0) && ((item as { quantity: number }).quantity <= 10)).map((item) => ({ productId: item.productId, quantity: item.quantity })) : [];
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const customerName = clean(input.customerName, 100), phone = clean(input.phone, 40), email = clean(input.email, 120), city = clean(input.city, 100), address = clean(input.address, 300), notes = clean(input.notes, 300);
    const phoneDigits = phone.replace(/[\s-]/g, "");
    const lebaneseMobile = /^(?:\+961|00961|0)?(?:3|70|71|76|78|79|81)\d{6}$/;
    if (customerName.length < 2 || !lebaneseMobile.test(phoneDigits) || city.length < 2 || address.length < 8 || itemCount < 1 || itemCount > 20) return Response.json({ error: "Please use a valid Lebanese mobile number and check your delivery details." }, { status: 400 });
    const totals = calculateTotals(itemCount);
    const orderNumber = `CHL-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, { method: "POST", headers: { ...serverHeaders(env.SUPABASE_SERVICE_ROLE_KEY), "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ order_number: orderNumber, customer_name: customerName, phone: phoneDigits, email: email || null, city, address, notes: notes || null, items, item_count: itemCount, subtotal_cents: totals.subtotalCents, delivery_cents: totals.deliveryCents, total_cents: totals.totalCents }) });
    if (!response.ok) throw new Error();
    return Response.json({ orderNumber }, { status: 201 });
  } catch { return Response.json({ error: "Order could not be placed. Please try again." }, { status: 500 }); }
};
