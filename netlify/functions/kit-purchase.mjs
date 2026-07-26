// Netlify Function (v2) — receives Kit's purchase.purchase_create webhook and
// fans it out to GA4 (Measurement Protocol) and ChatGPT Ads (Conversions API).
//
// Required environment variables (Netlify → Project configuration → Environment variables):
//   GA4_MEASUREMENT_ID            G-KRBRJMCXR4
//   GA4_API_SECRET                Measurement Protocol secret "netlify-kit-purchase"
//   KIT_WEBHOOK_TOKEN             shared secret, passed by Kit as ?token=...
//   OPENAI_CONVERSIONS_API_KEY    ChatGPT Ads conversion key "netlify-kit-purchase"
//
// Optional:
//   OPENAI_PIXEL_ID          defaults to the NIL Brand Academy - Web data source
//   OPENAI_SOURCE_URL        defaults to https://nilbrandacademy.com/
//   OPENAI_VALIDATE_ONLY     "true" → OpenAI validates the payload without storing it
//
// EVERY env var must be set for Production AND Branch deploys. A Production-only
// value is undefined on the variant-light branch deploy, which is what made this
// function 403 on roughly half of all calls on 26 Jul 2026.
//
// ---------------------------------------------------------------------------
// ATTRIBUTION
//
// Kit's hosted checkout is a closed box: the purchase webhook carries no gclid,
// no UTM parameters, no GA4 client id and no ChatGPT Ads oppref/obref. Verified
// against Kit's v4 API — the Purchase object is exactly:
//   id, transaction_id, subscriber_id, status, email_address, currency,
//   transaction_time, subtotal, discount, tax, total, products[], source
// There is no metadata, referrer or free-text field to smuggle a click id
// through. So the click cannot be matched on our side, on either platform.
//
// What we DO get is the buyer's email address. We send a SHA-256 hash of it to
// both platforms and let them do the match on their side. The raw email is
// never transmitted and never logged.
//
// The two platforms normalise the email differently before hashing, so the two
// hashes are NOT interchangeable:
//   Google — lowercase, strip ALL whitespace, and drop dots in the local part
//            of gmail.com / googlemail.com addresses.
//   OpenAI — trim surrounding whitespace and lowercase. Nothing else.
// They coincide for most addresses and diverge for dotted Gmail ones, which is
// exactly the case that would silently depress match rates. Hence two functions.
// ---------------------------------------------------------------------------
//
// NOTE: this file must exist on EVERY branch participating in Netlify Split
// Testing. Split testing intercepts all hostnames — including
// <branch>--<site>.netlify.app — so a branch without this file 404s roughly
// half of all purchases. Verified 26 Jul 2026.

const OPENAI_DEFAULT_PIXEL_ID = 'NDPBHoSxUwspUS5MRw4Yrn';
const OPENAI_DEFAULT_SOURCE_URL = 'https://nilbrandacademy.com/';
const OPENAI_ENDPOINT = 'https://bzr.openai.com/v1/events';

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

  const transactionId = String(purchase.transaction_id);
  const total = Number(purchase.total || 0);
  const currency = String(purchase.currency || 'USD').toUpperCase();
  const products = Array.isArray(purchase.products) ? purchase.products : [];

  // Two hashes, two normalisations. See the ATTRIBUTION note above.
  let googleEmailHash = null;
  let openaiEmailHash = null;
  try {
    googleEmailHash = await sha256Hex(normaliseEmailGoogle(purchase.email_address));
    openaiEmailHash = await sha256Hex(normaliseEmailOpenAI(purchase.email_address));
  } catch (e) {
    console.error('email hashing failed', e);
  }

  // Derived from the email where we have one, so a repeat buyer stays the same
  // GA4 "user" across purchases. Falls back to the transaction id.
  const clientId = 'kit.' + hashToInt(purchase.email_address || transactionId);

  // Neither downstream call is allowed to break the other, or to make Kit retry.
  const [ga4, openai] = await Promise.allSettled([
    sendToGA4({ transactionId, total, currency, products, emailHash: googleEmailHash, clientId }),
    sendToOpenAI({ transactionId, total, currency, products, emailHash: openaiEmailHash, purchase }),
  ]);
  if (ga4.status === 'rejected') console.error('GA4 forward threw', ga4.reason);
  if (openai.status === 'rejected') console.error('OpenAI forward threw', openai.reason);

  return new Response('OK', { status: 200 });
};

// --- GA4 Measurement Protocol ----------------------------------------------
// GA4 takes monetary values in MAJOR units: $27 is 27.

