// Attach subscription items to an existing review submission.
// Usage: node tools/asc-add-sub-to-submission.mjs <reviewSubmissionId> <subscriptionVersionId...>
import { makeToken, API } from './asc-jwt.mjs';

const [rsId, ...subVerIds] = process.argv.slice(2);
if (!rsId || subVerIds.length === 0) {
  console.error('Usage: node tools/asc-add-sub-to-submission.mjs <reviewSubmissionId> <subscriptionVersionId...>');
  process.exit(1);
}

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

for (const svId of subVerIds) {
  try {
    const created = await post('/v1/reviewSubmissionItems', {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: rsId } },
          subscriptionVersion: { data: { type: 'subscriptionVersions', id: svId } },
        },
      },
    });
    console.log(`Added subscriptionVersion ${svId} -> item ${created.data.id} state ${created.data.attributes.state}`);
  } catch (e) {
    console.error(`FAILED ${svId}: ${e.message.slice(0, 300)}`);
  }
}
