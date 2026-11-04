// Inspect a reviewSubmissionItem and resolve its asset reference.
// Usage: node tools/asc-rsi.mjs <reviewSubmissionItemId>
import { makeToken, API } from './asc-jwt.mjs';

const id = process.argv[2];
const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${makeToken()}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(`GET ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

const item = await get(`/v1/reviewSubmissionItems/${id}`);
console.log(JSON.stringify(item.data, null, 1));
const rels = item.data.relationships || {};
for (const key of Object.keys(rels)) {
  try {
    const r = await get(`/v1/reviewSubmissionItems/${id}/${key}`);
    console.log(`--- ${key}:`, JSON.stringify(r.data ? (r.data.attributes ? { id: r.data.id, ...r.data.attributes } : r.data) : r));
  } catch (e) {
    console.log(`--- ${key}: ERROR ${e.message.slice(0, 160)}`);
  }
}
