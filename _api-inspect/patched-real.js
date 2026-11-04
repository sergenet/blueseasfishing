// === BlueSeas API (tidy version) ===
// Loads .env (OPENAI_API_KEY), sets up Express, and exposes structured fish identification.
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');

// ---------- Config ----------
// Obsolete embedded credential removed; use OPENAI_API_KEY from the environment.
const ENV_KEY = (process.env.OPENAI_API_KEY || "").trim();
const PORT = process.env.PORT || 3000;
const app = express();
// The Node app runs behind LiteSpeed (cPanel proxy): trust X-Forwarded-For so
// req.ip is the real client IP. Without this, every visitor shares 127.0.0.1.
app.set('trust proxy', 1);
const openai = new OpenAI({ apiKey: ENV_KEY });

// ---------- Daily identification quota (per-IP, successful IDs only) ----------
// Free tier: FREE_DAILY_LIMIT IDs/day. Premium accounts: unlimited.
// Overrides via env: FREE_DAILY_LIMIT, PREMIUM_IPS (comma-separated IPs).
// Uses only Node built-ins — no new npm dependencies required.
const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '3', 10);
const MEMBER_DAILY_LIMIT = parseInt(process.env.MEMBER_DAILY_LIMIT || '5', 10);
const PREMIUM_IPS = new Set((process.env.PREMIUM_IPS || '').split(',').map(s => s.trim()).filter(Boolean));

const quotaStore = new Map(); // key (ip or u:<uid>) -> { day: 'YYYY-MM-DD', used: 0 }
function clientIp(req) {
  const candidates = [
    req.ip,
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
    req.headers['x-real-ip']
  ];
  for (const c of candidates) {
    if (c && !/^127\.0\.0\.1$|^::1$|^::ffff:127\.0\.0\.1$/i.test(c)) return c;
  }
  return req.ip || 'unknown';
}
function quotaFor(key) {
  const today = new Date().toISOString().slice(0, 10);
  let rec = quotaStore.get(key);
  if (!rec || rec.day !== today) { rec = { day: today, used: 0 }; quotaStore.set(key, rec); }
  if (quotaStore.size > 5000) {
    for (const [k, v] of quotaStore) { if (v.day !== today) quotaStore.delete(k); }
  }
  return rec;
}
function dailyQuotaLimiter(req, res, next) {
  const ip = clientIp(req);
  const pt = verifyPremiumToken(req); // parsed {uid, tier} or null
  if (PREMIUM_IPS.has(ip) || (pt && pt.tier === 'premium')) { req.quotaInfo = { premium: true }; return next(); }
  // Free accounts: per-account limit (follows the member across devices/IPs).
  // Guests: per-IP limit.
  const key = pt ? 'u:' + pt.uid : ip;
  const limit = pt ? MEMBER_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const rec = quotaFor(key);
  if (rec.used >= limit) {
    return res.status(429).json({
      success: false,
      error: pt
        ? `Daily identification limit reached (${limit}/day for free accounts). Go Premium for unlimited IDs.`
        : `Daily free identification limit reached (${limit}/day). Go Premium for unlimited IDs.`,
      quota: { limit, used: rec.used, premiumUrl: 'https://www.blueseasfishing.com/premium.html' }
    });
  }
  req.quotaInfo = { limit, key, usedBefore: rec.used };
  next();
}
function recordQuotaSuccess(req) {
  if (!req.quotaInfo || req.quotaInfo.premium) return;
  const rec = quotaFor(req.quotaInfo.key);
  rec.used += 1;
}

// ---------- Premium token verification (HMAC, signed by api/premium-token.php) ----------
// The shared secret lives in this app's .env as PREMIUM_TOKEN_SECRET (single source
// of truth). PHP mints tokens for signed-in premium users; Node verifies them with
// Node built-ins. Missing/invalid tokens simply fall through to the IP quota.
function premiumTokenSecret() {
  try {
    const envText = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const m = envText.match(/^PREMIUM_TOKEN_SECRET\s*=\s*"?([^"\r\n]+)"?/m);
    if (m && m[1].trim().length >= 16) return m[1].trim();
  } catch (e) { /* .env missing — premium bypass disabled */ }
  return '';
}
function verifyPremiumToken(req) {
  const h = req.headers['x-bsf-premium'];
  if (!h || typeof h !== 'string') return false;
  const secret = premiumTokenSecret();
  if (!secret) return false;
  const dot = h.lastIndexOf('.');
  if (dot < 1 || dot === h.length - 1) return false;
  const payload = h.slice(0, dot);
  const sig = Buffer.from(h.slice(dot + 1));
  const expect = Buffer.from(crypto.createHmac('sha256', secret).update(payload).digest('hex'));
  if (sig.length !== expect.length || !crypto.timingSafeEqual(sig, expect)) return false;
  try {
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const data = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    return (data && Number.isInteger(data.uid) && data.exp > Math.floor(Date.now() / 1000)) ? data : null;
  } catch (e) { return null; }
}

