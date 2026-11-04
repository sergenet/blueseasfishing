// Create and configure the "Blue Seas Premium" subscription group and
// Monthly ($7.99) + Yearly ($59.99) subscriptions for Blue Seas Fishing (6817498888).
import { makeToken, API } from './asc-jwt.mjs';

const APP_ID = '6817498888';
const GWS_SUB_ID = '6812490529'; // reference subscription for 175 territory list

const PLANS = [
  {
    name: 'Blue Seas Premium Monthly',
    productId: 'bsf_premium_monthly',
    subscriptionPeriod: 'ONE_MONTH',
    usaPrice: '7.99',
    displayName: 'Blue Seas Premium Monthly',
    description: 'Unlimited AI fish IDs and trip plans.',
  },
  {
    name: 'Blue Seas Premium Yearly',
    productId: 'bsf_premium_yearly',
    subscriptionPeriod: 'ONE_YEAR',
    usaPrice: '59.99',
    displayName: 'Blue Seas Premium Yearly',
    description: 'Unlimited AI fish IDs and trip plans.',
  },
];

const REVIEW_NOTE =
  "In the app, open the 'Identify' or 'More' tab and tap 'Upgrade to Blue Seas Premium' to view and purchase the Monthly ($7.99/mo) or Yearly ($59.99/yr) subscription.";

