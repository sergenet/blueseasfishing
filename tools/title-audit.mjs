// Reports duplicate <title> and <h1> values across a site's sitemap URLs.
// Usage: node tools/title-audit.mjs https://example.com [maxUrls]
const site = process.argv[2];
const cap = Number(process.argv[3] || 400);
if (!site) { console.error('usage: node title-audit.mjs <site> [maxUrls]'); process.exit(1); }

const origin = site.replace(/\/$/, '');

async function sitemapUrls() {
  const res = await fetch(`${origin}/sitemap.xml`, { headers: { 'user-agent': 'title-audit/1.0' } });
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

async function probe(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'title-audit/1.0' }, redirect: 'manual' });
    if (res.status !== 200) return { url, status: res.status };
    const html = await res.text();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    return { url, status: 200, title: decode(title), h1: decode(h1.replace(/<[^>]*>/g, '')) };
  } catch (e) {
    return { url, status: 'ERR', error: e.message };
  }
}

const urls = (await sitemapUrls()).slice(0, cap);
const out = [];
const CONCURRENCY = 8;
let i = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (i < urls.length) {
    const url = urls[i++];
    out.push(await probe(url));
  }
}));

const byTitle = new Map(), byH1 = new Map(), noTitle = [], noH1 = [];
for (const row of out) {
  if (row.status !== 200) continue;
  if (!row.title) noTitle.push(row.url); else {
    if (!byTitle.has(row.title)) byTitle.set(row.title, []);
    byTitle.get(row.title).push(row.url);
  }
  if (!row.h1) noH1.push(row.url); else {
    if (!byH1.has(row.h1)) byH1.set(row.h1, []);
    byH1.get(row.h1).push(row.url);
  }
}

const dupTitles = [...byTitle.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
const dupH1 = [...byH1.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
const nonOk = out.filter(r => r.status !== 200);

console.log(JSON.stringify({
  site: origin,
  checked: out.length,
  uniqueTitles: byTitle.size,
  duplicateTitleGroups: dupTitles.length,
  pagesInDuplicateTitles: dupTitles.reduce((n, [, v]) => n + v.length, 0),
  duplicateTitles: dupTitles.slice(0, 12).map(([t, v]) => ({ title: t, count: v.length, example: v[0] })),
  duplicateH1Groups: dupH1.length,
  missingTitle: noTitle.length,
  missingH1: noH1.length,
  nonOk: nonOk.slice(0, 8),
}, null, 2));
