// Copy the App Review screenshot from one subscription to others in the same app.
// Resolves 2.1(b) "In-App Purchase products have not been submitted for review" (MISSING_METADATA).
// Usage: node tools/asc-copy-iap-screenshot.mjs <sourceSubscriptionId> <targetId...>
import { makeToken, API } from './asc-jwt.mjs';

const [srcId, ...targetIds] = process.argv.slice(2);
if (!srcId || targetIds.length === 0) {
  console.error('Usage: node tools/asc-copy-iap-screenshot.mjs <sourceSubscriptionId> <targetId...>');
  process.exit(1);
}

const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${makeToken()}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(`GET ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

const post = async (path, payload) => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

const del = async (path) => {
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${makeToken()}` } });
  if (!res.ok) throw new Error(`DELETE ${path}: HTTP ${res.status} ${await res.text()}`);
  return true;
};

const hdrObj = (h) => Array.isArray(h)
  ? Object.fromEntries(h.map((x) => [x.name || x.Name, x.value ?? x.Value]))
  : (h || {});
// Source screenshot asset (subscription review screenshots use type subscriptionAppStoreReviewScreenshots)
const srcShot = await get(`/v1/subscriptions/${srcId}/appStoreReviewScreenshot`);
if (!srcShot.data) throw new Error(`Source subscription ${srcId} has no App Review screenshot.`);
console.log('Source asset:', JSON.stringify(srcShot.data.attributes));
const asset = srcShot.data.attributes;
const srcUrl = (asset.imageAsset && asset.imageAsset.templateUrl)
  ? asset.imageAsset.templateUrl
      .replace('{w}', String(asset.imageAsset.width || 1284))
      .replace('{h}', String(asset.imageAsset.height || 2778))
      .replace('{f}', 'png')
  : (asset.sourceFileUrl || asset.assetDeliveryUrl);
if (!srcUrl) throw new Error('No downloadable URL on source screenshot asset.');

// Fetch the binary via the asset URL (GET with the JWT)
const dl = await fetch(srcUrl, {
  headers: { Authorization: `Bearer ${makeToken()}` },
});
if (!dl.ok) throw new Error(`Download failed: HTTP ${dl.status}`);
const bytes = Buffer.from(await dl.arrayBuffer());
console.log(`Downloaded ${bytes.length} bytes`);

for (const targetId of targetIds) {
  let existing = await get(`/v1/subscriptions/${targetId}/appStoreReviewScreenshot`);
  if (existing.data && ['AWAITING_UPLOAD', 'FAILED', 'UPLOAD_COMPLETE'].includes(existing.data.attributes.state ?? '')) {
    console.log(`Target ${targetId}: removing stranded asset ${existing.data.id} (state ${existing.data.attributes.state})`);
    await del(`/v1/subscriptionAppStoreReviewScreenshots/${existing.data.id}`);
    existing = { data: null };
  }
  if (existing.data) {
    console.log(`Target ${targetId} already has a screenshot (${existing.data.attributes.fileName}, state ${existing.data.attributes.state}) — skipping.`);
    continue;
  }
  // Reserve an upload slot
  const fileName = 'gws-iap-review-screenshot.png';
  const created = await post('/v1/subscriptionAppStoreReviewScreenshots', {
    data: {
      type: 'subscriptionAppStoreReviewScreenshots',
      attributes: { fileName, fileSize: bytes.length },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: targetId } },
      },
    },
  });
  const shotId = created.data.id;
  console.log(`Reserved slot ${shotId} for ${targetId}; created payload:`, JSON.stringify(created.data.attributes));
  const upReq = created.data.attributes.uploadOperations?.[0];
  if (!upReq || !upReq.url) {
    console.log('FULL RESPONSE:', JSON.stringify(created, null, 2));
    throw new Error(`No usable uploadOperations for ${targetId}`);
  }
  // PUT the bytes to the signed URL (no auth header on the blob store)
  const put = await fetch(upReq.url, { method: 'PUT', headers: hdrObj(upReq.requestHeaders), body: bytes });
  if (!put.ok) throw new Error(`Upload PUT failed for ${targetId}: HTTP ${put.status} ${await put.text()}`);
  // Commit
  await fetch(`${API}/v1/subscriptionAppStoreReviewScreenshots/${shotId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        type: 'subscriptionAppStoreReviewScreenshots',
        id: shotId,
        attributes: {
          uploaded: true,
          sourceFileChecksum: upReq.requestHeaders?.['Content-MD5'] || undefined,
        },
      },
    }),
  }).then(async (r) => {
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Commit failed for ${targetId}: ${JSON.stringify(b.errors || b)}`);
    console.log(`Target ${targetId}: screenshot uploaded, state ${b.data?.attributes?.state}`);
  });
}
console.log('DONE');
