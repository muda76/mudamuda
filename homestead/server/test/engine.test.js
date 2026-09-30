import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, getProduct } from '../src/catalog.js';
import { communitySnapshot, gapScore, weeklyNeeds } from '../src/nutrition.js';
import { baseValue, memberBalance, quoteTrade, unitValue, MAX_GAP_BONUS } from '../src/valuation.js';

test('every product has complete, non-negative nutrient data and a season', () => {
  for (const p of PRODUCTS) {
    assert.ok(p.season.length > 0, p.id);
    assert.ok(p.laborMinutes > 0 && p.inputCost >= 0, p.id);
    for (const v of Object.values(p.nutrients)) assert.ok(v >= 0, p.id);
    assert.equal(Object.keys(p.nutrients).length, 10, p.id);
  }
});

test('base value is labor hours plus materials in credits', () => {
  // 45 min + $2.50 at $20/credit = 0.75 + 0.125
  assert.equal(baseValue(getProduct('sourdough')), 0.875);
});

test('weekly needs scale with household size and local goal', () => {
  const needs = weeklyNeeds([{ householdSize: 2 }, { householdSize: 3 }], 0.2);
  assert.equal(needs.kcal, 2000 * 7 * 5 * 0.2);
});

test('supply only counts pledges that are in season', () => {
  const members = [{ householdSize: 1 }];
  const pledges = [{ productId: 'strawberries', quantityPerWeek: 5 }];
  const june = communitySnapshot({ members, pledges, month: 6 });
  const january = communitySnapshot({ members, pledges, month: 1 });
  assert.ok(june.coverage.vitaminC > 0);
  assert.equal(january.coverage.vitaminC, 0);
});

test('gap bonus rewards products rich in what the community lacks', () => {
  const lackingB12 = { kcal: 1, protein: 1, fiber: 1, vitaminA: 1, vitaminC: 1, calcium: 1, iron: 1, potassium: 1, folate: 1, vitaminB12: 0 };
  assert.ok(gapScore(getProduct('eggs'), lackingB12) > 0);
  assert.equal(gapScore(getProduct('honey'), lackingB12), 0);
  const allMissing = Object.fromEntries(Object.keys(lackingB12).map((k) => [k, 0]));
  const { bonus } = unitValue(getProduct('greens'), allMissing);
  assert.equal(bonus, MAX_GAP_BONUS);
});

test('quotes rate fairness and report who owes credit', () => {
  const q = quoteTrade({ give: [{ productId: 'sourdough', quantity: 1 }], get: [{ productId: 'eggs', quantity: 1 }] });
  // eggs: 1 + 0.175 = 1.175; bread 0.875 → ratio ~0.74
  assert.equal(q.rating, 'uneven');
  assert.equal(q.creditDelta, -0.3);
  const even = quoteTrade({ give: [{ productId: 'potatoes', quantity: 4 }], get: [{ productId: 'potatoes', quantity: 4 }] });
  assert.equal(even.rating, 'balanced');
  assert.throws(() => quoteTrade({ give: [{ productId: 'nope', quantity: 1 }] }));
  assert.throws(() => quoteTrade({}));
});

test('balances net to zero across the community', () => {
  const trades = [
    { fromId: 'a', toId: 'b', status: 'completed', quote: { creditDelta: 1.5 } },
    { fromId: 'b', toId: 'c', status: 'completed', quote: { creditDelta: -0.5 } },
    { fromId: 'c', toId: 'a', status: 'proposed', quote: { creditDelta: 9 } },
  ];
  const total = ['a', 'b', 'c'].reduce((s, id) => s + memberBalance(id, trades), 0);
  assert.equal(total, 0);
  assert.equal(memberBalance('a', trades), 1.5);
});
