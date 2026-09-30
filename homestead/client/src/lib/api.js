// In local dev, Vite proxies /api to the Express server (see vite.config.js),
// so this is empty and requests stay relative. In a split deployment, set
// VITE_API_URL to the API's origin at build time.
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
const TOKEN_KEY = 'homestead-token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private mode); the session just won't persist.
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const credits = (n) => `${Number(n).toFixed(2)} HC`;

export function formatAmount(value, unit) {
  const rounded = value >= 100 ? Math.round(value).toLocaleString() : Number(value.toFixed(1)).toLocaleString();
  return `${rounded} ${unit}`;
}
