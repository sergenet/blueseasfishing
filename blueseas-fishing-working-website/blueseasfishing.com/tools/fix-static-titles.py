#!/usr/bin/env python3
"""One-off: bring the hand-written Blue Seas pages in line with the generated ones.

Fixes, all idempotent:
  * <title> trimmed to <= 60 rendered characters
  * three guide descriptions trimmed to <= 158 (Google cuts around 160)
  * the four guide pages had NO Open Graph / Twitter Card tags at all - added,
    matching the pattern the generators emit
  * the four guide pages had no JSON-LD - added Article + BreadcrumbList
  * "BlueSeas Fishing With Serge" brand typo normalised to "Blue Seas Fishing"
"""
import html
import json
import re
from pathlib import Path

SITE = "https://www.blueseasfishing.com"

TITLES = {
    "index.html": "Blue Seas Fishing: AI Fish ID & 400+ Species Guides",
    "fish-id-widget.html": "Free Fish ID Widget for Your Website | Blue Seas Fishing",
    "premium.html": "Blue Seas Premium — AI Fish ID, Trip Plans & Maps",
    "subscribe.html": "Subscribe — Weekly & Monthly Fishing Briefs | Blue Seas",
    "tips-beginner-knots.html": "Fishing Basics: Knots, Rigs & First Trips | Blue Seas",
    "tips-tackle-box-essentials.html": "Tackle Box Essentials: A Practical Checklist | Blue Seas",
    "trip-planner.html": "Trip Planner — Multi-Fish Species & Bait Plans",
    "walleye-vs-sauger-identification.html": "Walleye vs Sauger: Tail, Dorsal Fin & Markings",
    "guides/alpine-lakes-trout.html": "Alpine Lakes Trout: Shore & Small Craft Tactics | Blue Seas",
    "guides/british-canals.html": "British Canals: Perch & Pike on Light Tackle | Blue Seas",
    "guides/eastern-european-rivers.html": "Eastern Europe Rivers: Asp, Zander & Pike | Blue Seas",
    "guides/mediterranean-shore-fishing.html": "Mediterranean Shore Fishing: Reading Swells | Blue Seas",
}

GUIDES = {
    "guides/alpine-lakes-trout.html": {
        "desc": "A guide to trout fishing on Alpine lakes: where fish hold in cold, deep water and "
                "how to catch them from shore or a small boat with spinners and flies.",
        "img": "/images/species/brown-trout.webp",
        "name": "Alpine lakes trout",
    },
    "guides/british-canals.html": {
        "desc": "A practical guide to canal fishing in Britain: where perch and pike hold along the cut, "
                "and how ultralight tackle turns a short session into real sport.",
        "img": "/images/species/european-perch.webp",
        "name": "British canals",
    },
    "guides/eastern-european-rivers.html": {
        "desc": "A guide to predator fishing on Eastern European rivers: where asp, zander and pike "
                "hold on the Danube and its tributaries, and the lures that catch them.",
        "img": "/images/species/zander.webp",
        "name": "Eastern European rivers",
    },
    "guides/mediterranean-shore-fishing.html": {
        "desc": "A shore-fishing guide to the Mediterranean: where fish hold along rocky coasts and sandy "
                "beaches, the species to target, and the baits and lures that work.",
        "img": "/images/species/european-seabass.webp",
        "name": "Mediterranean shore fishing",
    },
}

# Descriptions that ran past Google's ~160-character cut, trimmed to <= 158.
DESCS = {
    "index.html": "Upload a fish photo for AI-assisted species identification, browse 400+ species "
                 "guides with identifying features, plus fishing tips and tackle advice.",
    "recommended-fishing-gear.html": "A practical checklist for choosing fishing rods, reels, line, hooks, "
                                      "tackle storage and safety gear, plus clearly labelled partner picks.",
}

changed = []

def esc(s):
    return html.escape(s, quote=False)


def attr(s):
    return html.escape(s, quote=True)


