// === BlueSeas API (tidy version) ===
// Loads .env (OPENAI_API_KEY), sets up Express, and exposes structured fish identification.
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// ---------- Config ----------
// Obsolete embedded credential removed; use OPENAI_API_KEY from the environment.
const ENV_KEY = (process.env.OPENAI_API_KEY || "").trim();
const PORT = process.env.PORT || 3000;
const app = express();
const openai = new OpenAI({ apiKey: ENV_KEY });

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
  res.json({ status: 'healthy', instance: 'api.blueseasfishing.com', ts: new Date().toISOString() });
});

// ---------- Debug boot (you can disable later) ----------
app.get('/api/debug-boot', (req, res) => {
  res.json({
    instance: 'api.blueseasfishing.com',
    filename: __filename,
    cwd: process.cwd(),
    key_tail: ENV_KEY ? ENV_KEY.slice(-4) : null,
    env_present: Boolean(process.env.OPENAI_API_KEY),
    hardcoded_present: Boolean(HARDCODED_KEY),
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
app.post('/api/identify-fish', upload.single('image'), async (req, res) => {
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

    return res.json({
      success: true,
      data: {
        identifications: idents,
        analysis: data.analysis || '',
        details: display.details,
        original_filename: originalFilename || undefined,
        model_used: 'gpt-4o-mini',
        latency_ms: latency
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