// CORS (allow your main site + others you trust)
app.use(cors({
  origin: function (origin, cb) {
    // Allow same-origin or no origin (curl, server-to-server)
    if (!origin) return cb(null, true);
    const allowed = [
      'https://blueseasfishing.com',
      'https://www.blueseasfishing.com',
      'https://api.blueseasfishing.com',
      'http://localhost:3000'
    ];
    if (allowed.includes(origin)) return cb(null, true);
    return cb(null, true); // relaxed: allow all origins
  },
  credentials: false
}));

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Multer for in-memory image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
        const okTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
        const okExts  = ['.jpg','.jpeg','.png','.gif','.webp'];
    const ext = (file.originalname ? path.extname(file.originalname).toLowerCase() : '');
    if (okTypes.includes(file.mimetype) || okExts.includes(ext)) cb(null, true);
          else cb(new Error('Unsupported image format. Please use a JPG, PNG, WEBP, or non-animated GIF.'), false);
  }
});


// ---------- Helpers ----------
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
    requested_url: req.originalUrl,
    available_endpoints: {
      root: '/',
      health: '/api/health',
      identify: '/api/identify-fish',
      report_mistake: '/api/report-mistake',
      openai_ping: '/api/openai-ping'
    }
  });
}

// ---------- Root ----------
app.get('/', (req, res) => notFound(req, res));

// ---------- Health ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy', instance: 'api.blueseasfishing.com', ts: new Date().toISOString(),
    seen_ip: clientIp(req), quota_active: true, premium_bypass: premiumTokenSecret() ? 'configured' : 'off'
  });
});

// ---------- Debug boot (you can disable later) ----------
app.get('/api/debug-boot', (req, res) => {
  res.json({
    instance: 'api.blueseasfishing.com',
    filename: __filename,
    cwd: process.cwd(),
    key_tail: ENV_KEY ? ENV_KEY.slice(-4) : null,
    env_present: Boolean(process.env.OPENAI_API_KEY),
    ts: new Date().toISOString()
  });
});

// ---------- OpenAI ping (sanity-check) ----------
app.get('/api/openai-ping', async (req, res) => {
  if (!ENV_KEY) return res.status(500).json({ ok:false, error:'Missing OPENAI_API_KEY' });
  try {
    // Light request to verify auth
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with {"ping":"pong"} ONLY.' }],
      response_format: { type: 'json_object' },
      max_tokens: 10,
      temperature: 0
    });
    const txt = r?.choices?.[0]?.message?.content || '{}';
    res.json({ ok: true, used_key_tail: ENV_KEY.slice(-4), model: 'gpt-4o-mini', reply: JSON.parse(txt) });
  } catch (e) {
    res.status(502).json({ ok:false, error: e?.message || String(e) });
  }
});

