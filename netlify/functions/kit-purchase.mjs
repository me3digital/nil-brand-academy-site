// Netlify Function (v2) — receives Kit's purchase.purchase_create webhook and
// forwards it to GA4 via the Measurement Protocol.
//
// Kit's hosted checkout cannot be tagged client-side, so the purchase is caught
// server-side here. The payload carries no gclid or UTMs; Google Ads attribution
// is recovered from the GA4 session on the landing page.
//
// Required environment variables (Netlify → Project configuration → Environment variables):
//   GA4_MEASUREMENT_ID   G-KRBRJMCXR4
//   GA4_API_SECRET       Measurement Protocol secret "netlify-kit-purchase"
//   KIT_WEBHOOK_TOKEN    shared secret, passed by Kit as ?token=...
//
// NOTE: this file must exist on EVERY branch participating in Netlify Split
// Testing. Split testing intercepts all hostnames — including <branch>--<site>
// .netlify.app — so a branch without this file 404s roughly half of all
// purchases. Verified 26 Jul 2026.

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = new URL(request.url).searchParams.get('token');
  if (!token || token !== process.env.KIT_WEBHOOK_TOKEN) {
    return new Response('Forbidden', { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Bad JSON', { status: 400 });
  }

  const purchase = body.purchase || body;
  if (!purchase || !purchase.transaction_id) {
    return new Response('No purchase in payload', { status: 202 });
  }

  const total = Number(purchase.total || 0);
  const currency = String(purchase.currency || 'USD').toUpperCase();

  const items = (purchase.products || []).map((p) => ({
    item_name: p.name || 'NIL Launch Kit',
    item_id: String(p.sku || 'nil-launch-kit'),
    price: Number(p.unit_price || total),
    quantity: Number(p.quantity || 1),
  }));

  const clientId = 'kit.' + hashToInt(purchase.email_address || purchase.transaction_id);

  const payload = {
    client_id: clientId,
    non_personalized_ads: false,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: String(purchase.transaction_id),
          value: total,
          currency: currency,
          items: items.length
            ? items
            : [
                {
                  item_name: 'NIL Launch Kit',
                  item_id: 'nil-launch-kit',
                  price: total,
                  quantity: 1,
                },
              ],
        },
      },
    ],
  };

  const endpoint =
    'https://www.google-analytics.com/mp/collect' +
    '?measurement_id=' + encodeURIComponent(process.env.GA4_MEASUREMENT_ID || '') +
    '&api_secret=' + encodeURIComponent(process.env.GA4_API_SECRET || '');

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('GA4 forward failed', e);
  }

  return new Response('OK', { status: 200 });
};

function hashToInt(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
