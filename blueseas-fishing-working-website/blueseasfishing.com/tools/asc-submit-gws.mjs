// Add app version to the new GWS review submission, list items, submit.
// Usage: node tools/asc-submit-gws.mjs
import { makeToken, API } from './asc-jwt.mjs';

const RS = '5968268c-1bde-443a-9100-9a99937b519d';
const APP_VERSION = '0eaf00d6-1fcd-40f5-a4d3-67aea4d63125'; // 1.1.7 (build 6)

const call = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

// Add the app version item (ignore failure if it already exists)
try {
  const r = await call('/v1/reviewSubmissionItems', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: RS } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: APP_VERSION } },
        },
      },
    }),
  });
  console.log('App version item added:', r.data.id.slice(-20), r.data.attributes.state);
} catch (e) {
  console.log('App version item add note:', e.message.slice(0, 200));
}

// List all items
const items = await call(`/v1/reviewSubmissions/${RS}/items`);
console.log('Items in submission:', items.data.length);
for (const it of items.data) console.log('  ', it.id.slice(-30), '->', it.attributes.state);

// Submit
const patched = await call(`/v1/reviewSubmissions/${RS}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: { type: 'reviewSubmissions', id: RS, attributes: { submitted: true } },
  }),
});
console.log('Submission state after submit:', patched.data.attributes.state);
console.log('submitted =', patched.data.attributes.submitted);
