const storageKey = "chrome-leb-session";
type PublicConfig = { supabaseUrl: string; supabaseAnonKey: string };
let configPromise: Promise<PublicConfig> | undefined;

async function config() {
  configPromise ??= fetch("/api/public-config", { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error("Store configuration is unavailable.");
    return response.json() as Promise<PublicConfig>;
  });
  return configPromise;
}

export const accessToken = () => typeof window === "undefined" ? "" : JSON.parse(localStorage.getItem(storageKey) || "{}").access_token || "";
export async function login(email: string, password: string) { const { supabaseUrl, supabaseAnonKey } = await config(); const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); if (!r.ok) throw new Error(); localStorage.setItem(storageKey, JSON.stringify(await r.json())); }
export async function getUser() { const token = accessToken(); if (!token) return null; const { supabaseUrl, supabaseAnonKey } = await config(); const r = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` } }); return r.ok ? r.json() : null; }
export async function logout() { localStorage.removeItem(storageKey); }
export async function handleAuthCallback() { return null; }