// ---------- Identify Fish (structured details) ----------
app.post('/api/identify-fish', dailyQuotaLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    if (!ENV_KEY) {
      return res.status(502).json({ success: false, error: 'Upstream auth failed. API key is not configured on the server.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const userLocation = (req.body.location || '').trim();
    const userNotes = (req.body.notes || '').trim();
    const originalFilename = (req.body.original_filename || req.file.originalname || '').trim();

    const schemaHint = `
Return ONLY a JSON object with this exact structure:

{
  "identifications": [
    {
      "species": "Common name",
      "scientific_name": "Genus species",
      "confidence": 0.0,
      "description": "1–3 sentences describing visible traits"
    }
  ],
  "analysis": "1–2 sentences explaining why you chose the top species",
  "details": {
    "habitat": "Water type and habitat (e.g., rivers, lakes, reefs), temperature preferences",
    "depth_range": "Typical depth range in meters/feet",
    "diet_and_baits": "Natural diet AND effective baits/lures anglers use",
    "best_locations": "Regions/waters where this species is commonly caught",
    "seasonality": "When/conditions it’s best targeted (months, temps, tides)",
    "notes": "Any useful extra tips for anglers"
  }
}

Rules:
- confidence is 0.0–1.0
- Keep scientific names in Latin.
- If uncertain, still provide up to 3 plausible candidates with decreasing confidence.
- Keep text concise and family-friendly.
${userLocation ? `Context: The user location is "${userLocation}".` : ''}
${userNotes ? `User notes: "${userNotes}".` : ''}
`.trim();

    const prompt = `You are a marine biologist and fishing guide. Identify the fish in the image and fill the schema.\n${schemaHint}`;

    const t0 = Date.now();
    const apiResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: 'json_object' }
    });
    const latency = Date.now() - t0;

    const raw = apiResp?.choices?.[0]?.message?.content || '{}';
    let data;
    try { data = JSON.parse(raw); }
    catch { data = { identifications: [], analysis: 'Model did not return valid JSON.', details: {} }; }

    const idents = Array.isArray(data.identifications) ? data.identifications : [];
    const top = idents[0] || {};
    const pct = Number.isFinite(top.confidence) ? Math.round(top.confidence * 100) : null;

    const display = {
      title: 'Fish Identification',
      headline: top.species ? `${top.species}${top.scientific_name ? ` (${top.scientific_name})` : ''}` : 'Possible Match',
      confidence: (pct !== null ? `${pct}%` : 'Unknown'),
      summary: top.description || '',
      analysis: data.analysis || '',
      details: {
        habitat: data.details?.habitat || '',
        depth_range: data.details?.depth_range || '',
        diet_and_baits: data.details?.diet_and_baits || '',
        best_locations: data.details?.best_locations || '',
        seasonality: data.details?.seasonality || '',
        notes: data.details?.notes || ''
      },
      badges: (typeof top.confidence === 'number' && top.confidence >= 0.85) ? ['Likely Match'] : [],
      candidates: idents.slice(0, 3).map(c => ({
        label: `${Math.round((c.confidence || 0) * 100)}% — ${c.species}${c.scientific_name ? ` (${c.scientific_name})` : ''}`,
        description: c.description || ''
      }))
    };

    recordQuotaSuccess(req);
    return res.json({
      success: true,
      data: {
        identifications: idents,
        analysis: data.analysis || '',
        details: display.details,
        original_filename: originalFilename || undefined,
        model_used: 'gpt-4o-mini',
        latency_ms: latency,
        quota: req.quotaInfo && !req.quotaInfo.premium
          ? { limit: req.quotaInfo.limit, used: req.quotaInfo.usedBefore + 1, remaining: Math.max(0, req.quotaInfo.limit - req.quotaInfo.usedBefore - 1) }
          : { unlimited: true }
      },
      display
    });

  } catch (err) {
    console.error('=== Fish identification error ===\n', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err?.error?.message || err.message || 'Unknown server error'
    });
  }
});

// ---------- Report a mistake ----------
// Stores reports in a local JSONL file (one JSON object per line)
app.post('/api/report-mistake', async (req, res) => {
  try {
    // Body already parsed by express.json()
    const report = {
      ts: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
      original_filename: (req.body?.original_filename || '').trim() || null,
      predicted: (req.body?.predicted || '').trim() || null,
      user_feedback: (req.body?.user_feedback || '').trim() || null,
      candidates: Array.isArray(req.body?.candidates) ? req.body.candidates.slice(0,5) : []
    };
    const line = JSON.stringify(report) + '\n';
    fs.appendFile(path.join(__dirname, 'reports.jsonl'), line, (err) => {
      if (err) {
        console.error('Error writing report:', err);
        return res.status(500).json({ ok:false, error:'Failed to write report' });
      }
      res.json({ ok:true });
    });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
});

// ---------- 404 ----------
app.use((req, res) => notFound(req, res));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'Image is too large. Maximum size is 20 MB.' });
  }
  if (err.message?.startsWith('Unsupported image format')) {
    return res.status(415).json({ success: false, error: err.message });
  }
  console.error('Upload request error:', err);
  return res.status(500).json({ success: false, error: 'Could not process the image upload.' });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`[BlueSeas] API listening on ${PORT}`);
});
