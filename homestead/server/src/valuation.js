import { getProduct, NUTRIENTS } from './catalog.js';
import { gapScore, percentDailyValue } from './nutrition.js';

// One Harvest Credit (HC) is one hour of a neighbor's labor. Materials are
// converted to credits at DOLLARS_PER_CREDIT, so a unit's base value is
// "the time it took plus what it cost to make", which treats an hour of
// bread-baking and an hour of weeding as equally valuable.
export const DOLLARS_PER_CREDIT = 20;

// Products that fill the community's current nutrient gaps earn up to this
// much extra, nudging neighbors toward growing what the whole needs.
export const MAX_GAP_BONUS = 0.25;

// How far below zero a member's balance may go. Mutual credit lets the baker
// take eggs now and repay the neighborhood later, within reason.
export const CREDIT_LIMIT = -10;

const round2 = (x) => Math.round(x * 100) / 100;

export function baseValue(product) {
  return product.laborMinutes / 60 + product.inputCost / DOLLARS_PER_CREDIT;
}

export function unitValue(product, cov) {
  const bonus = cov ? MAX_GAP_BONUS * gapScore(product, cov) : 0;
  return { base: round2(baseValue(product)), bonus: round2(bonus), value: round2(baseValue(product) * (1 + bonus)) };
}

// Value one side of a trade: a list of { productId, quantity }.
export function valueItems(items, cov) {
  let credits = 0;
  let laborMinutes = 0;
  let nutrientDays = 0;
  const lines = [];
  for (const item of items) {
    const product = getProduct(item.productId);
    const quantity = Number(item.quantity);
    if (!product || !(quantity > 0)) {
      throw new Error(`Invalid trade item: ${JSON.stringify(item)}`);
    }
    const { value } = unitValue(product, cov);
    const pct = percentDailyValue(product);
    // "Nutrient-days": average share of a day's Daily Values across all
    // tracked nutrients, capped per nutrient so calorie-dense foods don't
    // swamp the comparison.
    const days = NUTRIENTS.reduce((sum, n) => sum + Math.min(pct[n.key] * quantity, quantity), 0) / NUTRIENTS.length;
    credits += value * quantity;
    laborMinutes += product.laborMinutes * quantity;
    nutrientDays += days;
    lines.push({ productId: product.id, name: product.name, unit: product.unit, quantity, unitValue: value, credits: round2(value * quantity) });
  }
  return { lines, credits: round2(credits), laborMinutes: Math.round(laborMinutes), nutrientDays: round2(nutrientDays) };
}

// Compare what the proposer gives against what they get. The difference is
// settled in Harvest Credits when the trade completes, so an uneven trade is
// still fair — the fairness rating just tells both sides how much credit
// will move.
export function quoteTrade({ give = [], get = [] }, cov) {
  if (give.length === 0 && get.length === 0) {
    throw new Error('A trade needs at least one item.');
  }
  const giveSide = valueItems(give, cov);
  const getSide = valueItems(get, cov);
  const hi = Math.max(giveSide.credits, getSide.credits);
  const lo = Math.min(giveSide.credits, getSide.credits);
  const ratio = hi > 0 ? lo / hi : 1;
  let rating = 'balanced';
  if (ratio < 0.75) rating = 'uneven';
  else if (ratio < 0.9) rating = 'close';
  return {
    give: giveSide,
    get: getSide,
    // Positive: the proposer is owed credits; negative: they owe.
    creditDelta: round2(giveSide.credits - getSide.credits),
    ratio: round2(ratio),
    rating,
  };
}

// A member's balance: credits earned by giving minus credits spent receiving,
// across completed trades.
export function memberBalance(memberId, trades) {
  let balance = 0;
  for (const t of trades) {
    if (t.status !== 'completed') continue;
    if (t.fromId === memberId) balance += t.quote.creditDelta;
    else if (t.toId === memberId) balance -= t.quote.creditDelta;
  }
  return round2(balance);
}
