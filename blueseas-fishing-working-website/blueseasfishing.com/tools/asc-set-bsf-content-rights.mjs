// Declares Content Rights for Blue Seas (does not contain third-party content).
// NOTE: contentRightsDeclaration lives on appInfoLocalizations (en-US: f4282ada-...).
// Usage: MSYS2_ARG_CONV_EXCL="*" node tools/asc-set-bsf-content-rights.mjs
import { makeToken, API } from './asc-jwt.mjs';

const LOC_ID = 'f4282ada-9a78-42e8-85a2-5c10618e2478'; // en-US appInfoLocalization

const res = await fetch(`${API}/v1/appInfoLocalizations/${LOC_ID}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      type: 'appInfoLocalizations',
      id: LOC_ID,
      attributes: { contentRightsDeclaration: 'DOES_NOT_CONTAIN_THIRD_PARTY_CONTENT' },
    },
  }),
});
console.log(res.status);
console.log(await res.text());
if (res.status >= 300) process.exit(1);
