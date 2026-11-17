import re
from pathlib import Path

site_dir = Path(__file__).resolve().parent.parent / "blueseas-fishing-working-website" / "blueseasfishing.com"
sitemap_path = site_dir / "sitemap.xml"

print(f"Reading {sitemap_path}...")
raw = sitemap_path.read_text(encoding="utf-8")

# Match each <url>...</url> block
url_blocks = re.findall(r'<url>.*?</url>', raw, re.DOTALL)
print(f"Total URL blocks: {len(url_blocks)}")

core_urls = []
species_urls = []
guides_urls = []
locations_urls = []
tools_urls = []

for block in url_blocks:
    loc_m = re.search(r'<loc>(.*?)</loc>', block)
    if not loc_m:
        continue
    loc = loc_m.group(1)
    clean = re.sub(r'https://www.blueseasfishing.com/(ar|de|el|es|fr|pt|ru)/', 'https://www.blueseasfishing.com/', loc)
    rel = clean.replace('https://www.blueseasfishing.com/', '')
    
    if rel.startswith('species/'):
        species_urls.append(block)
    elif rel.startswith('guides/') or '-vs-' in rel or rel.startswith('tips-') or rel.endswith('-identification.html'):
        guides_urls.append(block)
    elif rel.startswith('states/') or rel.startswith('destinations/'):
        locations_urls.append(block)
    elif rel.startswith('whats-biting/') or rel.startswith('fish-size-charts/'):
        tools_urls.append(block)
    else:
        core_urls.append(block)

def write_sm(fname, blocks):
    target = site_dir / fname
    content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(blocks) + '\n</urlset>\n'
    target.write_text(content, encoding="utf-8")
    print(f"Wrote {fname}: {len(blocks)} URLs ({target.stat().st_size} bytes)")

write_sm('sitemap-core.xml', core_urls)
write_sm('sitemap-species.xml', species_urls)
write_sm('sitemap-guides.xml', guides_urls)
write_sm('sitemap-locations.xml', locations_urls)
write_sm('sitemap-tools.xml', tools_urls)

index_xml = """<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.blueseasfishing.com/sitemap-core.xml</loc>
    <lastmod>2026-11-17</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.blueseasfishing.com/sitemap-species.xml</loc>
    <lastmod>2026-11-17</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.blueseasfishing.com/sitemap-guides.xml</loc>
    <lastmod>2026-11-17</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.blueseasfishing.com/sitemap-locations.xml</loc>
    <lastmod>2026-11-17</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.blueseasfishing.com/sitemap-tools.xml</loc>
    <lastmod>2026-11-17</lastmod>
  </sitemap>
</sitemapindex>
"""

(site_dir / "sitemap-index.xml").write_text(index_xml, encoding="utf-8")
print("Wrote sitemap-index.xml")

# Backup original monolithic sitemap
backup_path = site_dir / "sitemap-monolith-backup.xml"
if not backup_path.exists():
    backup_path.write_text(raw, encoding="utf-8")
    print("Backed up monolithic sitemap to sitemap-monolith-backup.xml")

# Point sitemap.xml to the sitemap index
(site_dir / "sitemap.xml").write_text(index_xml, encoding="utf-8")
print("Updated sitemap.xml to valid sitemapindex")
