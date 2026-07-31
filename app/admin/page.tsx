"use client";

import { FormEvent, useMemo, useState } from "react";

type Order = { orderNumber: string; customerName: string; phone: string; city: string; address: string; notes?: string; itemCount: number; totalCents: number; status: string; createdAt: string };
const money = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");

  async function loadOrders(accessCode: string) {
    const response = await fetch("/api/admin-orders", { headers: { "X-Admin-Code": accessCode } });
    const data = await response.json().catch(() => ({ error: "The dashboard service could not be reached." }));
    if (!response.ok) throw new Error(data.error ?? "Could not open dashboard.");
    setOrders(data.orders ?? []);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("Opening dashboard…");
    try {
      await loadOrders(code);
      setAccessGranted(true);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The access code was not accepted.");
    }
  }

  const stats = useMemo(() => {
    const revenue = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.totalCents, 0);
    const pairs = orders.reduce((sum, order) => sum + order.itemCount, 0);
    return { revenue, pairs, average: orders.length ? Math.round(revenue / orders.length) : 0 };
  }, [orders]);

  if (!accessGranted) return <main className="admin-gate"><p className="eyebrow">Chrome Leb private office</p><h1>Owner access only.</h1><p>Enter your private owner access code.</p><form onSubmit={submit} className="admin-login"><label>Access code<input type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="current-password" required /></label><button type="submit">Open dashboard</button></form>{message && <p>{message}</p>}</main>;

  return <main className="admin-page"><header className="admin-header"><a className="brand" href="/">CHROME LEB</a><button onClick={() => { setAccessGranted(false); setCode(""); setOrders([]); }}>Lock dashboard</button></header><section className="admin-title"><div><p className="eyebrow">Owner dashboard</p><h1>Sales room.</h1></div><a href="/">View storefront</a></section>{message ? <p className="admin-empty">{message}</p> : <><section className="admin-stats"><article><span>Total revenue</span><strong>{money(stats.revenue)}</strong><small>Cash on delivery orders</small></article><article><span>Orders</span><strong>{orders.length}</strong><small>All-time</small></article><article><span>Average order</span><strong>{money(stats.average)}</strong><small>Across all orders</small></article><article><span>Pairs sold</span><strong>{stats.pairs}</strong><small>All-time</small></article></section><section className="orders-table"><div className="orders-heading"><h2>Recent orders</h2><span>Latest 100</span></div>{!orders.length ? <div className="admin-empty">No orders yet. New orders will appear here automatically.</div> : <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer & phone</th><th>Delivery address</th><th>Pairs</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>{orders.map((order) => <tr key={order.orderNumber}><td><strong>{order.orderNumber}</strong></td><td><strong>{order.customerName}</strong><small>{order.phone}</small></td><td><strong>{order.city}</strong><small>{order.address}{order.notes ? ` · ${order.notes}` : ""}</small></td><td>{order.itemCount}</td><td>{money(order.totalCents)}</td><td><span className={`status status-${order.status}`}>{order.status}</span></td><td>{new Date(order.createdAt).toLocaleDateString("en-LB", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>)}</tbody></table></div>}</section></>}</main>;
}
