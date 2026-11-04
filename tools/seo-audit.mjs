// Reusable live-site SEO audit. Usage:
//   node tools/seo-audit.mjs https://blueseasfishing.com [maxPages]
// Writes tools/.audit-<host>.json and prints a readable summary.
// Design goals: never hang (per-request timeout + hard deadline), tolerate
// broken TLS/redirects, and report *facts* we can act on.
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node tools/seo-audit.mjs https://example.com [maxPages]');
  process.exit(1);
}
const maxPages = Number(process.argv[3] || 40);
const origin = new URL(target).origin;
const started = Date.now();
const DEADLINE_MS = 90_000;

async function get(url, { timeout = 12_000, redirect = 'follow' } = {}) {
  if (Date.now() - started > DEADLINE_MS) throw new Error('audit deadline exceeded');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      redirect,
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; SEOAudit/1.0; +' + origin + ')',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate',
      },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      url,
      status: res.status,
      location: res.headers.get('location') || '',
      contentType: res.headers.get('content-type') || '',
      encoding: res.headers.get('content-encoding') || '',
      bytes: buf.length,
      ms: Date.now() - t0,
      body: buf.toString('utf8'),
      headers: Object.fromEntries(res.headers.entries()),
    };
  } finally {
    clearTimeout(t);
  }
}

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["']${name}["'][^>]*>`,
    'i',
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? null;
}