def social_block(title, desc, url, img, img_alt):
    img_abs = img if img.startswith("http") else SITE + img
    return (
        f'  <meta property="og:type" content="article">\n'
        f'  <meta property="og:site_name" content="Blue Seas Fishing">\n'
        f'  <meta property="og:title" content="{attr(title)}">\n'
        f'  <meta property="og:description" content="{attr(desc)}">\n'
        f'  <meta property="og:url" content="{url}">\n'
        f'  <meta property="og:image" content="{img_abs}">\n'
        f'  <meta property="og:image:alt" content="{attr(img_alt)}">\n'
        f'  <meta name="twitter:card" content="summary_large_image">\n'
        f'  <meta name="twitter:title" content="{attr(title)}">\n'
        f'  <meta name="twitter:description" content="{attr(desc)}">\n'
        f'  <meta name="twitter:image" content="{img_abs}">\n'
    )


def jsonld(name, h1, desc, url, img):
    img_abs = img if img.startswith("http") else SITE + img
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": name, "item": url},
                ],
            },
            {
                "@type": "Article",
                "headline": h1,
                "description": desc,
                "image": img_abs,
                "mainEntityOfPage": url,
                "inLanguage": "en",
                "author": {"@type": "Organization", "name": "Blue Seas Fishing", "url": f"{SITE}/"},
                "publisher": {"@type": "Organization", "name": "Blue Seas Fishing", "url": f"{SITE}/"},
            },
        ],
    }
    return '  <script type="application/ld+json">' + json.dumps(graph, ensure_ascii=False) + "</script>\n"


# Union of both maps: a page may need only its description fixed (the gear page
# runs to 172 chars and has no title change), and iterating TITLES alone skipped it.
for rel in sorted(set(TITLES) | set(DESCS)):
    new_title = TITLES.get(rel)
    p = Path(rel)
    src = p.read_text(encoding="utf-8")
    out = src
    notes = []

    if new_title:
        m = re.search(r"<title>.*?</title>", out, re.S)
        if m:
            old = html.unescape(re.sub(r"</?title>", "", m.group(0)))
            if old != new_title:
                out = out[:m.start()] + f"<title>{esc(new_title)}</title>" + out[m.end():]
                notes.append(f"title {len(old)}->{len(new_title)}")
        if len(new_title) > 60:
            raise SystemExit(f"BAD: {rel} title still {len(new_title)} chars")

    # brand typo
    if "BlueSeas Fishing With Serge" in out or "BlueSeas Fishing" in out:
        before = out
        out = out.replace("BlueSeas Fishing With Serge", "Blue Seas Fishing")
        out = out.replace("&mdash; BlueSeas Fishing", "&mdash; Blue Seas Fishing")
        out = re.sub(r"— BlueSeas Fishing\b", "— Blue Seas Fishing", out)
        if out != before:
            notes.append("brand normalised")

    g = GUIDES.get(rel)
    new_desc = DESCS.get(rel) or (g["desc"] if g else None)
    if new_desc:
        if len(new_desc) > 160:
            raise SystemExit(f"BAD: {rel} description is {len(new_desc)} chars")
        d = re.search(r'<meta name="description" content="([^"]*)"', out)
        if d:
            out = out[:d.start(1)] + attr(new_desc) + out[d.end(1):]
            notes.append(f"desc {len(html.unescape(d.group(1)))}->{len(new_desc)}")
    if g:

        if 'property="og:title"' not in out:
            url = f"{SITE}/{rel}"
            h1m = re.search(r"<h1[^>]*>(.*?)</h1>", out, re.S)
            h1 = re.sub(r"<[^>]+>", "", h1m.group(1)).strip() if h1m else new_title
            can = re.search(r'<link rel="canonical" href="([^"]+)"', out)
            url = can.group(1) if can else url
            block = social_block(new_title, g["desc"], url, g["img"], g["name"])
            block += jsonld(g["name"], h1, g["desc"], url, g["img"])
            # insert right after the canonical link
            cm = re.search(r'<link rel="canonical"[^>]*>\n', out)
            if not cm:
                raise SystemExit(f"BAD: no canonical in {rel}")
            out = out[:cm.end()] + block + out[cm.end():]
            notes.append("social+jsonld added")

    if out != src:
        p.write_text(out, encoding="utf-8", newline="")
        changed.append((rel, notes))

for rel, notes in changed:
    print(f"{rel:44} {'; '.join(notes)}")
print(f"\n{len(changed)} file(s) changed")
