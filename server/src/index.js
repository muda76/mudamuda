import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { calculateEstimate } from './pricing.js';
import { addLead, listLeads } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'letmein-admin';
if (!process.env.ADMIN_TOKEN) {
  console.warn('[server] ADMIN_TOKEN not set — using default demo token. Set ADMIN_TOKEN before deploying.');
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${nanoid(16)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Only image uploads (jpeg, png, webp, heic) are allowed.'));
      return;
    }
    cb(null, true);
  },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/estimate', (req, res) => {
  try {
    const estimate = calculateEstimate(req.body || {});
    res.json(estimate);
  } catch (err) {
    res.status(400).json({ error: 'Could not calculate an estimate from the details provided.' });
  }
});

app.post('/api/leads', upload.array('photos', 10), async (req, res) => {
  let answers;
  try {
    answers = JSON.parse(req.body.data || '{}');
  } catch {
    return res.status(400).json({ error: 'Malformed form data.' });
  }

  const contact = answers.contact || {};
  if (!contact.name || !contact.email || !contact.phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }

  const estimate = calculateEstimate(answers);
  const files = (req.files || []).map((f) => ({
    filename: f.filename,
    url: `/uploads/${f.filename}`,
    originalName: f.originalname,
  }));

  const lead = {
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    contact: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address || '',
      notes: contact.notes || '',
    },
    answers,
    estimate,
    photos: files,
  };

  await addLead(lead);
  res.status(201).json({ id: lead.id, estimate });
});

app.get('/api/leads', async (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const leads = await listLeads();
  res.json(leads);
});

// Multer errors (bad file type, too large, too many files) land here.
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message || 'Upload failed.' });
  }
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`[server] mudamuda cleaning API listening on http://localhost:${PORT}`);
});
