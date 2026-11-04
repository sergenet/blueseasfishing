import re, json, os
TMP = 'C:/Projects/BlueSeasFishing-Website/blueseasfishing/blueseas-fishing-working-website/blueseasfishing.com/.idxwork'
regions = json.load(open(os.path.join(TMP,'regions.json')))

GENERIC = r'\b(reefs?|offshore|deepwater|beaches|coasts?|bays?|tributaries|runs?|system|estuaries|waters|ponds|reservoirs|structure|stillwaters|introduced|where legal|banks?)\b'

def split(name):
    q = re.findall(r'[()\[\]]([^)\]]*)[)\]]', name)
    qual = '/'.join(x.strip() for x in q).upper().replace(' ', '')
    b = re.sub(r'\s*[()\[\]].*?[)\]]', ' ', name).lower()
    b = re.sub(GENERIC, ' ', b)
    b = re.sub(r'[^a-z\s]', ' ', b)
    return re.sub(r'\s+', ' ', b).strip(), qual

def qual_ok(q1, q2):
    """Empty, identical, or one a prefix-subset of the other (AUS/PAC vs AUS/PAC/IND)."""
    if not q1 or not q2: return True
    if q1 == q2: return True
    p1 = [t for t in q1.split('/') if t]
    p2 = [t for t in q2.split('/') if t]
    return set(p1).issubset(set(p2)) or set(p2).issubset(set(p1))

def toslug(s):
    s = re.sub(r'[()\[\]]','', str(s).lower())
    s = re.sub(r'[^a-z0-9]+','-', s)
    return re.sub(r'^-+|-+$','', s)

meta = {r: split(r) for r in regions}
groups = {}
for r in regions:
    b, q = meta[r]
    if b: groups.setdefault(b, []).append(r)

redirects = {}
merges = {}      # variant region name -> canonical region name
retired = 0
for b, members in sorted(groups.items(), key=lambda kv: -len(kv[1])):
    if len(members) < 2: continue
    # partition by qualifier compatibility (union-find on qual_ok)
    parent = {m: m for m in members}
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for i in range(len(members)):
        for j in range(i+1, len(members)):
            a2, c2 = meta[members[i]][1], meta[members[j]][1]
            if qual_ok(a2, c2):
                ra, rb = find(members[i]), find(members[j])
                if ra != rb: parent[rb] = ra
    sub = {}
    for m in members: sub.setdefault(find(m), []).append(m)
    for root, grp in sub.items():
        if len(grp) < 2: continue
        grp = sorted(grp, key=lambda m: (-len(regions[m]), len(m)))
        canon = grp[0]
        cs = toslug(canon)
        union_n = len(set().union(*[set(regions[m]) for m in grp]))
        print("KEEP  %-38s slug=%-28s %2d sp -> union %2d sp" % (canon, cs, len(regions[canon]), union_n))
        for m in grp[1:]:
            ms = toslug(m)
            if ms == cs: continue
            print("   301 %-38s slug=%s" % (m, ms))
            redirects[ms] = cs
            merges[m] = canon
            retired += 1
        print("")

print("TOTAL retired: %d   remaining: %d" % (retired, len(regions) - retired))
json.dump(redirects, open(os.path.join(TMP,'redirects.json'),'w'), indent=1)
json.dump(merges,  open(os.path.join(TMP,'merges.json'),'w'),  indent=1)
print("wrote redirects.json + merges.json")
