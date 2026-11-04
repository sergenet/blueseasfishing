import re, json, itertools, os
TMP = 'C:/Projects/BlueSeasFishing-Website/blueseasfishing/blueseas-fishing-working-website/blueseasfishing.com/.idxwork'
regions = json.load(open(os.path.join(TMP,'regions.json')))
print("qualifying regions (>=3 species): %d" % len(regions))
def toslug(s):
    s = re.sub(r'[()\[\]]','', str(s).lower())
    s = re.sub(r'[^a-z0-9]+','-', s)
    return re.sub(r'^-+|-+$','', s)
names = list(regions.keys())
sets = {n: set(regions[n]) for n in names}
pairs = []
for a, b in itertools.combinations(names, 2):
    sa, sb = sets[a], sets[b]
    j = len(sa & sb) / len(sa | sb)
    if j >= 0.50: pairs.append((j, a, b))
pairs.sort(reverse=True)
print("pairs with Jaccard >= 0.50: %d" % len(pairs))
parent = {n: n for n in names}
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(a,b):
    ra, rb = find(a), find(b)
    if ra != rb: parent[rb] = ra
for j,a,b in pairs: union(a,b)
clusters = {}
for n in names: clusters.setdefault(find(n), []).append(n)
multi = {k:v for k,v in clusters.items() if len(v) > 1}
print("merge clusters: %d (affecting %d pages)" % (len(multi), sum(len(v) for v in multi.values())))
print("")
merged_total = 0
redirects = {}
for k, members in sorted(multi.items(), key=lambda kv: -sum(len(sets[m]) for m in kv[1])):
    members = sorted(members, key=lambda m: -len(sets[m]))
    canon = members[0]
    cs = toslug(canon)
    print("CANONICAL: %-34s (%d species, slug=%s)" % (canon, len(sets[canon]), cs))
    for m in members[1:]:
        j = len(sets[m] & sets[canon]) / len(sets[m] | sets[canon])
        ms = toslug(m)
        print("   MERGE  %-34s (%d sp, slug=%s) j=%.2f -> 301" % (m, len(sets[m]), ms, j))
        redirects[ms] = cs
        merged_total += 1
    print("")
print("TOTAL pages retired: %d" % merged_total)
json.dump(redirects, open(os.path.join(TMP,'redirects.json'),'w'), indent=1)
