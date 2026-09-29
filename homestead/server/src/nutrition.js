import { NUTRIENTS, PRODUCTS, getProduct, inSeason } from './catalog.js';

// A suburb isn't going to feed itself entirely from backyards. The community
// sets what share of its members' weekly nutrition it aims to source locally,
// and coverage is measured against that target.
export const DEFAULT_LOCAL_GOAL = 0.25;

export function emptyNutrients() {
  return Object.fromEntries(NUTRIENTS.map((n) => [n.key, 0]));
}

// Share of each nutrient's Daily Value that one unit of a product supplies.
export function percentDailyValue(product) {
  return Object.fromEntries(
    NUTRIENTS.map((n) => [n.key, (product.nutrients[n.key] || 0) / n.dailyValue]),
  );
}

// Weekly nutrient needs for the whole community at its local-sourcing goal.
export function weeklyNeeds(members, goal = DEFAULT_LOCAL_GOAL) {
  const people = members.reduce((sum, m) => sum + (Number(m.householdSize) || 1), 0);
  return Object.fromEntries(NUTRIENTS.map((n) => [n.key, n.dailyValue * 7 * people * goal]));
}

// Weekly nutrients supplied by in-season pledges for the given month.
export function weeklySupply(pledges, month) {
  const supply = emptyNutrients();
  for (const pledge of pledges) {
    const product = getProduct(pledge.productId);
    if (!product || !inSeason(product, month)) continue;
    for (const n of NUTRIENTS) {
      supply[n.key] += (product.nutrients[n.key] || 0) * pledge.quantityPerWeek;
    }
  }
  return supply;
}

// Coverage ratio per nutrient: 1 means the local goal is fully met.
export function coverage(supply, needs) {
  return Object.fromEntries(
    NUTRIENTS.map((n) => [n.key, needs[n.key] > 0 ? supply[n.key] / needs[n.key] : 0]),
  );
}

// How well a product would fill the community's current gaps, 0–1. Each
// nutrient's contribution is weighted by how far short the community is on
// it, so a product that's rich in exactly what's missing scores highest.
export function gapScore(product, cov) {
  const pct = percentDailyValue(product);
  let weighted = 0;
  let total = 0;
  for (const n of NUTRIENTS) {
    const contribution = Math.min(pct[n.key], 1);
    const deficit = Math.max(0, 1 - (cov[n.key] ?? 0));
    weighted += contribution * deficit;
    total += contribution;
  }
  return total > 0 ? weighted / total : 0;
}

// Nutrients below the goal, worst first, each with the in-season products
// that supply the most of it per labor-hour — the most efficient way for a
// neighbor to help close that gap.
export function recommendations(cov, month, limit = 3) {
  const seasonal = PRODUCTS.filter((p) => inSeason(p, month));
  return NUTRIENTS.filter((n) => cov[n.key] < 1)
    .sort((a, b) => cov[a.key] - cov[b.key])
    .map((n) => {
      const ranked = seasonal
        .map((p) => ({
          productId: p.id,
          name: p.name,
          perLaborHour: (p.nutrients[n.key] || 0) / n.dailyValue / (p.laborMinutes / 60),
        }))
        .filter((r) => r.perLaborHour > 0)
        .sort((a, b) => b.perLaborHour - a.perLaborHour)
        .slice(0, limit);
      return { nutrient: n.key, label: n.label, coverage: cov[n.key], products: ranked };
    });
}

export function communitySnapshot({ members, pledges, month, goal = DEFAULT_LOCAL_GOAL }) {
  const needs = weeklyNeeds(members, goal);
  const supply = weeklySupply(pledges, month);
  const cov = coverage(supply, needs);
  return {
    month,
    goal,
    people: members.reduce((sum, m) => sum + (Number(m.householdSize) || 1), 0),
    households: members.length,
    nutrients: NUTRIENTS.map((n) => ({
      ...n,
      need: needs[n.key],
      supply: supply[n.key],
      coverage: cov[n.key],
    })),
    recommendations: recommendations(cov, month),
    coverage: cov,
  };
}
