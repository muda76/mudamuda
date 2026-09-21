// Rule-based instant-estimate pricing engine.
// Mirrored in client/src/lib/pricing.js so the wizard can show a live
// price as the customer fills the form, without a round trip per keystroke.
// The server recomputes independently from the raw answers before a lead
// is saved, so a tampered client-side total is never trusted.

export const SERVICE_TYPES = {
  standard: { label: 'Standard Cleaning', ratePerSqft: 0.08, minimum: 89 },
  deep: { label: 'Deep Cleaning', ratePerSqft: 0.15, minimum: 149 },
  moveInOut: { label: 'Move In / Move Out', ratePerSqft: 0.18, minimum: 179 },
  postConstruction: { label: 'Post-Construction', ratePerSqft: 0.25, minimum: 249 },
};

export const CONDITIONS = {
  light: { label: 'Light — regularly maintained', multiplier: 1.0 },
  average: { label: 'Average — everyday buildup', multiplier: 1.15 },
  heavy: { label: 'Heavy — hasn’t been cleaned in a while', multiplier: 1.35 },
};

export const FREQUENCIES = {
  oneTime: { label: 'One-time', discount: 0 },
  monthly: { label: 'Monthly', discount: 0.05 },
  biweekly: { label: 'Every 2 weeks', discount: 0.1 },
  weekly: { label: 'Weekly', discount: 0.15 },
};

export const ADD_ONS = {
  insideFridge: { label: 'Inside fridge', price: 25 },
  insideOven: { label: 'Inside oven', price: 25 },
  interiorWindows: { label: 'Interior windows', price: 40 },
  insideCabinets: { label: 'Inside cabinets', price: 35 },
  laundry: { label: 'Laundry (per load)', price: 15 },
  garage: { label: 'Garage sweep', price: 30 },
  patio: { label: 'Patio / balcony', price: 25 },
};

const EXTRA_BEDROOM_FEE = 15;
const EXTRA_BATHROOM_FEE = 25;
const PETS_FEE = 20;
const ESTIMATE_SPREAD = 0.1; // shown as a +/-10% range, not a single number

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function calculateEstimate(input) {
  const serviceType = SERVICE_TYPES[input.serviceType] ? input.serviceType : 'standard';
  const condition = CONDITIONS[input.condition] ? input.condition : 'average';
  const frequency = FREQUENCIES[input.frequency] ? input.frequency : 'oneTime';
  const sqft = clampInt(input.sqft, 100, 20000, 1000);
  const bedrooms = clampInt(input.bedrooms, 0, 15, 1);
  const bathrooms = clampInt(input.bathrooms, 1, 15, 1);
  const addOns = Array.isArray(input.addOns) ? input.addOns.filter((key) => ADD_ONS[key]) : [];
  const hasPets = Boolean(input.hasPets);

  const service = SERVICE_TYPES[serviceType];
  const line = [];

  const sqftPrice = sqft * service.ratePerSqft;
  const base = Math.max(sqftPrice, service.minimum);
  line.push({ label: `${service.label} base (${sqft} sq ft)`, amount: round(base) });

  const extraBedrooms = Math.max(0, bedrooms - 1) * EXTRA_BEDROOM_FEE;
  if (extraBedrooms > 0) line.push({ label: `Extra bedrooms (${bedrooms - 1})`, amount: extraBedrooms });

  const extraBathrooms = Math.max(0, bathrooms - 1) * EXTRA_BATHROOM_FEE;
  if (extraBathrooms > 0) line.push({ label: `Extra bathrooms (${bathrooms - 1})`, amount: extraBathrooms });

  let addOnTotal = 0;
  for (const key of addOns) {
    addOnTotal += ADD_ONS[key].price;
    line.push({ label: ADD_ONS[key].label, amount: ADD_ONS[key].price });
  }

  if (hasPets) {
    line.push({ label: 'Pets in home', amount: PETS_FEE });
  }

  const subtotal = base + extraBedrooms + extraBathrooms + addOnTotal + (hasPets ? PETS_FEE : 0);

  const conditionMultiplier = CONDITIONS[condition].multiplier;
  const conditionAdjustment = subtotal * (conditionMultiplier - 1);
  if (conditionAdjustment !== 0) {
    line.push({ label: `Condition adjustment (${CONDITIONS[condition].label})`, amount: round(conditionAdjustment) });
  }

  const afterCondition = subtotal * conditionMultiplier;

  const frequencyDiscount = FREQUENCIES[frequency].discount;
  const discountAmount = afterCondition * frequencyDiscount;
  if (discountAmount > 0) {
    line.push({ label: `Recurring discount (${FREQUENCIES[frequency].label})`, amount: round(-discountAmount) });
  }

  const total = afterCondition - discountAmount;
  const low = round(total * (1 - ESTIMATE_SPREAD));
  const high = round(total * (1 + ESTIMATE_SPREAD));

  return {
    serviceType,
    condition,
    frequency,
    lineItems: line,
    subtotal: round(subtotal),
    total: round(total),
    low,
    high,
  };
}

function round(n) {
  return Math.round(n);
}
