import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'leads.json');

// Single-writer JSON file store. Fine for a small business's quote-request
// volume; a real multi-instance deployment would swap this for a database
// without touching the routes that call it.
let writeQueue = Promise.resolve();

async function readAll() {
  if (!existsSync(DATA_FILE)) return [];
  const raw = await readFile(DATA_FILE, 'utf-8');
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

export async function listLeads() {
  return readAll();
}

export async function addLead(lead) {
  writeQueue = writeQueue.then(async () => {
    const leads = await readAll();
    leads.unshift(lead);
    await writeFile(DATA_FILE, JSON.stringify(leads, null, 2));
  });
  await writeQueue;
  return lead;
}
