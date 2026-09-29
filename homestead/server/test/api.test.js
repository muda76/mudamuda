import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = mkdtempSync(path.join(tmpdir(), 'homestead-'));
process.env.DATA_FILE = path.join(dir, 'db.json');
const { createApp } = await import('../src/app.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

async function call(method, url, body, token) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

test('signup → pledge → list → trade → complete updates balances', async () => {
  const baker = await call('POST', '/api/auth/signup', { name: 'Baker', email: 'baker@x.com', password: 'password1', householdSize: 3 });
  const hens = await call('POST', '/api/auth/signup', { name: 'Hens', email: 'hens@x.com', password: 'password1', householdSize: 2 });
  assert.equal(baker.status, 201);
  const dup = await call('POST', '/api/auth/signup', { name: 'X', email: 'baker@x.com', password: 'password1' });
  assert.equal(dup.status, 409);

  const B = baker.body.token;
  const H = hens.body.token;
  assert.equal((await call('POST', '/api/pledges', { productId: 'sourdough', quantityPerWeek: 4 }, B)).status, 201);
  assert.equal((await call('POST', '/api/pledges', { productId: 'eggs', quantityPerWeek: 2 })).status, 401);

  const community = await call('GET', '/api/community?month=3');
  assert.equal(community.body.people, 5);
  assert.ok(community.body.nutrients.find((n) => n.key === 'kcal').supply > 0);

  const listing = await call('POST', '/api/listings', { productId: 'eggs', quantity: 3 }, H);
  const trade = await call(
    'POST',
    '/api/trades',
    { toId: hens.body.member.id, give: [{ productId: 'sourdough', quantity: 1 }], get: [{ productId: 'eggs', quantity: 2 }], listingId: listing.body.id },
    B,
  );
  assert.equal(trade.status, 201);
  assert.ok(trade.body.quote.creditDelta < 0);

  // Only the recipient can accept.
  assert.equal((await call('POST', `/api/trades/${trade.body.id}/accept`, null, B)).status, 403);
  assert.equal((await call('POST', `/api/trades/${trade.body.id}/accept`, null, H)).status, 200);
  assert.equal((await call('POST', `/api/trades/${trade.body.id}/complete`, null, B)).status, 200);
  assert.equal((await call('POST', `/api/trades/${trade.body.id}/complete`, null, B)).status, 409);

  const bakerMe = await call('GET', '/api/me', null, B);
  const hensMe = await call('GET', '/api/me', null, H);
  assert.equal(bakerMe.body.balance, trade.body.quote.creditDelta);
  assert.equal(hensMe.body.balance, -trade.body.quote.creditDelta);

  const listings = await call('GET', '/api/listings');
  assert.equal(listings.body[0].quantity, 1);
});

test('credit limit blocks trades that would overdraw a member', async () => {
  const a = await call('POST', '/api/auth/signup', { name: 'A', email: 'a@x.com', password: 'password1' });
  const b = await call('POST', '/api/auth/signup', { name: 'B', email: 'b@x.com', password: 'password1' });
  // A asks for 20 lb of dry beans (~20 credits) and gives nothing.
  const trade = await call('POST', '/api/trades', { toId: b.body.member.id, get: [{ productId: 'drybeans', quantity: 20 }] }, a.body.token);
  assert.equal(trade.status, 201);
  const accept = await call('POST', `/api/trades/${trade.body.id}/accept`, null, b.body.token);
  assert.equal(accept.status, 409);
  assert.match(accept.body.error, /credit limit/);
});

test('login rejects a wrong password', async () => {
  const res = await call('POST', '/api/auth/login', { email: 'baker@x.com', password: 'nope-nope' });
  assert.equal(res.status, 401);
  const ok = await call('POST', '/api/auth/login', { email: 'BAKER@x.com', password: 'password1' });
  assert.equal(ok.status, 200);
});
