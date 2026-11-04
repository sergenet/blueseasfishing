// Portfolio scan: current facts for a strengths/weaknesses read of five sites.
// Per site: homepage health, sitemap composition, monetisation wiring, structured
// data, hreflang, and content depth sampled from the sitemap.
const sites = [
  'https://www.blueseasfishing.com',
  'https://www.gardenwithserge.com',
  'https://timerhaven.com',
  'https://nexuscut.io',
  'https://www.newgiftsandgadgets.com',
];

const UA = { 'user-agent': 'Mozilla/5.0 (compatible; PortfolioScan/1.0)' };

async function get(url, timeout = 25000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { signal: c.signal, redirect: 'follow', headers: UA });
    const body = await r.text();
    return { status: r.status, body, ms: Date.now() - t0, bytes: Buffer.byteLength(body), finalUrl: r.url };
  } catch (e) {
    return { status: 0, body: '', ms: Date.now() - t0, bytes: 0, err: String(e.message).slice(0, 60) };
  } finally {
    clearTimeout(t);
  }
}

const words = (html) => {
  const body = html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ');
  const main = (body.match(/<main[\s\S]*?<\/main>/i) || [body])[0];
  return main.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
};
const grab = (html, re) => (html.match(re) || [])[1] || '';
const count = (html, re) => (html.match(new RegExp(re, 'gi')) || []).length;

function ldTypes(html) {
  const out = new Set();
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1]);
      const walk = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(walk);
        if (n['@type']) out.add([].concat(n['@type']).join('+'));
        Object.values(n).forEach(walk);
      };
      walk(parsed);
    } catch { /* invalid JSON-LD is itself a finding */ }
  }
  return [...out];
}

for (const site of sites) {
  const home = await get(site);
  const base = new URL(home.finalUrl || site).origin;
  const html = home.body;

  const sm = await get(`${base}/sitemap.xml`);
  const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const lastmods = [...sm.body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].trim());

  const ads = await get(`${base}/ads.txt`);
  const adsRecords = ads.body.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#')).length;
  const adsBom = ads.body.charCodeAt(0) === 0xfeff;

  // sample content depth across the sitemap
  const sample = [];
  const step = Math.max(1, Math.floor(locs.length / 6));
  for (let i = 0; i < locs.length && sample.length < 6; i += step) sample.push(locs[i]);

  const depth = [];
  for (const url of sample) {
    const p = await get(url);
    if (p.status === 200) {
      depth.push({
        words: words(p.body),
        ads: count(p.body, 'adsbygoogle'),
        affiliate: /awin1|awinmid|amazon\.|impact\.com|shareasale|ref=|utm_source=affiliate/i.test(p.body),
        jsonld: ldTypes(p.body).length,
      });
    }
  }
  depth.sort((a, b) => a.words - b.words);
  const median = depth.length ? depth[Math.floor(depth.length / 2)].words : 0;

  console.log('\n=== ' + base + ' ===');
  console.log(`  home: ${home.status} ${home.bytes}B TTFB ${home.ms}ms  final ${home.finalUrl}`);
  console.log(`  title(${grab(html, /<title>([\s\S]*?)<\/title>/i).trim().length}) desc(${grab(html, /name="description"\s+content="([^"]*)"/i).length}) h1=${count(html, '<h1[\\s>]')} viewport=${/name="viewport"/i.test(html)} lang=${grab(html, /<html[^>]+lang="([^"]*)"/i) || 'none'}`);
  console.log(`  sitemap: ${sm.status} ${locs.length} urls, lastmod ${new Set(lastmods).size} unique of ${lastmods.length}`);
  console.log(`  ads.txt: ${ads.status} ${adsRecords} records${adsBom ? ' (BOM!)' : ''}`);
  console.log(`  adsbygoogle on home: ${count(html, 'adsbygoogle')} | GA: ${/gtag\(|googletagmanager/.test(html)} | hreflang: ${count(html, 'rel="alternate"')}`);
  console.log(`  jsonld on home: ${ldTypes(html).join(', ') || 'none'}`);
  console.log(`  sampled pages: ${depth.length} | median words ${median} | range ${depth[0]?.words}-${depth[depth.length - 1]?.words}`);
  console.log(`  ads in sample: [${depth.map((d) => d.ads).join(',')}] | affiliate in sample: [${depth.map((d) => (d.affiliate ? 'y' : 'n')).join(',')}]`);
}
