// The catalog of things a suburban household can realistically produce.
//
// Nutrient figures are per *unit* and are rounded approximations derived from
// USDA FoodData Central values for the raw/typical form of each food. They're
// good enough to show a neighborhood where its gaps are, not to plan a
// clinical diet.
//
// laborMinutes and inputCost are rough per-unit averages for a hobby-scale
// producer (a few raised beds, a small flock, one hive). They drive the
// "fair value" of each unit in trades, so a community may want to tune them
// to its own experience — they live in one place for that reason.

// FDA adult Daily Values (2,000 kcal reference diet).
export const NUTRIENTS = [
  { key: 'kcal', label: 'Calories', unit: 'kcal', dailyValue: 2000 },
  { key: 'protein', label: 'Protein', unit: 'g', dailyValue: 50 },
  { key: 'fiber', label: 'Fiber', unit: 'g', dailyValue: 28 },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', dailyValue: 900 },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', dailyValue: 90 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dailyValue: 1300 },
  { key: 'iron', label: 'Iron', unit: 'mg', dailyValue: 18 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', dailyValue: 4700 },
  { key: 'folate', label: 'Folate', unit: 'mcg', dailyValue: 400 },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg', dailyValue: 2.4 },
];

export const ACTIVITIES = [
  {
    id: 'baking',
    name: 'Baking',
    icon: '🍞',
    blurb: 'Bread and grain goods from a home kitchen.',
    localRules:
      "Trading with neighbors is generally informal, but selling baked goods in Illinois falls under the Home-to-Market (cottage food) rules, which require registering with your local health department. Check your county's requirements before selling.",
  },
  {
    id: 'poultry',
    name: 'Backyard hens',
    icon: '🐔',
    blurb: 'A small laying flock for eggs.',
    localRules:
      'Many Chicago-area suburbs allow a small number of hens (often 4–8) with a permit, and ban roosters. Coop setbacks from property lines are common. Rules vary a lot by village, so check your municipal code before building a coop.',
  },
  {
    id: 'vegetables',
    name: 'Vegetable garden',
    icon: '🥕',
    blurb: 'Raised beds, in-ground plots, or containers.',
    localRules:
      'Backyard vegetable gardens are allowed nearly everywhere. Some villages limit front-yard gardens or require setbacks for raised beds and compost bins, and HOAs may have their own rules.',
  },
  {
    id: 'fruit',
    name: 'Fruit & berries',
    icon: '🍓',
    blurb: 'Berry patches and dwarf fruit trees.',
    localRules:
      'Fruit trees and berry bushes are generally allowed. Check parkway-planting rules before planting near the street.',
  },
  {
    id: 'grains',
    name: 'Grains & dry beans',
    icon: '🌾',
    blurb: 'Small-plot wheat, dry beans, and other storage crops.',
    localRules:
      'Small grain plots count as ordinary gardening. Some villages have weed or grass height ordinances that tall grain can run into, so tell your neighbors and code enforcement what it is.',
  },
  {
    id: 'bees',
    name: 'Beekeeping',
    icon: '🐝',
    blurb: 'A hive or two for honey and pollination.',
    localRules:
      'Illinois requires beekeepers to register their colonies with the state Department of Agriculture. Many suburbs also limit the number of hives and require a water source and flyway barriers.',
  },
  {
    id: 'fungi',
    name: 'Mushrooms',
    icon: '🍄',
    blurb: 'Oyster and shiitake on logs, straw, or indoors.',
    localRules: 'Growing mushrooms indoors or on logs in the yard is generally unrestricted.',
  },
];

