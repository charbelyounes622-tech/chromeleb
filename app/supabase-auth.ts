const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const storageKey = "chrome-leb-session";
export const accessToken = () => typeof window === "undefined" ? "" : JSON.parse(localStorage.getItem(storageKey) || "{}").access_token || "";
export async function login(email: string, password: string) { const r = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); if (!r.ok) throw new Error(); localStorage.setItem(storageKey, JSON.stringify(await r.json())); }
export async function getUser() { const token = accessToken(); if (!token) return null; const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } }); return r.ok ? r.json() : null; }
export async function logout() { localStorage.removeItem(storageKey); }
export async function handleAuthCallback() { return null; }
