mudamuda
========

A cleaning service website where customers can upload photos of the areas
they want cleaned and answer a short questionnaire to get an instant,
itemized price estimate — no phone call required.

## What's here

- **`client/`** — React (Vite) front end: marketing landing page, a
  multi-step estimate wizard with drag-and-drop photo upload and a live
  price preview, a thank-you page, and a token-gated admin page for
  viewing submitted requests.
- **`server/`** — Express API: a rule-based pricing engine
  (`server/src/pricing.js`), photo upload handling (Multer), and a small
  JSON-file store for submitted leads.

## How the estimate works

Price is computed from the service type, square footage, bedroom/bathroom
count, condition, recurrence, add-ons, and pets — see
`server/src/pricing.js` for the exact rules (mirrored in
`client/src/lib/pricing.js` so the wizard can show a live price as you
type). Uploaded photos aren't run through image recognition; they're
attached to the request so a human can confirm the price before the crew
is booked, and the UI is upfront about that.

## Running it locally

Requires Node 20+.

```bash
# terminal 1 — API server (http://localhost:4000)
cd server
npm install
npm run dev

# terminal 2 — front end (http://localhost:5173)
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:4000`,
so open `http://localhost:5173` and everything just works.

### Admin view

Visit `/admin` and enter the admin token to see submitted estimate
requests along with their photos. Set a real token via the `ADMIN_TOKEN`
environment variable before running the server in anything but a local
demo — it defaults to `letmein-admin` otherwise:

```bash
ADMIN_TOKEN=your-secret-token npm start
```

## Deploying (Vercel + Render)

The front end and API deploy as two separate services since the API keeps
uploaded photos and leads on local disk, which serverless platforms don't
preserve between requests.

**Backend — Render (Web Service)**
1. New → Web Service → paste this repo's public URL (no GitHub connection
   needed since the repo is public).
2. Root directory: `server`. Build command: `npm install`. Start command: `npm start`.
3. Add an environment variable `ADMIN_TOKEN` set to a real secret.
4. Deploy, then copy the resulting `https://<name>.onrender.com` URL.

Render's free tier spins the instance down when idle and does **not**
persist local disk across restarts — uploaded photos and `leads.json` will
be lost on a cold restart. Fine for a demo; attach a paid persistent disk
(or swap the JSON store / photo storage for a real database and object
store) before relying on this for real customer data.

**Frontend — Vercel (static)**
1. Import the repo, set the project root to `client`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Add an environment variable `VITE_API_URL` set to the Render URL from
   above (no trailing slash), then deploy.

`client/vercel.json` rewrites all routes to `index.html` so client-side
routes like `/estimate` and `/admin` work on direct load.

## Building for production

```bash
cd client && npm run build   # outputs client/dist
cd server && npm start       # serve the API (put a real reverse proxy / static host in front)
```
