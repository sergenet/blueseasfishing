// Set Privacy Policy URL (app info localization) + Support URL (version localization) for Blue Seas Fishing.
import { makeToken, API } from './asc-jwt.mjs';

const APP_INFO = '825024d4-b11b-4274-9479-ac7ce60376a7';
const VERSION = '0eaf00d6-1fcd-40f5-a4d3-67aea4d63125';
const PRIVACY = 'https://www.blueseasfishing.com/privacy.html';
const SUPPORT = 'https://www.blueseasfishing.com/contact.html';

const call = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

// Privacy Policy URL on the app info localization
const locs = await call(`/v1/appInfos/${APP_INFO}/appInfoLocalizations`);
const loc = locs.data.find((l) => l.attributes.locale === 'en-US');
const patched = await call(`/v1/appInfoLocalizations/${loc.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: { type: 'appInfoLocalizations', id: loc.id, attributes: { privacyPolicyUrl: PRIVACY } },
  }),
});
console.log('privacyPolicyUrl ->', patched.data.attributes.privacyPolicyUrl);

// Support URL on the version localization
const vlocs = await call(`/v1/appStoreVersions/${VERSION}/appStoreVersionLocalizations`);
const vloc = vlocs.data.find((l) => l.attributes.locale === 'en-US');
const vpatched = await call(`/v1/appStoreVersionLocalizations/${vloc.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: { type: 'appStoreVersionLocalizations', id: vloc.id, attributes: { supportUrl: SUPPORT } },
  }),
});
console.log('supportUrl ->', vpatched.data.attributes.supportUrl);
