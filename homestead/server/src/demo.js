// A handful of demo neighbors so the dashboard and market have something to
// show. Every demo account's password is "harvest123".
import { nanoid } from 'nanoid';
import { load, update } from './store.js';
import { hashPassword } from './auth.js';
import { quoteTrade } from './valuation.js';

const NEIGHBORS = [
  { name: 'Maria Kowalski', neighborhood: 'Downers Grove', householdSize: 4, bio: 'Sourdough every Saturday. Starter is 11 years old.', pledges: [['sourdough', 6]], listings: [['sourdough', 3, 'Fresh Saturday morning — porch pickup.']] },
  { name: 'Dave Okafor', neighborhood: 'Downers Grove', householdSize: 3, bio: 'Six hens and far too many eggs.', pledges: [['eggs', 3]], listings: [['eggs', 2, 'Brown eggs, collected this week.']] },
  { name: 'Priya Raman', neighborhood: 'Westmont', householdSize: 2, bio: 'Four raised beds, heavy on greens and peppers.', pledges: [['greens', 5], ['peppers', 4], ['herbs', 6]], listings: [['greens', 4, 'Lacinato kale and rainbow chard.']] },
  { name: 'Tom Brennan', neighborhood: 'Lisle', householdSize: 5, bio: 'Quarter-acre lot turned into a potato and squash patch.', pledges: [['potatoes', 15], ['squash', 10], ['onions', 5]], listings: [['squash', 12, 'Butternut and acorn, cured and ready to store.']] },
  { name: 'Jen Liu', neighborhood: 'Westmont', householdSize: 3, bio: 'Two hives behind the garage.', pledges: [['honey', 2]], listings: [['honey', 4, 'Summer wildflower honey.']] },
  { name: 'Sam Novak', neighborhood: 'Lisle', householdSize: 2, bio: 'Tomatoes, carrots, and a dwarf apple orchard.', pledges: [['tomatoes', 10], ['carrots', 6], ['apples', 8]], listings: [['apples', 10, 'Honeycrisp and Liberty.']] },
  { name: 'Aisha Grant', neighborhood: 'Downers Grove', householdSize: 4, bio: 'Growing dry beans and experimenting with a small wheat plot.', pledges: [['drybeans', 3], ['wheat', 4]], listings: [] },
  { name: 'Luis Herrera', neighborhood: 'Woodridge', householdSize: 1, bio: 'Oyster mushrooms in the basement.', pledges: [['mushrooms', 3]], listings: [['mushrooms', 2, 'Blue oysters, picked the morning of.']] },
];

// Adds the demo neighbors if the database has no members yet. Returns whether
// it seeded, so callers can report it.
export async function seedDemo() {
  const db = await load();
  if (db.members.length > 0) return false;
  await update((data) => {
    const now = new Date().toISOString();
    const passwordHash = hashPassword('harvest123');
    for (const n of NEIGHBORS) {
      const id = nanoid(10);
      const email = `${n.name.split(' ')[0].toLowerCase()}@example.com`;
      data.members.push({ id, name: n.name, email, passwordHash, neighborhood: n.neighborhood, householdSize: n.householdSize, bio: n.bio, joinedAt: now });
      for (const [productId, quantityPerWeek] of n.pledges) {
        data.pledges.push({ id: nanoid(10), memberId: id, productId, quantityPerWeek, note: '', createdAt: now });
      }
      for (const [productId, quantity, note] of n.listings) {
        data.listings.push({ id: nanoid(10), memberId: id, productId, quantity, note, createdAt: now });
      }
    }

    // One finished trade so balances aren't all zero: bread for eggs.
    const [maria, dave] = data.members;
    const give = [{ productId: 'sourdough', quantity: 2 }];
    const get = [{ productId: 'eggs', quantity: 1 }];
    data.trades.push({
      id: nanoid(10),
      fromId: maria.id,
      toId: dave.id,
      give,
      get,
      quote: quoteTrade({ give, get }),
      listingId: null,
      message: 'Two loaves for a dozen?',
      status: 'completed',
      createdAt: now,
      history: [
        { status: 'proposed', at: now, by: maria.id },
        { status: 'accepted', at: now, by: dave.id },
        { status: 'completed', at: now, by: dave.id },
      ],
    });
  });
  return true;
}
