// Create a new review submission for Garden with Serge (app 6812443628) containing
// the app version + all four subscription versions, then submit it.
// Per https://developer.apple.com/documentation/appstoreconnectapi/submitting-subscriptions-and-subscription-groups-for-app-review
import { makeToken, API } from './asc-jwt.mjs';

const APP = '6812443628';
const SUB_VERSIONS = {
  'Basic Monthly': '6ea43414-6516-46bd-98af-e87e312af759',
  'Basic Yearly': '76080602-96ec-45ab-9855-8945e4af94ef',
  'Green Thumb Monthly': '74b7c1e7-13f0-4bed-a25b-8987c11923d2',
  'Green Thumb Yearly': '8c12a08d-617c-4271-8b3a-063cf3d77b84',
};

const call = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

// 1. Create the review submission
const created = await call('/v1/reviewSubmissions', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: APP } } },
    },
  }),
});
const rsId = created.data.id;
console.log('Created review submission', rsId, 'state', created.data.attributes.state);

// 2. List its items (ASC usually auto-adds the current app version)
const items = await call(`/v1/reviewSubmissions/${rsId}/items`);
console.log('Auto-created items:', items.data.length);
for (const it of items.data) console.log('  item', it.id.slice(-24), 'state', it.attributes.state);

// 3. Add each subscription version
for (const [name, svId] of Object.entries(SUB_VERSIONS)) {
  try {
    const r = await call('/v1/reviewSubmissionItems', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'reviewSubmissionItems',
          relationships: {
            reviewSubmission: { data: { type: 'reviewSubmissions', id: rsId } },
            subscriptionVersion: { data: { type: 'subscriptionVersions', id: svId } },
          },
        },
      }),
    });
    console.log(`Added ${name} (${svId}) -> item state ${r.data.attributes.state}`);
  } catch (e) {
    console.error(`FAILED ${name}: ${e.message.slice(0, 240)}`);
    process.exitCode = 1;
  }
}

console.log('DONE (submission created; review items and submit via PATCH submitted=true)');