function analyse(page) {
  const h = page.body || '';
  const title = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
  const desc = meta(h, 'description');
  const canonical = h.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0]
    ?.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
  const h1 = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  const h2count = (h.match(/<h2[\s>]/gi) || []).length;
  const imgs = [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgsNoAlt = imgs.filter((i) => !/\balt\s*=\s*["'][^"']+["']/i.test(i)).length;
  const internal = new Set();
  const external = new Set();
  for (const m of h.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) {
    const href = m[1];
    if (href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
    try {
      const u = new URL(href, page.url);
      if (u.origin === origin) internal.add(u.pathname + u.search);
      else external.add(u.hostname);
    } catch {}
  }
  const jsonLd = [...h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  const ldTypes = [];
  for (const [, raw] of jsonLd) {
    try {
      const parsed = JSON.parse(raw.trim());
      const walk = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(walk);
        if (n['@type']) ldTypes.push([].concat(n['@type']).join('+'));
        if (n['@graph']) walk(n['@graph']);
      };
      walk(parsed);
    } catch {
      ldTypes.push('INVALID_JSON');
    }
  }
  return {
    url: page.url,
    status: page.status,
    ttfbMs: page.ms,
    kb: Math.round(page.bytes / 1024),
    title,
    titleLen: title.length,
    desc,
    descLen: desc ? desc.length : 0,
    canonical: canonical || null,
    selfCanonical: canonical ? new URL(canonical, page.url).href === page.url ||
      new URL(canonical, page.url).pathname === new URL(page.url).pathname : false,
    h1,
    h1count: h1.length,
    h2count,
    words: text(h).split(' ').filter(Boolean).length,
    imgs: imgs.length,
    imgsNoAlt,
    internalLinks: internal.size,
    externalHosts: [...external].slice(0, 10),
    jsonLdTypes: [...new Set(ldTypes)],
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(h),
    hasOg: /property=["']og:title["']/i.test(h),
    hasTwitter: /name=["']twitter:card["']/i.test(h),
    hasGA: /gtag\(|googletagmanager|G-[A-Z0-9]{8,}|analytics\.js/i.test(h),
    hasAds: /pagead2|adsbygoogle|ca-pub-/i.test(h),
    hasAffiliate: /awin1\.com|awinmid|amazon-adsystem|tag=[a-z0-9-]+-20/i.test(h),
    hreflang: [...h.matchAll(/hreflang=["']([^"']+)["']/gi)].map((m) => m[1]).slice(0, 30),
    noindex: /<meta[^>]+robots[^>]+noindex/i.test(h),
  };
}

const report = { origin, ranAt: new Date().toISOString(), pages: [], errors: [], extra: {} };

// --- robots.txt + sitemaps -------------------------------------------------
try {
  const r = await get(origin + '/robots.txt', { timeout: 8000 });
  report.extra.robots = { status: r.status, body: r.body.slice(0, 2000) };
} catch (e) {
  report.errors.push(['robots', String(e.message)]);
}
for (const sm of ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml']) {
  try {
    const r = await get(origin + sm, { timeout: 12_000 });
    if (r.status !== 200) continue;
    const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    const isIndex = /<sitemapindex/i.test(r.body);
    report.extra.sitemap = report.extra.sitemap || { url: sm, isIndex, locs: [] };
    if (isIndex) {
      report.extra.sitemap.locs = locs;
      let total = 0;
      for (const child of locs.slice(0, 12)) {
        try {
          const c = await get(child, { timeout: 10_000 });
          total += [...c.body.matchAll(/<loc>/gi)].length;
        } catch {}
      }
      report.extra.sitemap.approxUrls = total;
    } else {
      report.extra.sitemap.locs = locs;
      report.extra.sitemap.approxUrls = locs.length;
    }
    break;
  } catch (e) {
    report.errors.push([sm, String(e.message)]);
  }
}

// --- homepage + a spread of discovered URLs --------------------------------
const queue = [origin + '/'];
const seen = new Set();
const pageReports = [];
while (queue.length && pageReports.length < maxPages) {
  const url = queue.shift();
  let key;
  try {
    key = new URL(url).pathname;
  } catch {
    continue;
  }
  if (seen.has(key)) continue;
  seen.add(key);
  let page;
  try {
    page = await get(url);
  } catch (e) {
    report.errors.push([url, String(e.message)]);
    continue;
  }
  if (!/text\/html/.test(page.contentType)) {
    report.errors.push([url, `non-html ${page.contentType} (${page.bytes}b), redirect=${page.location}`]);
    continue;
  }
  const a = analyse(page);
  pageReports.push(a);
  // crawl breadth: follow internal links from homepage + sitemap seeds
  const sitemapUrls = (report.extra.sitemap?.locs || []).filter((u) => !/\.xml$/i.test(u));
  for (const u of sitemapUrls.slice(0, 60)) {
    try {
      const p = new URL(u).pathname;
      if (!seen.has(p) && queue.length < maxPages * 3) queue.push(u);
    } catch {}
  }
}
report.pages = pageReports;

// --- summarise -------------------------------------------------------------
const outDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const host = new URL(origin).hostname.replace(/[^a-z0-9.-]/gi, '_');
const outFile = path.join(outDir, `.audit-${host}.json`);
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(`\n=== ${origin} — ${pageReports.length} pages analysed in ${Math.round((Date.now() - started) / 1000)}s ===`);
console.log('robots.txt:', report.extra.robots ? `${report.extra.robots.status}` : 'MISSING/ERROR');
console.log('sitemap:', report.extra.sitemap
  ? `${report.extra.sitemap.url} index=${report.extra.sitemap.isIndex} urls≈${report.extra.sitemap.approxUrls}`
  : 'NONE FOUND');
const titleLens = pageReports.map((p) => p.titleLen);
const descLens = pageReports.map((p) => p.descLen);
const stat = (arr) => `min ${Math.min(...arr)} / med ${arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)]} / max ${Math.max(...arr)}`;
console.log(`title length: ${stat(titleLens)}  (want 30-60)`);
console.log(`meta desc  : ${stat(descLens)}  (want 120-158)`);
console.log(`missing desc: ${pageReports.filter((p) => !p.desc).length}`);
console.log(`h1 problems : ${pageReports.filter((p) => p.h1count !== 1).length} (count != 1)`);
console.log(`no canonical: ${pageReports.filter((p) => !p.canonical).length}`);
console.log(`noindex     : ${pageReports.filter((p) => p.noindex).length}`);
console.log(`words med   : ${pageReports.map((p) => p.words).sort((a, b) => a - b)[Math.floor(pageReports.length / 2)]}`);
console.log(`GA present  : ${pageReports.filter((p) => p.hasGA).length}/${pageReports.length}`);
console.log(`ads present : ${pageReports.filter((p) => p.hasAds).length}/${pageReports.length}`);
console.log(`affiliate   : ${pageReports.filter((p) => p.hasAffiliate).length}/${pageReports.length}`);
console.log(`jsonld types: ${[...new Set(pageReports.flatMap((p) => p.jsonLdTypes))].join(', ') || 'NONE'}`);
console.log(`hreflang pg : ${pageReports.filter((p) => p.hreflang.length).length}/${pageReports.length}`);
const slow = pageReports.filter((p) => p.ttfbMs > 1200);
console.log(`slow pages  : ${slow.length} >1200ms ${slow.slice(0, 5).map((p) => `${p.url.split('/').pop()}:${p.ttfbMs}ms`).join(' ')}`);
const heavy = pageReports.filter((p) => p.kb > 150);
console.log(`heavy html  : ${heavy.length} >150kb ${heavy.slice(0, 5).map((p) => `${p.url.split('/').pop()}:${p.kb}kb`).join(' ')}`);
if (report.errors.length) {
  console.log(`\nerrors (${report.errors.length}):`);
  for (const [u, m] of report.errors.slice(0, 12)) console.log('  ', u, '->', m);
}
console.log(`\nfull JSON: ${outFile}`);
