import { createApp } from './app.js';
import { seedDemo } from './demo.js';

const PORT = process.env.PORT || 4100;

// On hosts without a persistent disk (e.g. Render's free tier) the database
// resets on every restart; SEED_DEMO=true refills it with demo neighbors.
if (process.env.SEED_DEMO === 'true' && (await seedDemo())) {
  console.log('[server] Seeded demo neighbors (SEED_DEMO=true).');
}

createApp().listen(PORT, () => {
  console.log(`[server] Homestead Commons listening on http://localhost:${PORT}`);
});
