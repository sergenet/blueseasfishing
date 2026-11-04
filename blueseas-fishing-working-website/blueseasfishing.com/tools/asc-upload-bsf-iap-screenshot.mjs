import fs from 'fs';
import crypto from 'crypto';
import { makeToken, API } from './asc-jwt.mjs';

const SUBSCRIPTION_IDS = ['6824286598', '6824288049'];
const SCREENSHOT_PATH = 'C:/blueseasfishing/Assets/ios/bsf-iap-review-screenshot.png';

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

const hdrObj = (h) => (Array.isArray(h) ? Object.fromEntries(h.map((x) => [x.name || x.Name, x.value ?? x.Value])) : h || {});

const bytes = fs.readFileSync(SCREENSHOT_PATH);
const md5 = crypto.createHash('md5').update(bytes).digest('base64');
console.log(`Read ${bytes.length} bytes from ${SCREENSHOT_PATH} (md5: ${md5})`);

for (const subId of SUBSCRIPTION_IDS) {
  console.log(`\nProcessing subscription ${subId}...`);
  let existing = await get(`/v1/subscriptions/${subId}/appStoreReviewScreenshot`).catch(() => ({ data: null }));
  if (existing.data && ['AWAITING_UPLOAD', 'FAILED', 'UPLOAD_COMPLETE'].includes(existing.data.attributes.state ?? '')) {
    console.log(`Removing existing asset ${existing.data.id} in state ${existing.data.attributes.state}...`);
    await del(`/v1/subscriptionAppStoreReviewScreenshots/${existing.data.id}`);
    existing = { data: null };
  }

  if (existing.data && existing.data.attributes.state === 'COMPLETE') {
    console.log(`Subscription ${subId} already has a completed review screenshot.`);
    continue;
  }

  const fileName = 'bsf-iap-review-screenshot.png';
  const created = await post('/v1/subscriptionAppStoreReviewScreenshots', {
    data: {
      type: 'subscriptionAppStoreReviewScreenshots',
      attributes: { fileName, fileSize: bytes.length },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subId } },
      },
    },
  });

  const shotId = created.data.id;
  console.log(`Created upload slot ${shotId}`);
  const upReq = created.data.attributes.uploadOperations?.[0];
  if (!upReq || !upReq.url) {
    throw new Error(`No uploadOperations for ${subId}: ${JSON.stringify(created)}`);
  }

  const putHeaders = hdrObj(upReq.requestHeaders);
  console.log(`Uploading ${bytes.length} bytes via PUT to blob store...`);
  const put = await fetch(upReq.url, { method: 'PUT', headers: putHeaders, body: bytes });
  if (!put.ok) {
    throw new Error(`Upload PUT failed for ${subId}: HTTP ${put.status} ${await put.text()}`);
  }

  console.log('Committing upload...');
  const commit = await fetch(`${API}/v1/subscriptionAppStoreReviewScreenshots/${shotId}`, {
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
  });

  const commitBody = await commit.json().catch(() => ({}));
  if (!commit.ok) {
    throw new Error(`Commit failed for ${subId}: ${JSON.stringify(commitBody.errors || commitBody)}`);
  }
  console.log(`Subscription ${subId}: screenshot uploaded! State: ${commitBody.data?.attributes?.state}`);
}

console.log('\nAll IAP review screenshots uploaded successfully!');
