// === BlueSeas API (with friendly errors + diagnostics) ===
require('dotenv').config({ path: __dirname + '/.env', override: true });

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// ---------- Config ----------
const ENV_KEY = (process.env.OPENAI_API_KEY || "")
  .replace(/^["']|["']$/g, "") // strip accidental quotes
  .trim();
const PORT = process.env.PORT || 3000;
const app = express();
const openai = new OpenAI({ apiKey: ENV_KEY });

// Model knob in one place
const VISION_MODEL = 'gpt-4o-mini';

console.log('[BlueSeas] server starting');
console.log('[BlueSeas] key tail:', ENV_KEY ? ENV_KEY.slice(-4) : '(none)');

// CORS (allow your site)
app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    const allowed = [
      'https://blueseasfishing.com',
      'https://www.blueseasfishing.com',
      'https://api.blueseasfishing.com',
      'http://localhost:3000'
    ];
    if (allowed.includes(origin)) return cb(null, true);
    return cb(null, true); // relaxed
  }
}));

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Multer for in-memory image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.tiff'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowed.includes(ext) || (file.mimetype||'').startsWith('image/')) return cb(null, true);
    return cb(new Error(`Only image files are allowed. Received ${file.mimetype} ${ext}`), false);
  }
});

function setNoStore(res) {
  res.set('Cache-Control', 'no-store');
}
function notFound(req, res) {
  setNoStore(res);
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
      openai_ping: '/api/openai-ping',
      debug_boot: '/api/debug-boot'
    }
  });
}

// ---------- Root ----------
app.get('/', (req, res) => notFound(req, res));

// ---------- Health ----------
app.get('/api/health', (req, res) => {
  setNoStore(res);
  res.json({ status: 'healthy', instance: 'api.blueseasfishing.com', ts: new Date().toISOString() });
});

// ---------- Debug boot ----------
app.get('/api/debug-boot', (req, res) => {
  setNoStore(res);
  res.json({
    instance: 'api.blueseasfishing.com',
    filename: __filename,
    cwd: process.cwd(),
    env_present: Boolean(process.env.OPENAI_API_KEY),
    ts: new Date().toISOString()
  });
});

// ---------- OpenAI ping (add ?verbose=1 to see raw upstream error) ----------
app.get('/api/openai-ping', async (req, res) => {
  setNoStore(res);
  if (!ENV_KEY) return res.status(503).json({ ok:false, error:'Service unavailable.' });
  try {
    const r = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [{ role: 'user', content: 'Reply with {"ping":"pong"} ONLY.' }],
      response_format: { type: 'json_object' },
      max_tokens: 10,
      temperature: 0
    });
    const txt = r?.choices?.[0]?.message?.content || '{}';
    return res.json({ ok: true, used_key_tail: ENV_KEY.slice(-4), model: VISION_MODEL, reply: JSON.parse(txt) });
  } catch (e) {
    const status = e?.status || 502;
    const code = e?.error?.code || e?.code || '';
    const raw = e?.error?.message || e?.message || 'Upstream error';
    const friendly = (status === 401 || code === 'invalid_api_key')
      ? 'Service temporarily unavailable.'
      : raw;

    if (req.query.verbose === '1') {
      return res.status(status === 401 ? 503 : status).json({ ok:false, status, code, raw, model: VISION_MODEL });
    }
    return res.status(status === 401 ? 503 : status).json({ ok:false, error: friendly });
  }
});

// ---------- Identify Fish ----------
app.post('/api/identify-fish', upload.single('image'), async (req, res) => {
  setNoStore(res);
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    if (!ENV_KEY) {
      return res.status(503).json({ success: false, error: 'Service temporarily unavailable.' });
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
    { "species": "Common name", "scientific_name": "Genus species", "confidence": 0.0, "description": "1–3 sentences describing visible traits" }
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
- If uncertain, provide up to 3 plausible candidates with decreasing confidence.
- Keep text concise and family-friendly.
- Beware of lookalike species: salmonids (trout vs salmon vs char — check spotting pattern, jaw, tail), black vs white crappie, bluegill vs pumpkinseed vs redear, smallmouth vs largemouth vs spotted bass, mackerels, snappers, and grey sharks. Compare these explicitly when the photo is ambiguous.
- If the top candidate is below 60% confidence, or a close lookalike is plausible, include the top 3 candidates so the user can compare.
${userLocation ? `Context: The user location is "${userLocation}".` : ''}
${userNotes ? `User notes: "${userNotes}".` : ''}
`.trim();

    const prompt = `You are a marine biologist and fishing guide. Identify the fish in the image and fill the schema.\n${schemaHint}`;
    const t0 = Date.now();
    const apiResp = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
        ]}
      ],
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: 'json_object' }
    });
    const latency = Date.now() - t0;

    // Parse and validate
    const raw = apiResp?.choices?.[0]?.message?.content || '{}';
    let data;
    try { data = JSON.parse(raw); }
    catch { 
      return res.status(502).json({ success:false, error:'The identifier returned unreadable data. Please try another photo.' });
    }

    const idents = Array.isArray(data.identifications) ? data.identifications : [];
    if (!idents.length) {
      return res.status(422).json({ success:false, error:'We could not confidently identify this fish from the photo. Try a clearer side profile in good light.' });
    }

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
        model_used: VISION_MODEL,
        latency_ms: latency
      },
      display
    });

  } catch (err) {
    console.error('=== Fish identification error ===\n', err);
    const status = err?.status || 500;
    const code = err?.error?.code || err?.code || '';
    const friendly = (status === 401 || code === 'invalid_api_key')
      ? 'Service temporarily unavailable.'
      : (err?.error?.message || err.message || 'Unknown server error');
    return res.status(status === 401 ? 503 : status).json({ success: false, error: friendly });
  }
});

// ---------- Report a mistake ----------
app.post('/api/report-mistake', async (req, res) => {
  setNoStore(res);
  try {
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

// ---------- Error handler (upload & generic) ----------
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  if (err && (err.code === 'LIMIT_FILE_SIZE')) {
    return res.status(413).json({ success: false, error: 'Image is too large (max 10 MB).' });
  }
  if (err && /Only image files are allowed/i.test(err.message || '')) {
    return res.status(415).json({ success: false, error: 'Only image files are allowed (jpg, png, webp, gif, bmp, tiff).' });
  }
  res.status(500).json({ success: false, error: 'Server error. Please try again.' });
});

// ---------- 404 ----------
app.use((req, res) => notFound(req, res));

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`[BlueSeas] API listening on ${PORT}`);
});
