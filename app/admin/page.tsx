"use client";

import { FormEvent, useMemo, useState } from "react";

type Item = { productId: string; quantity: number };
type Order = { orderNumber: string; customerName: string; phone: string; city: string; address: string; notes?: string; items: Item[]; itemCount: number; totalCents: number; status: string; createdAt: string };
type Activity = { recentVisits: number; bagOpensToday: number; enabled: boolean };
const statuses = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
const frameNames: Record<string, string> = { nocturne: "Black Silver", lucent: "Crystal Gold", "smoke-arc": "Crystal Silver", umber: "Black Gold" };
const money = (cents: number) => `$${(cents / 100).toFixed(0)}`;
const displayItems = (items: Item[]) => items.map((item) => `${frameNames[item.productId] ?? item.productId} ×${item.quantity}`).join(", ") || "Order details unavailable";
const toWhatsApp = (phone: string, customer: string, order: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "").replace(/^0/, "961")}?text=${encodeURIComponent(`Hi ${customer}, this is Chrome Leb about order ${order}.`)}`;

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activity, setActivity] = useState<Activity>({ recentVisits: 0, bagOpensToday: 0, enabled: false });
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState("");

  async function loadOrders(accessCode: string) {
    const response = await fetch("/api/admin-orders", { headers: { "X-Admin-Code": accessCode }, cache: "no-store" });
    const data = await response.json().catch(() => ({ error: "The dashboard service could not be reached." }));
    if (!response.ok) throw new Error(data.error ?? "Could not open dashboard.");
    setOrders(data.orders ?? []);
    setActivity(data.activity ?? { recentVisits: 0, bagOpensToday: 0, enabled: false });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("Opening dashboard…");
    try { await loadOrders(code); setAccessGranted(true); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The access code was not accepted."); }
  }

  async function changeStatus(orderNumber: string, status: string) {
    setUpdating(orderNumber); setMessage("");
    try {
      const response = await fetch("/api/admin-orders", { method: "PATCH", headers: { "content-type": "application/json", "X-Admin-Code": code }, body: JSON.stringify({ orderNumber, status }) });
      if (!response.ok) throw new Error("Could not update this order.");
      setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? { ...order, status } : order));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update this order."); }
    finally { setUpdating(""); }
  }

  const stats = useMemo(() => {
    const valid = orders.filter((order) => order.status !== "cancelled");
    const revenue = valid.reduce((sum, order) => sum + order.totalCents, 0);
    const pairs = valid.reduce((sum, order) => sum + order.itemCount, 0);
    return { revenue, pairs, average: valid.length ? Math.round(revenue / valid.length) : 0, delivered: orders.filter((order) => order.status === "delivered").length };
  }, [orders]);

  if (!accessGranted) return <main className="admin-gate"><p className="eyebrow">Chrome Leb private office</p><h1>Owner access only.</h1><p>Enter your private owner access code.</p><form onSubmit={submit} className="admin-login"><label>Access code<input type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="current-password" required /></label><button type="submit">Open dashboard</button></form>{message && <p>{message}</p>}</main>;

  return <main className="admin-page">
    <header className="admin-header"><a className="brand" href="/">CHROME LEB</a><div><button onClick={() => loadOrders(code)}>Refresh orders</button><button onClick={() => { setAccessGranted(false); setCode(""); setOrders([]); }}>Lock dashboard</button></div></header>
    <section className="admin-title"><div><p className="eyebrow">Owner dashboard</p><h1>Sales room.</h1></div><a href="/">View storefront</a></section>
    {message && <p className="admin-empty">{message}</p>}
    <section className="admin-stats"><article><span>Total revenue</span><strong>{money(stats.revenue)}</strong><small>Excludes cancelled orders</small></article><article><span>Orders</span><strong>{orders.length}</strong><small>All-time</small></article><article><span>Average order</span><strong>{money(stats.average)}</strong><small>Across active orders</small></article><article><span>Delivered</span><strong>{stats.delivered}</strong><small>{stats.pairs} pairs sold</small></article></section>
    <section className="admin-stats admin-activity"><article><span>Active visits</span><strong>{activity.enabled ? activity.recentVisits : "—"}</strong><small>Approx. visits in last 5 minutes</small></article><article><span>Bag opens</span><strong>{activity.enabled ? activity.bagOpensToday : "—"}</strong><small>Today</small></article></section>
    <section className="orders-table"><div className="orders-heading"><div><h2>Recent orders</h2><span>{activity.enabled ? "Visitor activity is tracking" : "Run the one-time activity setup in Supabase to enable visitor metrics."}</span></div><span>Latest 100</span></div>{!orders.length ? <div className="admin-empty">No orders yet. New orders will appear here automatically.</div> : <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer & phone</th><th>Items ordered</th><th>Delivery address</th><th>Total</th><th>Status</th><th>Contact</th><th>Date</th></tr></thead><tbody>{orders.map((order) => <tr key={order.orderNumber}><td><strong>{order.orderNumber}</strong></td><td><strong>{order.customerName}</strong><small>{order.phone}</small></td><td><strong>{displayItems(order.items)}</strong><small>{order.itemCount} {order.itemCount === 1 ? "pair" : "pairs"}</small></td><td><strong>{order.city}</strong><small>{order.address}{order.notes ? ` · ${order.notes}` : ""}</small></td><td>{money(order.totalCents)}</td><td><select className="status-select" value={order.status} onChange={(event) => changeStatus(order.orderNumber, event.target.value)} disabled={updating === order.orderNumber}>{statuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></td><td><a className="whatsapp-order" href={toWhatsApp(order.phone, order.customerName, order.orderNumber)} target="_blank" rel="noreferrer">WhatsApp</a></td><td>{new Date(order.createdAt).toLocaleDateString("en-LB", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>)}</tbody></table></div>}</section>
  </main>;
}
