// In local dev, Vite proxies /api and /uploads to the Express server (see
// vite.config.js), so this is empty and requests stay relative. In a split
// deployment (static frontend + separately hosted API), set VITE_API_URL
// to the API's origin at build time.
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
