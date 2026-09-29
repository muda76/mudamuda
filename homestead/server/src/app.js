import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { ACTIVITIES, NUTRIENTS, PRODUCTS, getProduct } from './catalog.js';
import { communitySnapshot, DEFAULT_LOCAL_GOAL, percentDailyValue } from './nutrition.js';
import { CREDIT_LIMIT, DOLLARS_PER_CREDIT, MAX_GAP_BONUS, memberBalance, quoteTrade, unitValue } from './valuation.js';
import { load, update } from './store.js';
import { hashPassword, newToken, publicMember, verifyPassword } from './auth.js';

const LOCAL_GOAL = Number(process.env.LOCAL_GOAL) || DEFAULT_LOCAL_GOAL;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const currentMonth = () => new Date().getMonth() + 1;

function parseMonth(value) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : currentMonth();
}

function snapshot(db, month) {
  return communitySnapshot({ members: db.members, pledges: db.pledges, month, goal: LOCAL_GOAL });
}

function cleanText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function parseItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((i) => ({ productId: String(i.productId), quantity: Number(i.quantity) }));
}

// Wrap async handlers so thrown HttpErrors become JSON responses.
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function authenticate(req, _res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (token) {
    const db = await load();
    const session = db.sessions.find((s) => s.token === token);
    req.member = session && db.members.find((m) => m.id === session.memberId);
    req.token = token;
  }
  next();
}

function requireMember(req, _res, next) {
  if (!req.member) return next(new HttpError(401, 'Please log in first.'));
  next();
}

function tradeView(trade, members) {
  const byId = new Map(members.map((m) => [m.id, m]));
  return {
    ...trade,
    from: byId.get(trade.fromId) ? publicMember(byId.get(trade.fromId)) : null,
    to: byId.get(trade.toId) ? publicMember(byId.get(trade.toId)) : null,
  };
}

