// Cross-site triage: answers the specific question "is this a shared pipeline bug?"
// Checks per site: ad density, affiliate hosts, hreflang reciprocity, sitemap lastmod
// uniformity, locale footprint. Prints a comparison matrix.
const sites = [
  'https://www.blueseasfishing.com',
  'https://www.gardenwithserge.com',
  'https://timerhaven.com',
  'https://nexuscut.io',
  'https://www.newgiftsandgadgets.com',
  'https://www.laseniorservicesdirectory.com',
];

async function get(url, timeout = 15000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: c.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Triage/1.0)' },
    });
    return { status: r.status, body: await r.text() };
  } catch (e) {
    return { status: 0, body: '', err: e.message };
  } finally {
    clearTimeout(t);
  }
}

const rows = [];
for (const origin of sites) {
  const row = { origin: origin.replace('https://', '') };
  const home = await get(origin + '/');
  row.homeStatus = home.status;

  // sitemap: url count + lastmod uniformity + locale footprint
  const sm = await get(origin + '/sitemap.xml');
  const locs = [...sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  const lastmods = [...sm.body.matchAll(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/gi)].map((m) => m[1]);
  row.sitemapUrls = locs.length || (/<sitemapindex/i.test(sm.body) ? 'index' : 0);
  row.lastmodUnique = new Set(lastmods.map((d) => d.slice(0, 10))).size;
  row.lastmodCount = lastmods.length;
  const localePrefixes = new Set(
    locs.map((l) => l.replace(/https?:\/\/[^/]+\//, '').split('/')[0]).filter((s) => /^[a-z]{2}$/.test(s)),
  );
  row.localesInSitemap = [...localePrefixes].join(',') || 'none';

  // ads on a content page (2nd sitemap URL that is html)
  const contentUrl = locs.find((l) => /\.html?$|\/[a-z0-9-]+\/$/i.test(l) && l !== origin + '/') || origin + '/';
  const c = await get(contentUrl);
  row.contentUrl = contentUrl.replace(origin, '') || '/';
  row.adsOnContent = (c.body.match(/adsbygoogle/g) || []).length;
  row.adsOnHome = (home.body.match(/adsbygoogle/g) || []).length;

  // affiliate hosts actually linked
  const hosts = new Set();
  for (const m of c.body.matchAll(/href=["'](https?:\/\/[^"'/]+)/gi)) {
    const h = new URL(m[1]).hostname.replace(/^www\./, '');
    if (/awin|amazon|impact|avantlink|shareasale|cj\.|clickbank|booking|expedia|etsy|ebay|rakuten|getyourguide|viator/.test(h)) hosts.add(h);
  }
  row.affiliateHosts = [...hosts].join(',') || 'none';

  // hreflang reciprocity: does the page declare alternates at all?
  row.hreflangOnPage = (c.body.match(/hreflang=/g) || []).length;

  // locale live check
  const localesLive = [];
  for (const l of ['fr', 'es', 'de', 'el', 'ar', 'pt', 'ru']) {
    const r = await get(`${origin}/${l}/`, 8000);
    if (r.status === 200) localesLive.push(l);
  }
  row.localesLive = localesLive.join(',') || 'none';

  rows.push(row);
  console.log(`done ${row.origin}`);
}

console.log('\n=== TRIAGE MATRIX ===\n');
const cols = [
  ['origin', 34],
  ['homeStatus', 11],
  ['sitemapUrls', 12],
  ['lastmodUnique/of', 17],
  ['localesInSitemap', 18],
  ['localesLive', 20],
  ['adsHome', 8],
  ['adsContent', 11],
  ['hreflang', 9],
  ['affiliateHosts', 40],
];
console.log(cols.map(([k, w]) => k.padEnd(w)).join(''));
for (const r of rows) {
  console.log(
    [
      String(r.origin).padEnd(34),
      String(r.homeStatus).padEnd(11),
      String(r.sitemapUrls).padEnd(12),
      `${r.lastmodUnique}/${r.lastmodCount}`.padEnd(17),
      String(r.localesInSitemap).padEnd(18),
      String(r.localesLive).padEnd(20),
      String(r.adsOnHome).padEnd(8),
      String(r.adsOnContent).padEnd(11),
      String(r.hreflangOnPage).padEnd(9),
      String(r.affiliateHosts).slice(0, 40).padEnd(40),
    ].join(''),
  );
}
