import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');

const EMPTY = { members: [], sessions: [], pledges: [], listings: [], trades: [] };

// Single-writer JSON file store, same approach as the cleaning app's lead
// store. Plenty for one neighborhood; swap for a real database before
// running more than one server instance.
let writeQueue = Promise.resolve();

export async function load() {
  if (!existsSync(DATA_FILE)) return structuredClone(EMPTY);
  const raw = await readFile(DATA_FILE, 'utf-8');
  if (!raw.trim()) return structuredClone(EMPTY);
  return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
}

// Run `fn` against the latest data and persist whatever it changed. Writes
// are serialized so concurrent requests can't clobber each other.
export function update(fn) {
  const run = writeQueue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await mkdir(path.dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(db, null, 2));
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}