// Settling a trade moves creditDelta from the recipient to the proposer.
// Whichever side's balance goes down must stay above the credit limit.
function assertWithinCreditLimit(db, trade) {
  const delta = trade.quote.creditDelta;
  const payerId = delta > 0 ? trade.toId : trade.fromId;
  if (delta === 0) return;
  const after = memberBalance(payerId, db.trades) - Math.abs(delta);
  if (after < CREDIT_LIMIT) {
    const payer = db.members.find((m) => m.id === payerId);
    throw new HttpError(
      409,
      `${payer?.name || 'A member'} would drop to ${after.toFixed(2)} credits, below the ${CREDIT_LIMIT} credit limit. Rebalance the trade so less credit changes hands.`,
    );
  }
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(handle(authenticate));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // ---- Accounts -----------------------------------------------------------

  app.post(
    '/api/auth/signup',
    handle(async (req, res) => {
      const name = cleanText(req.body?.name, 80);
      const email = cleanText(req.body?.email, 200).toLowerCase();
      const password = String(req.body?.password || '');
      const neighborhood = cleanText(req.body?.neighborhood, 80);
      const householdSize = Math.round(Number(req.body?.householdSize) || 1);
      if (!name) throw new HttpError(400, 'Name is required.');
      if (!EMAIL_RE.test(email)) throw new HttpError(400, 'A valid email is required.');
      if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
      if (householdSize < 1 || householdSize > 20) throw new HttpError(400, 'Household size must be between 1 and 20.');

      const result = await update((db) => {
        if (db.members.some((m) => m.email === email)) {
          throw new HttpError(409, 'An account with that email already exists.');
        }
        const member = {
          id: nanoid(10),
          name,
          email,
          passwordHash: hashPassword(password),
          neighborhood,
          householdSize,
          bio: cleanText(req.body?.bio, 500),
          joinedAt: new Date().toISOString(),
        };
        const token = newToken();
        db.members.push(member);
        db.sessions.push({ token, memberId: member.id, createdAt: member.joinedAt });
        return { token, member: { ...publicMember(member), email } };
      });
      res.status(201).json(result);
    }),
  );

  app.post(
    '/api/auth/login',
    handle(async (req, res) => {
      const email = cleanText(req.body?.email, 200).toLowerCase();
      const password = String(req.body?.password || '');
      const result = await update((db) => {
        const member = db.members.find((m) => m.email === email);
        if (!member || !verifyPassword(password, member.passwordHash)) {
          throw new HttpError(401, 'Email or password is incorrect.');
        }
        const token = newToken();
        db.sessions.push({ token, memberId: member.id, createdAt: new Date().toISOString() });
        return { token, member: { ...publicMember(member), email: member.email } };
      });
      res.json(result);
    }),
  );

  app.post(
    '/api/auth/logout',
    requireMember,
    handle(async (req, res) => {
      await update((db) => {
        db.sessions = db.sessions.filter((s) => s.token !== req.token);
      });
      res.json({ ok: true });
    }),
  );

  app.get(
    '/api/me',
    requireMember,
    handle(async (req, res) => {
      const db = await load();
      res.json({
        member: { ...publicMember(req.member), email: req.member.email },
        balance: memberBalance(req.member.id, db.trades),
        creditLimit: CREDIT_LIMIT,
        pledges: db.pledges.filter((p) => p.memberId === req.member.id),
        listings: db.listings.filter((l) => l.memberId === req.member.id),
      });
    }),
  );

  app.patch(
    '/api/me',
    requireMember,
    handle(async (req, res) => {
      const member = await update((db) => {
        const m = db.members.find((x) => x.id === req.member.id);
        if (req.body?.name !== undefined) m.name = cleanText(req.body.name, 80) || m.name;
        if (req.body?.neighborhood !== undefined) m.neighborhood = cleanText(req.body.neighborhood, 80);
        if (req.body?.bio !== undefined) m.bio = cleanText(req.body.bio, 500);
        if (req.body?.householdSize !== undefined) {
          const size = Math.round(Number(req.body.householdSize));
          if (!(size >= 1 && size <= 20)) throw new HttpError(400, 'Household size must be between 1 and 20.');
          m.householdSize = size;
        }
        return { ...publicMember(m), email: m.email };
      });
      res.json({ member });
    }),
  );

  // ---- Catalog & community -----------------------------------------------

  app.get(
    '/api/catalog',
    handle(async (req, res) => {
      const db = await load();
      const month = parseMonth(req.query.month);
      const { coverage } = snapshot(db, month);
      const producers = (productId) => new Set(db.pledges.filter((p) => p.productId === productId).map((p) => p.memberId)).size;
      res.json({
        month,
        nutrients: NUTRIENTS,
        activities: ACTIVITIES,
        settings: { dollarsPerCredit: DOLLARS_PER_CREDIT, maxGapBonus: MAX_GAP_BONUS, creditLimit: CREDIT_LIMIT, localGoal: LOCAL_GOAL },
        products: PRODUCTS.map((p) => ({
          ...p,
          percentDailyValue: percentDailyValue(p),
          inSeason: p.season.includes(month),
          producers: producers(p.id),
          ...unitValue(p, coverage),
        })),
      });
    }),
  );

  app.get(
    '/api/community',
    handle(async (req, res) => {
      const db = await load();
      const month = parseMonth(req.query.month);
      const snap = snapshot(db, month);
      const byProduct = PRODUCTS.map((p) => {
        const pledges = db.pledges.filter((x) => x.productId === p.id);
        return {
          productId: p.id,
          name: p.name,
          unit: p.unit,
          activity: p.activity,
          inSeason: p.season.includes(month),
          producers: new Set(pledges.map((x) => x.memberId)).size,
          quantityPerWeek: pledges.reduce((sum, x) => sum + x.quantityPerWeek, 0),
        };
      }).filter((p) => p.producers > 0);
      res.json({ ...snap, production: byProduct, openListings: db.listings.filter((l) => l.quantity > 0).length });
    }),
  );

  app.get(
    '/api/members',
    handle(async (_req, res) => {
      const db = await load();
      res.json(
        db.members.map((m) => ({
          ...publicMember(m),
          balance: memberBalance(m.id, db.trades),
          pledges: db.pledges.filter((p) => p.memberId === m.id),
        })),
      );
    }),
  );

  // ---- Pledges: "I'll produce this much, each week, in season" ------------

  app.get(
    '/api/pledges',
    handle(async (_req, res) => {
      const db = await load();
      res.json(db.pledges);
    }),
  );

  app.post(
    '/api/pledges',
    requireMember,
    handle(async (req, res) => {
      const product = getProduct(req.body?.productId);
      const quantityPerWeek = Number(req.body?.quantityPerWeek);
      if (!product) throw new HttpError(400, 'Choose something to produce.');
      if (!(quantityPerWeek > 0 && quantityPerWeek <= 500)) throw new HttpError(400, 'Weekly quantity must be between 0 and 500.');
      const pledge = await update((db) => {
        // One pledge per member per product; re-pledging updates the amount.
        const existing = db.pledges.find((p) => p.memberId === req.member.id && p.productId === product.id);
        if (existing) {
          existing.quantityPerWeek = quantityPerWeek;
          existing.note = cleanText(req.body?.note, 300);
          return existing;
        }
        const created = {
          id: nanoid(10),
          memberId: req.member.id,
          productId: product.id,
          quantityPerWeek,
          note: cleanText(req.body?.note, 300),
          createdAt: new Date().toISOString(),
        };
        db.pledges.push(created);
        return created;
      });
      res.status(201).json(pledge);
    }),
  );

  app.delete(
    '/api/pledges/:id',
    requireMember,
    handle(async (req, res) => {
      await update((db) => {
        const pledge = db.pledges.find((p) => p.id === req.params.id);
        if (!pledge) throw new HttpError(404, 'Pledge not found.');
        if (pledge.memberId !== req.member.id) throw new HttpError(403, 'That pledge belongs to someone else.');
        db.pledges = db.pledges.filter((p) => p.id !== pledge.id);
      });
      res.json({ ok: true });
    }),
  );

  // ---- Market listings: "I have this available now" -----------------------

  app.get(
    '/api/listings',
    handle(async (_req, res) => {
      const db = await load();
      const byId = new Map(db.members.map((m) => [m.id, m]));
      res.json(
        db.listings
          .filter((l) => l.quantity > 0)
          .map((l) => ({ ...l, member: byId.get(l.memberId) ? publicMember(byId.get(l.memberId)) : null })),
      );
    }),
  );

  app.post(
    '/api/listings',
    requireMember,
    handle(async (req, res) => {
      const product = getProduct(req.body?.productId);
      const quantity = Number(req.body?.quantity);
      if (!product) throw new HttpError(400, 'Choose what you have available.');
      if (!(quantity > 0 && quantity <= 500)) throw new HttpError(400, 'Quantity must be between 0 and 500.');
      const listing = await update((db) => {
        const created = {
          id: nanoid(10),
          memberId: req.member.id,
          productId: product.id,
          quantity,
          note: cleanText(req.body?.note, 500),
          createdAt: new Date().toISOString(),
        };
        db.listings.unshift(created);
        return created;
      });
      res.status(201).json(listing);
    }),
  );

  app.delete(
    '/api/listings/:id',
    requireMember,
    handle(async (req, res) => {
      await update((db) => {
        const listing = db.listings.find((l) => l.id === req.params.id);
        if (!listing) throw new HttpError(404, 'Listing not found.');
        if (listing.memberId !== req.member.id) throw new HttpError(403, 'That listing belongs to someone else.');
        db.listings = db.listings.filter((l) => l.id !== listing.id);
      });
      res.json({ ok: true });
    }),
  );

  // ---- Trades --------------------------------------------------------------

  app.post(
    '/api/trades/quote',
    handle(async (req, res) => {
      const db = await load();
      const { coverage } = snapshot(db, currentMonth());
      try {
        res.json(quoteTrade({ give: parseItems(req.body?.give), get: parseItems(req.body?.get) }, coverage));
      } catch (err) {
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.get(
    '/api/trades',
    requireMember,
    handle(async (req, res) => {
      const db = await load();
      const mine = db.trades.filter((t) => t.fromId === req.member.id || t.toId === req.member.id);
      res.json({
        balance: memberBalance(req.member.id, db.trades),
        creditLimit: CREDIT_LIMIT,
        trades: mine.map((t) => tradeView(t, db.members)),
      });
    }),
  );

  app.post(
    '/api/trades',
    requireMember,
    handle(async (req, res) => {
      const give = parseItems(req.body?.give);
      const get = parseItems(req.body?.get);
      const trade = await update((db) => {
        const to = db.members.find((m) => m.id === req.body?.toId);
        if (!to) throw new HttpError(400, 'Choose a neighbor to trade with.');
        if (to.id === req.member.id) throw new HttpError(400, "You can't trade with yourself.");
        let quote;
        try {
          // The quote is locked in at proposal time so the terms both sides
          // agree to don't drift as the community's gaps change.
          quote = quoteTrade({ give, get }, snapshot(db, currentMonth()).coverage);
        } catch (err) {
          throw new HttpError(400, err.message);
        }
        const listingId = req.body?.listingId;
        if (listingId && !db.listings.some((l) => l.id === listingId && l.memberId === to.id)) {
          throw new HttpError(400, 'That listing is no longer available.');
        }
        const created = {
          id: nanoid(10),
          fromId: req.member.id,
          toId: to.id,
          give,
          get,
          quote,
          listingId: listingId || null,
          message: cleanText(req.body?.message, 500),
          status: 'proposed',
          createdAt: new Date().toISOString(),
          history: [{ status: 'proposed', at: new Date().toISOString(), by: req.member.id }],
        };
        db.trades.unshift(created);
        return tradeView(created, db.members);
      });
      res.status(201).json(trade);
    }),
  );

  // Allowed transitions: who may move a trade from which state to which.
  const TRANSITIONS = {
    accept: { from: ['proposed'], to: 'accepted', who: 'recipient' },
    decline: { from: ['proposed'], to: 'declined', who: 'recipient' },
    cancel: { from: ['proposed', 'accepted'], to: 'cancelled', who: 'proposer' },
    complete: { from: ['accepted'], to: 'completed', who: 'either' },
  };

  app.post(
    '/api/trades/:id/:action',
    requireMember,
    handle(async (req, res) => {
      const rule = TRANSITIONS[req.params.action];
      if (!rule) throw new HttpError(404, 'Unknown trade action.');
      const trade = await update((db) => {
        const t = db.trades.find((x) => x.id === req.params.id);
        if (!t) throw new HttpError(404, 'Trade not found.');
        const me = req.member.id;
        const allowed =
          (rule.who === 'recipient' && t.toId === me) ||
          (rule.who === 'proposer' && t.fromId === me) ||
          (rule.who === 'either' && (t.toId === me || t.fromId === me));
        if (!allowed) throw new HttpError(403, `You can't ${req.params.action} this trade.`);
        if (!rule.from.includes(t.status)) throw new HttpError(409, `This trade is already ${t.status}.`);

        if (rule.to === 'accepted' || rule.to === 'completed') assertWithinCreditLimit(db, t);
        if (rule.to === 'completed' && t.listingId) {
          const listing = db.listings.find((l) => l.id === t.listingId);
          if (listing) {
            const taken = t.get.filter((i) => i.productId === listing.productId).reduce((s, i) => s + i.quantity, 0);
            listing.quantity = Math.max(0, listing.quantity - taken);
          }
        }
        t.status = rule.to;
        t.history.push({ status: rule.to, at: new Date().toISOString(), by: me });
        return tradeView(t, db.members);
      });
      res.json(trade);
    }),
  );

  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}
