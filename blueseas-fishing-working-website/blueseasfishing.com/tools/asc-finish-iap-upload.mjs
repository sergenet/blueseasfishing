// Finish a pending subscriptionAppStoreReviewScreenshots upload for one subscription.
// Usage: node tools/asc-finish-iap-upload.mjs <subscriptionId>
import fs from 'node:fs';
import { makeToken, API } from './asc-jwt.mjs';

const subId = process.argv[2];
const FILE = process.argv[3] || 'C:/Users/Serge/Desktop/gws-iap-review-screenshot.png';
const hdrObj = (h) => Array.isArray(h) ? Object.fromEntries(h.map((x) => [x.name || x.Name, x.value ?? x.Value])) : (h || {});

const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${makeToken()}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(`GET ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

const shot = await get(`/v1/subscriptions/${subId}/appStoreReviewScreenshot`);
if (!shot.data) throw new Error('No screenshot asset on this subscription.');
const id = shot.data.id;
console.log('Asset', id, JSON.stringify(shot.data.attributes).slice(0, 400));
const up = shot.data.attributes.uploadOperations?.[0];
if (!up || !up.url) throw new Error('No pending uploadOperations — asset may already be uploaded.');

const bytes = fs.readFileSync(FILE);
const put = await fetch(up.url, { method: 'PUT', headers: hdrObj(up.requestHeaders), body: bytes });
if (!put.ok) throw new Error(`PUT failed: HTTP ${put.status} ${await put.text()}`);
console.log(`PUT ok (${bytes.length} bytes)`);

const commit = await fetch(`${API}/v1/subscriptionAppStoreReviewScreenshots/${id}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: { type: 'subscriptionAppStoreReviewScreenshots', id, attributes: { uploaded: true } } }),
});
const cb = await commit.json().catch(() => ({}));
if (!commit.ok) throw new Error(`Commit failed: ${JSON.stringify(cb.errors || cb)}`);
console.log('Committed. assetDeliveryState:', JSON.stringify(cb.data?.attributes?.assetDeliveryState));