// Months are 1–12; `season` lists the months a producer can typically supply
// the product in northern Illinois (zone 5b/6a), including storage crops.
const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const PRODUCTS = [
  {
    id: 'sourdough',
    name: 'Whole-wheat sourdough',
    activity: 'baking',
    unit: 'loaf (~700 g)',
    laborMinutes: 45,
    inputCost: 2.5,
    season: ALL_YEAR,
    nutrients: { kcal: 1750, protein: 70, fiber: 30, vitaminA: 0, vitaminC: 0, calcium: 180, iron: 17, potassium: 1500, folate: 290, vitaminB12: 0 },
  },
  {
    id: 'eggs',
    name: 'Eggs',
    activity: 'poultry',
    unit: 'dozen',
    laborMinutes: 60,
    inputCost: 3.5,
    season: ALL_YEAR,
    nutrients: { kcal: 860, protein: 76, fiber: 0, vitaminA: 960, vitaminC: 0, calcium: 340, iron: 10.8, potassium: 830, folate: 290, vitaminB12: 5.4 },
  },
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 15,
    inputCost: 0.5,
    season: [7, 8, 9, 10],
    nutrients: { kcal: 82, protein: 4, fiber: 5.4, vitaminA: 190, vitaminC: 62, calcium: 45, iron: 1.2, potassium: 1075, folate: 68, vitaminB12: 0 },
  },
  {
    id: 'greens',
    name: 'Kale & chard',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 20,
    inputCost: 0.6,
    season: [5, 6, 7, 8, 9, 10, 11],
    nutrients: { kcal: 180, protein: 13.6, fiber: 16, vitaminA: 1130, vitaminC: 295, calcium: 680, iron: 7.7, potassium: 1630, folate: 180, vitaminB12: 0 },
  },
  {
    id: 'carrots',
    name: 'Carrots',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 15,
    inputCost: 0.4,
    season: [7, 8, 9, 10, 11, 12, 1, 2],
    nutrients: { kcal: 186, protein: 4.2, fiber: 12.7, vitaminA: 3790, vitaminC: 27, calcium: 150, iron: 1.4, potassium: 1450, folate: 86, vitaminB12: 0 },
  },
  {
    id: 'potatoes',
    name: 'Potatoes',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 8,
    inputCost: 0.35,
    season: [8, 9, 10, 11, 12, 1, 2, 3],
    nutrients: { kcal: 350, protein: 9.1, fiber: 10, vitaminA: 0, vitaminC: 89, calcium: 54, iron: 3.6, potassium: 1930, folate: 68, vitaminB12: 0 },
  },
  {
    id: 'peppers',
    name: 'Sweet peppers',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 20,
    inputCost: 0.6,
    season: [7, 8, 9, 10],
    nutrients: { kcal: 141, protein: 4.5, fiber: 9.5, vitaminA: 710, vitaminC: 580, calcium: 32, iron: 1.9, potassium: 960, folate: 210, vitaminB12: 0 },
  },
  {
    id: 'squash',
    name: 'Winter squash',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 6,
    inputCost: 0.25,
    season: [9, 10, 11, 12, 1, 2],
    nutrients: { kcal: 204, protein: 4.5, fiber: 9.1, vitaminA: 2410, vitaminC: 95, calcium: 218, iron: 3.2, potassium: 1600, folate: 123, vitaminB12: 0 },
  },
  {
    id: 'onions',
    name: 'Onions & garlic',
    activity: 'vegetables',
    unit: 'lb',
    laborMinutes: 10,
    inputCost: 0.3,
    season: [7, 8, 9, 10, 11, 12, 1, 2, 3],
    nutrients: { kcal: 182, protein: 5, fiber: 7.7, vitaminA: 0, vitaminC: 34, calcium: 104, iron: 0.9, potassium: 660, folate: 86, vitaminB12: 0 },
  },
  {
    id: 'sweetcorn',
    name: 'Sweet corn',
    activity: 'vegetables',
    unit: 'dozen ears',
    laborMinutes: 30,
    inputCost: 1.5,
    season: [7, 8, 9],
    nutrients: { kcal: 930, protein: 35.6, fiber: 21.6, vitaminA: 97, vitaminC: 73, calcium: 22, iron: 5.4, potassium: 2920, folate: 450, vitaminB12: 0 },
  },
  {
    id: 'herbs',
    name: 'Fresh herbs',
    activity: 'vegetables',
    unit: 'bunch',
    laborMinutes: 5,
    inputCost: 0.15,
    season: [5, 6, 7, 8, 9, 10],
    nutrients: { kcal: 11, protein: 0.9, fiber: 1, vitaminA: 126, vitaminC: 40, calcium: 41, iron: 1.9, potassium: 166, folate: 46, vitaminB12: 0 },
  },
  {
    id: 'strawberries',
    name: 'Strawberries',
    activity: 'fruit',
    unit: 'pint',
    laborMinutes: 25,
    inputCost: 0.75,
    season: [6, 7],
    nutrients: { kcal: 109, protein: 2.4, fiber: 6.8, vitaminA: 3, vitaminC: 200, calcium: 54, iron: 1.4, potassium: 520, folate: 82, vitaminB12: 0 },
  },
  {
    id: 'apples',
    name: 'Apples',
    activity: 'fruit',
    unit: 'lb',
    laborMinutes: 10,
    inputCost: 0.3,
    season: [8, 9, 10, 11, 12, 1],
    nutrients: { kcal: 236, protein: 1.2, fiber: 10.9, vitaminA: 14, vitaminC: 21, calcium: 27, iron: 0.5, potassium: 486, folate: 14, vitaminB12: 0 },
  },
  {
    id: 'drybeans',
    name: 'Dry beans',
    activity: 'grains',
    unit: 'lb (dry)',
    laborMinutes: 60,
    inputCost: 0.5,
    season: [10, 11, 12, 1, 2, 3, 4, 5],
    nutrients: { kcal: 1548, protein: 98, fiber: 70, vitaminA: 0, vitaminC: 0, calcium: 558, iron: 22.7, potassium: 6730, folate: 2016, vitaminB12: 0 },
  },
  {
    id: 'wheat',
    name: 'Wheat berries',
    activity: 'grains',
    unit: 'lb',
    laborMinutes: 40,
    inputCost: 0.3,
    season: [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
    nutrients: { kcal: 1492, protein: 70, fiber: 55, vitaminA: 0, vitaminC: 0, calcium: 113, iron: 16.3, potassium: 1540, folate: 172, vitaminB12: 0 },
  },
  {
    id: 'honey',
    name: 'Honey',
    activity: 'bees',
    unit: 'lb jar',
    laborMinutes: 45,
    inputCost: 2,
    season: [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
    nutrients: { kcal: 1380, protein: 1.4, fiber: 0.9, vitaminA: 0, vitaminC: 2.3, calcium: 27, iron: 1.9, potassium: 236, folate: 9, vitaminB12: 0 },
  },
  {
    id: 'mushrooms',
    name: 'Oyster mushrooms',
    activity: 'fungi',
    unit: 'lb',
    laborMinutes: 30,
    inputCost: 1.5,
    season: ALL_YEAR,
    nutrients: { kcal: 150, protein: 15, fiber: 10.4, vitaminA: 9, vitaminC: 0, calcium: 14, iron: 5.9, potassium: 1900, folate: 173, vitaminB12: 0 },
  },
];

const PRODUCT_INDEX = new Map(PRODUCTS.map((p) => [p.id, p]));

export function getProduct(id) {
  return PRODUCT_INDEX.get(id);
}

export function inSeason(product, month) {
  return product.season.includes(month);
}
