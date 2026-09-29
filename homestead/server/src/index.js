import { createApp } from './app.js';

const PORT = process.env.PORT || 4100;

createApp().listen(PORT, () => {
  console.log(`[server] Homestead Commons API listening on http://localhost:${PORT}`);
});
