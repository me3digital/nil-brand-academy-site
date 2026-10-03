// Site-wide settings. Nothing here touches the live site; these are read at build time.
export const SITE = 'https://nilbrandacademy.com';
export const STAGING = process.env.NIL_STAGING !== '0';   // staging by default: everything noindex
// Internal panels (the index quality gate) render only on a staging build that is also running on the staging host or a local machine.
// A launch build (NIL_STAGING=0) can never contain them, and scripts/write-redirects.mjs fails the build if one slips through.
const host = process.env.URL || '';
export const INTERNAL = STAGING && (host === '' || /staging|localhost|127\.0\.0\.1/.test(host));
export const CHECKOUT_URL = 'https://checkout.nilbrandacademy.com/products/nil-launch-kit';
export const checkoutLink = (pageType) =>
  `${CHECKOUT_URL}?utm_source=nil_intel&utm_medium=hub&utm_content=${pageType}`;
// The existing Kit "5 Brands Opt-in" form (id 9711942). Embedding it feeds the existing Lead Magnet Nurture; nothing in Kit changes.
export const KIT_FORM_UID = 'aa527f7eda';
// Plain HTML post to the same Kit form, so the same automation runs and no third-party script is needed.
export const KIT_FORM_ACTION = 'https://app.kit.com/forms/9711942/subscriptions';
export const KIT_FORM_SCRIPT = `https://nil-brand-academy.kit.com/${KIT_FORM_UID}/index.js`;
export const LEAD_MAGNET_URL = `https://nil-brand-academy.kit.com/${KIT_FORM_UID}`;
export const BLOG = {
  firstDeal: { href: '/blog/how-to-get-nil-deals', title: 'How to Get Your First NIL Deal' },
  mediaKit: { href: '/blog/athlete-media-kit-guide', title: 'How to Build an Athlete Media Kit' },
  disclosure: { href: '/blog/nil-disclosure-ftc-rules', title: 'NIL Disclosure and FTC Rules' },
  whatIsNil: { href: '/blog/what-is-nil-guide', title: 'What Is NIL? The Complete Guide' },
  smallFollowing: { href: '/blog/nil-deals-small-following-athletes', title: 'How Small-Following Athletes Land Real NIL Deals' },
};
export const DISCLAIMER = 'Education, not legal advice. NIL rules vary by state, school and conference and change often. Confirm with your school or compliance office before you sign anything.';