async function sendToGA4({ transactionId, total, currency, products, emailHash, clientId }) {
  const items = products.map((p) => ({
    item_name: p.name || 'NIL Launch Kit',
    item_id: String(p.sku || p.pid || 'nil-launch-kit'),
    price: Number(p.unit_price || total),
    quantity: Number(p.quantity || 1),
  }));

  const payload = {
    client_id: clientId,
    non_personalized_ads: false,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: transactionId,
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

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log(
    'GA4 forward:', res.status,
    'txn', transactionId,
    'value', total, currency,
    'hashedEmail', emailHash ? 'yes' : 'no'
  );
}

// --- ChatGPT Ads Conversions API -------------------------------------------
// OpenAI takes monetary values as INTEGERS in the currency's ISO 4217 minor
// unit: $27 is 2700. Sending 27 would report the sale as twenty-seven cents.
//
// Stays completely inert until OPENAI_CONVERSIONS_API_KEY exists, so it is safe
// to deploy ahead of the key being pasted in.

async function sendToOpenAI({ transactionId, total, currency, products, emailHash, purchase }) {
  const apiKey = process.env.OPENAI_CONVERSIONS_API_KEY;
  if (!apiKey) {
    console.log('OpenAI forward: skipped, OPENAI_CONVERSIONS_API_KEY not set');
    return;
  }
  const pixelId = process.env.OPENAI_PIXEL_ID || OPENAI_DEFAULT_PIXEL_ID;

  const contents = products.map((p) => {
    const item = {
      id: String(p.sku || p.pid || 'nil-launch-kit'),
      name: String(p.name || 'NIL Launch Kit'),
      content_type: 'product',
      quantity: Math.max(1, Math.round(Number(p.quantity || 1))),
    };
    const unit = Number(p.unit_price);
    if (Number.isFinite(unit) && unit > 0) {
      item.amount = toMinorUnits(unit, currency);
      item.currency = currency;
    }
    return item;
  });

  const event = {
    id: transactionId,
    type: 'order_created',
    timestamp_ms: eventTimestampMs(purchase && purchase.transaction_time),
    action_source: 'web',
    source_url: process.env.OPENAI_SOURCE_URL || OPENAI_DEFAULT_SOURCE_URL,
    data: {
      type: 'contents',
      contents: contents.length
        ? contents
        : [
            {
              id: 'nil-launch-kit',
              name: 'NIL Launch Kit',
              content_type: 'product',
              quantity: 1,
            },
          ],
    },
  };

  const amountMinor = toMinorUnits(total, currency);
  if (Number.isFinite(amountMinor) && amountMinor > 0) {
    event.data.amount = amountMinor;
    event.data.currency = currency;
  }

  // We cannot supply oppref or user.obref: both live in first-party cookies on
  // nilbrandacademy.com, and the buyer completes checkout on Kit's domain with
  // no field that survives the round trip. The hashed email is the only join
  // key available, so OpenAI does the match on their side.
  if (emailHash) {
    event.user = { email_sha256: emailHash };
  }

  const validateOnly = String(process.env.OPENAI_VALIDATE_ONLY || '').toLowerCase() === 'true';

  const res = await fetch(OPENAI_ENDPOINT + '?pid=' + encodeURIComponent(pixelId), {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ validate_only: validateOnly, events: [event] }),
  });

  let detail = '';
  if (!res.ok) {
    try { detail = ' body ' + (await res.text()).slice(0, 500); } catch (e) { /* ignore */ }
  }
  console.log(
    'OpenAI forward:', res.status,
    'txn', transactionId,
    'amount', event.data.amount, currency,
    'hashedEmail', emailHash ? 'yes' : 'no',
    validateOnly ? '(validate_only)' : '',
    detail
  );
}

// --- helpers ---------------------------------------------------------------

// Google's normalisation: lowercase, strip all whitespace, and for Gmail
// addresses remove dots in the local part.
function normaliseEmailGoogle(raw) {
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

// OpenAI's normalisation: trim surrounding whitespace, lowercase. That is all
// their docs specify, so doing anything more would produce a hash that cannot
// match theirs.
function normaliseEmailOpenAI(raw) {
  const e = String(raw || '').trim().toLowerCase();
  if (!e || e.indexOf('@') < 0) return '';
  return e;
}

async function sha256Hex(str) {
  if (!str) return null;
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ISO 4217 minor-unit exponents. Anything not listed uses 2.
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG',
  'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);
const THREE_DECIMAL = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

function toMinorUnits(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return NaN;
  const code = String(currency || 'USD').toUpperCase();
  const exp = ZERO_DECIMAL.has(code) ? 0 : THREE_DECIMAL.has(code) ? 3 : 2;
  return Math.round(n * Math.pow(10, exp));
}

// OpenAI rejects events older than 7 days or more than 10 minutes in the
// future. Prefer Kit's own transaction time, fall back to now if it is missing,
// unparseable or outside the accepted window (e.g. a very late webhook retry).
function eventTimestampMs(transactionTime) {
  const now = Date.now();
  const parsed = transactionTime ? Date.parse(transactionTime) : NaN;
  const floor = now - 6.5 * 24 * 60 * 60 * 1000;
  const ceiling = now + 5 * 60 * 1000;
  if (Number.isFinite(parsed) && parsed > floor && parsed < ceiling) return parsed;
  return now;
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
