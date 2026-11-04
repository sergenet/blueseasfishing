import re, json, itertools, os
TMP = 'C:/Projects/BlueSeasFishing-Website/blueseasfishing/blueseas-fishing-working-website/blueseasfishing.com/.idxwork'
regions = json.load(open(os.path.join(TMP,'regions.json')))

GENERIC = r'\b(reefs?|offshore|deepwater|beaches|coasts?|bays?|tributaries|runs?|system|estuaries|waters|ponds|reservoirs|structure|stillwaters|introduced|where legal|banks?)\b'

def base(name):
    """Strip parenthetical qualifiers + generic fishery-type words -> the PLACE."""
    s = re.sub(r'\s*[()\[\]].*?[)\]]', ' ', name)      # drop (MD/VA), (US), (CA)
    s = s.lower()
    s = re.sub(GENERIC, ' ', s)                        # drop 'reefs','offshore','bays'...
    s = re.sub(r'[^a-z\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def toslug(s):
    s = re.sub(r'[()\[\]]','', str(s).lower())
    s = re.sub(r'[^a-z0-9]+','-', s)
    return re.sub(r'^-+|-+$','', s)

groups = {}
for r in regions:
    b = base(r)
    if b: groups.setdefault(b, []).append(r)

# A group only qualifies if every member shares that exact place base.
cand = {b: v for b, v in groups.items() if len(v) > 1}
print("same-place-name groups: %d (affecting %d pages)\n" % (len(cand), sum(len(v) for v in cand.values())))

redirects = {}
retired = 0
for b, members in sorted(cand.items(), key=lambda kv: -len(kv[1])):
    members = sorted(members, key=lambda m: -len(regions[m]))
    canon = members[0]
    cs = toslug(canon)
    print("KEEP    %-38s (%2d sp) slug=%s" % (canon, len(regions[canon]), cs))
    for m in members[1:]:
        ms = toslug(m)
        if ms == cs:
            print("   !! slug collision with canonical, skipping: %s" % ms); continue
        print("   301   %-38s (%2d sp) slug=%s" % (m, len(regions[m]), ms))
        redirects[ms] = cs
        retired += 1
    print("")
print("TOTAL retired: %d   remaining destination pages: %d" % (retired, len(regions) - retired))
json.dump(redirects, open(os.path.join(TMP,'redirects.json'),'w'), indent=1)
print("\nwrote redirects.json")
