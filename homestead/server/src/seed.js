// CLI: fill an empty database with demo neighbors. Refuses to touch a
// database that already has members.
import { seedDemo } from './demo.js';

if (await seedDemo()) {
  console.log('[seed] Added demo neighbors. Log in as maria@example.com / harvest123.');
} else {
  console.log('[seed] Database already has members; not seeding. Delete server/data/db.json to start over.');
}
