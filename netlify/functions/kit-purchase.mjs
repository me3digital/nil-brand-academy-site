// Netlify Function (v2) — receives Kit's purchase.purchase_create webhook and
// forwards it to GA4 via the Measurement Protocol.
//
// Required environment variables (Netlify → Project configuration → Environment variables):
//   GA4_MEASUREMENT_ID   G-KRBRJMCXR4
//   GA4_API_SECRET       Measurement Protocol secret "netlify-kit-purchase"
//   KIT_WEBHOOK_TOKEN    shared secret, passed by Kit as ?token=...
//
// ---------------------------------------------------------------------------
// ATTRIBUTION
//
// Kit's hosted checkout is a closed box: the purchase webhook carries no gclid,
// no UTM parameters and no GA4 client id. Verified against Kit's v4 API — the
// Purchase object is exactly:
//   id, transaction_id, subscriber_id, status, email_address, currency,
//   transaction_time, subtotal, discount, tax, total, products[], source
// There is no metadata, referrer or free-text field to smuggle a click id
// through. So the click cannot be matched on our side.
//
// What we DO get is the buyer's email address. We send a SHA-256 hash of it as
// GA4 user-provided data, which lets Google perform the match on their side and
// credit the ad click (Google Ads enhanced conversions). The raw email is never
// transmitted and never logged.
//
// This only produces attribution once BOTH of these are on:
//   1. GA4 → Admin → Data collection → User-provided data collection
//   2. Google Ads → the conversion action → Enhanced conversions
// Until then the hash is simply ignored and behaviour is unchanged.
// ---------------------------------------------------------------------------
//
// NOTE: this file must exist on EVERY branch participating in Netlify Split
// Testing. Split testing intercepts all hostnames — including
// <branch>--<site>.netlify.app — so a branch without this file 404s roughly
// half of all purchases. Verified 26 Jul 2026.

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

  // Log the shape of what Kit actually sends, so we can confirm the docs match
  // reality and spot any field that could carry attribution. Personal data is
  // redacted — we log field names and a redacted copy, never the raw email.
  try {
    console.log('kit-purchase inbound keys:', JSON.stringify(inventory(body)));
    console.log('kit-purchase inbound payload (redacted):', JSON.stringify(redact(body)));
  } catch (e) {
    console.error('payload logging failed', e);
  }

  const purchase = body.purchase || body;
  if (!purchase || !purchase.transaction_id) {
    return new Response('No purchase in payload', { status: 202 });
  }

  const total = Number(purchase.total || 0);
  const currency = String(purchase.currency || 'USD').toUpperCase();

  const items = (purchase.products || []).map((p) => ({
    item_name: p.name || 'NIL Launch Kit',
    item_id: String(p.sku || p.pid || 'nil-launch-kit'),
    price: Number(p.unit_price || total),
    quantity: Number(p.quantity || 1),
  }));

  const clientId = 'kit.' + hashToInt(purchase.email_address || purchase.transaction_id);

  // Hashed email for Google-side click matching.
  let emailHash = null;
  try {
    emailHash = await sha256Hex(normaliseEmail(purchase.email_address));
  } catch (e) {
    console.error('email hashing failed', e);
  }

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
          engagement_time_msec: 1,
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

  if (emailHash) {
    // Stable pseudonymous identifier, plus the enhanced-conversions payload.
    payload.user_id = emailHash;
    payload.user_data = { sha256_email_address: [emailHash] };
  }

  const endpoint =
    'https://www.google-analytics.com/mp/collect' +
    '?measurement_id=' + encodeURIComponent(process.env.GA4_MEASUREMENT_ID || '') +
    '&api_secret=' + encodeURIComponent(process.env.GA4_API_SECRET || '');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(
      'GA4 forward:', res.status,
      'txn', String(purchase.transaction_id),
      'value', total, currency,
      'hashedEmail', emailHash ? 'yes' : 'no'
    );
  } catch (e) {
    console.error('GA4 forward failed', e);
  }

  return new Response('OK', { status: 200 });
};

// --- helpers ---------------------------------------------------------------

// Google's normalisation: lowercase, trim, strip all spaces, and for Gmail
// addresses remove dots in the local part.
function normaliseEmail(raw) {
  let e = String(raw || '').toLowerCase().replace(/\s+/g, '').trim();
  if (!e || e.indexOf('@') < 0) return '';
  const at = e.lastIndexOf('@');
  let local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
  }
  return local + '@' + domain;
}

async function sha256Hex(str) {
  if (!str) return null;
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Field-name inventory — tells us at a glance whether Kit ever starts sending
// something new that we could use for attribution.
function inventory(obj, prefix = '', out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const k of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + k : k;
    out.push(path);
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) inventory(v, path, out);
    if (Array.isArray(v) && v.length && typeof v[0] === 'object') inventory(v[0], path + '[]', out);
  }
  return out;
}

// Redact anything that looks like personal data before it reaches the logs.
function redact(obj) {
  const SENSITIVE = /email|first_name|last_name|name_|phone|address/i;
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) {
        o[k] = SENSITIVE.test(k) && typeof v[k] === 'string' ? '[redacted]' : walk(v[k]);
      }
      return o;
    }
    return v;
  };
  return walk(obj);
}

function hashToInt(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