async function call(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Authorization: `Bearer ${makeToken()}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {}
    if (res.ok) return body;
    if ((res.status === 401 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      continue;
    }
    throw new Error(`${opts.method || 'GET'} ${path} -> HTTP ${res.status}: ${JSON.stringify(body.errors || body)}`);
  }
}

async function getAllPages(initialPath) {
  const items = [];
  let nextUrl = initialPath;
  while (nextUrl) {
    const body = await call(nextUrl);
    if (Array.isArray(body.data)) items.push(...body.data);
    nextUrl = body.links?.next || null;
  }
  return items;
}

// 1. Fetch 175 territories from reference subscription availability
console.log('Fetching 175 territory IDs...');
const territories = await getAllPages(`/v1/subscriptionAvailabilities/${GWS_SUB_ID}/availableTerritories?limit=200`);
const territoryRefs = territories.map((t) => ({ type: 'territories', id: t.id }));
console.log(`Loaded ${territoryRefs.length} territories.`);

// 2. Ensure Subscription Group exists
const groupsResp = await call(`/v1/apps/${APP_ID}/subscriptionGroups`);
let group = groupsResp.data?.find((g) => g.attributes?.referenceName === 'Blue Seas Premium') || groupsResp.data?.[0];

if (!group) {
  console.log('Creating Subscription Group "Blue Seas Premium"...');
  const created = await call('/v1/subscriptionGroups', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'subscriptionGroups',
        attributes: { referenceName: 'Blue Seas Premium' },
        relationships: { app: { data: { type: 'apps', id: APP_ID } } },
      },
    }),
  });
  group = created.data;
}
console.log(`Subscription Group ID: ${group.id} (${group.attributes.referenceName})`);

// 3. Ensure Subscription Group Localization (en-US)
const groupLocs = await call(`/v1/subscriptionGroups/${group.id}/subscriptionGroupLocalizations`);
let enGroupLoc = groupLocs.data?.find((l) => l.attributes?.locale === 'en-US');
if (!enGroupLoc) {
  console.log('Creating en-US localization for Subscription Group...');
  const createdLoc = await call('/v1/subscriptionGroupLocalizations', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'subscriptionGroupLocalizations',
        attributes: {
          locale: 'en-US',
          name: 'Blue Seas Premium',
          customAppName: 'Blue Seas Fishing',
        },
        relationships: {
          subscriptionGroup: { data: { type: 'subscriptionGroups', id: group.id } },
        },
      },
    }),
  });
  enGroupLoc = createdLoc.data;
}
console.log(`Group Localization en-US: ${enGroupLoc.id} (${enGroupLoc.attributes.state})`);

// 4. Create/update each Subscription
const existingSubsResp = await call(`/v1/subscriptionGroups/${group.id}/subscriptions`);
const existingSubs = existingSubsResp.data || [];

for (const plan of PLANS) {
  let sub = existingSubs.find((s) => s.attributes?.productId === plan.productId);
  if (!sub) {
    console.log(`Creating subscription ${plan.productId}...`);
    const createdSub = await call('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          attributes: {
            name: plan.name,
            productId: plan.productId,
            familySharable: false,
            subscriptionPeriod: plan.subscriptionPeriod,
            reviewNote: REVIEW_NOTE,
            groupLevel: 1,
          },
          relationships: {
            group: { data: { type: 'subscriptionGroups', id: group.id } },
          },
        },
      }),
    });
    sub = createdSub.data;
  } else {
    console.log(`Updating subscription ${plan.productId} (${sub.id})...`);
    await call(`/v1/subscriptions/${sub.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: sub.id,
          attributes: {
            name: plan.name,
            familySharable: false,
            subscriptionPeriod: plan.subscriptionPeriod,
            reviewNote: REVIEW_NOTE,
            groupLevel: 1,
          },
        },
      }),
    });
  }
  console.log(`Subscription ${plan.productId} -> ID ${sub.id} (state: ${sub.attributes.state})`);

  // 4a. Localization (en-US)
  const subLocs = await call(`/v1/subscriptions/${sub.id}/subscriptionLocalizations`);
  let enSubLoc = subLocs.data?.find((l) => l.attributes?.locale === 'en-US');
  if (!enSubLoc) {
    console.log(`  Creating en-US localization for ${plan.productId}...`);
    const createdSubLoc = await call('/v1/subscriptionLocalizations', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'subscriptionLocalizations',
          attributes: {
            locale: 'en-US',
            name: plan.displayName,
            description: plan.description,
          },
          relationships: {
            subscription: { data: { type: 'subscriptions', id: sub.id } },
          },
        },
      }),
    });
    enSubLoc = createdSubLoc.data;
  } else {
    await call(`/v1/subscriptionLocalizations/${enSubLoc.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptionLocalizations',
          id: enSubLoc.id,
          attributes: {
            name: plan.displayName,
            description: plan.description,
          },
        },
      }),
    });
  }
  console.log(`  Localization en-US: ${enSubLoc.id}`);

  // 4b. Subscription Availability
  try {
    const avail = await call(`/v1/subscriptions/${sub.id}/subscriptionAvailability`);
    if (avail.data) {
      console.log(`  Availability already set (${avail.data.id})`);
    }
  } catch {
    console.log(`  Setting availability across ${territoryRefs.length} territories...`);
    await call('/v1/subscriptionAvailabilities', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'subscriptionAvailabilities',
          attributes: { availableInNewTerritories: true },
          relationships: {
            subscription: { data: { type: 'subscriptions', id: sub.id } },
            availableTerritories: { data: territoryRefs },
          },
        },
      }),
    });
    console.log(`  Availability created.`);
  }

  // 4c. Subscription Prices
  const existingPrices = await call(`/v1/subscriptions/${sub.id}/prices?limit=200`);
  if ((existingPrices.data?.length || 0) >= 170) {
    console.log(`  Prices already configured (${existingPrices.data.length} territories).`);
  } else {
    console.log(`  Finding USA pricePoint for $${plan.usaPrice}...`);
    const usaPoints = await getAllPages(`/v1/subscriptions/${sub.id}/pricePoints?filter[territory]=USA&limit=200`);
    const matchPoint = usaPoints.find((p) => p.attributes?.customerPrice === plan.usaPrice);
    if (!matchPoint) {
      throw new Error(`Could not find USA price point for $${plan.usaPrice}`);
    }
    console.log(`  Found USA pricePoint ${matchPoint.id} ($${matchPoint.attributes.customerPrice})`);
    const eqPoints = await getAllPages(`/v1/subscriptionPricePoints/${matchPoint.id}/equalizations?limit=200`);
    const allPoints = [matchPoint, ...eqPoints];
    console.log(`  Setting prices across ${allPoints.length} territories...`);

    let setCount = 0;
    for (const pt of allPoints) {
      try {
        await call('/v1/subscriptionPrices', {
          method: 'POST',
          body: JSON.stringify({
            data: {
              type: 'subscriptionPrices',
              attributes: { startDate: null, preserveCurrentPrice: false },
              relationships: {
                subscription: { data: { type: 'subscriptions', id: sub.id } },
                subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: pt.id } },
              },
            },
          }),
        });
        setCount++;
      } catch (e) {
        // Ignore 409 conflict if territory price already exists
        if (!String(e.message).includes('409')) {
          console.warn(`    Price warning for ${pt.id}: ${e.message.slice(0, 120)}`);
        }
      }
    }
    console.log(`  Set ${setCount} territory prices for ${plan.productId}.`);
  }
}

console.log('ALL SUBSCRIPTIONS CONFIGURED SUCCESSFULLY!');
