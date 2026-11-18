# Analytics, ad tracking and consent

Code: `src/lib/analytics.ts` (events, `track()`), `src/lib/consent.ts` (consent cookie, Consent Mode),
`src/lib/attribution.ts` (UTM capture), `src/lib/tags.ts` + `src/components/Analytics.tsx` (load the tags after consent),
`src/components/ConsentBanner.tsx` (banner + footer "Cookie settings").
Tests: `src/lib/analytics.test.ts`, `src/lib/consent.test.ts`, `src/lib/tags.test.ts` (`npm test`).

## Environment variables

All optional. **With none set, no script loads, no banner shows and `track()` does nothing.**
They are `NEXT_PUBLIC_*`, so they are baked in at build time: redeploy after changing one.

| Variable | Example | Turns on |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | `G-XXXXXXXXXX` | Google Analytics 4 (`NEXT_PUBLIC_GA_ID` still works as a fallback) |
| `NEXT_PUBLIC_GADS_ID` | `AW-123456789` | Google Ads tag (remarketing + conversions) |
| `NEXT_PUBLIC_GADS_LABEL_SIGN_UP` | `AbC-D_efG` | Ads conversion for `sign_up` |
| `NEXT_PUBLIC_GADS_LABEL_LISTING_POSTED` | | Ads conversion for `listing_posted` (main conversion) |
| `NEXT_PUBLIC_GADS_LABEL_WHATSAPP_CLICK` | | Ads conversion for `whatsapp_click` |
| `NEXT_PUBLIC_GADS_LABEL_SHOW_NUMBER` | | Ads conversion for `show_number` |
| `NEXT_PUBLIC_GADS_LABEL_MESSAGE_SENT` | | Ads conversion for `message_sent` |
| `NEXT_PUBLIC_META_PIXEL_ID` | `1234567890` | Meta Pixel (Facebook / Instagram ads) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `maroclist.com` | Plausible (cookieless, no consent needed) |

A label without `NEXT_PUBLIC_GADS_ID` does nothing. A conversion label is the part after the slash in
Google Ads' `send_to: 'AW-123456789/AbC-D_efG'`.

## Events

| Event | Meta event | Google Ads conversion | Fired when | Where |
|---|---|---|---|---|
| `sign_up` | `CompleteRegistration` | `…_SIGN_UP` | account created | `signup/page.tsx` |
| `listing_posted` | `Lead` (main conversion) | `…_LISTING_POSTED` | listing saved | `post/page.tsx`, `post/quick/page.tsx` |
| `whatsapp_click` | `Contact` | `…_WHATSAPP_CLICK` | WhatsApp button on a listing | `PhoneReveal`, `ContactForm` |
| `show_number` | `Contact` | `…_SHOW_NUMBER` | "Show number" revealed | `PhoneReveal` |
| `message_sent` | `Lead` | `…_MESSAGE_SENT` | contact form sent to the owner | `ContactForm` |
| `search` | `Search` | — | search submitted (home hero, filter change) | `HeroSearchForm`, `SearchFilter` |
| `view_listing` | `ViewContent` | — | listing page viewed | `listings/[id]/page.tsx` |
| `view_seller_landing` | — (custom) | — | seller landing page loaded | `sell/page.tsx` |

Funnel / diagnostic events (GA4, and Meta as custom events; never ad conversions):
`post_start`, `post_step_1`…`post_step_6`, `post_submit`, `call_click` (tapping the revealed number),
`share_whatsapp`, `alert_signup`, `whatsapp_seller_click` (home hero "send by WhatsApp").

Renamed in Nov 2026: `post_published` → `listing_posted`, `whatsapp_buyer_click` → `whatsapp_click`,
`contact_phone` → `show_number` (reveal) / `call_click` (call). `alert_signup` is no longer a Meta `Lead`.

### Parameters

Every event gets `locale` (`fr` / `en` / `ar`). Listing events carry `listing_id`, `city`,
`property_type`, `transaction_type`, `price`, `currency` (see `listingParams()`), plus `placement`
where the same event fires from several places.

`sign_up` and `listing_posted` also carry the campaign attribution: `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content`, `gclid`, `fbclid` (whichever are known; see below).

- **Meta** standard events get `content_ids: [listing_id]`, `content_type: "home_listing"`; `price`
  is dropped so a lead on a 2 M MAD flat is not reported as 2 M of revenue.
- **Google Ads** conversions are sent without a value. Set a value per conversion action in Google Ads
  if you want one.

### Adding an event

1. Add it to `EVENTS` in `src/lib/analytics.ts` (with `meta` / `gads` / `utm` if needed). The type
   system then accepts `track("new_event")`.
2. For a new Ads conversion, add a `GadsLabelKey`, read its env var in `analyticsConfig()` (spelled out
   in full — Next.js only inlines literal `process.env.NEXT_PUBLIC_…`), and add it to `.env.example`.
3. Update the table above and the test in `analytics.test.ts`.

## Consent (Moroccan Law 09-08, GDPR)

- The banner appears only if GA4, Google Ads or Meta is configured. **Accept all** and **Refuse all**
  have equal weight; **Customize** offers two categories: *Audience measurement* (GA4) and
  *Advertising* (Google Ads, Meta). The choice is stored in the `ml_consent` cookie for 6 months.
  The footer link "Cookie settings" reopens it.
- **Basic Consent Mode — nothing loads before consent.** Until the visitor accepts, no Google or Meta
  script is injected and no request goes to any Google or Meta domain (`src/lib/tags.ts`).
  - *Audience measurement* accepted → gtag.js + GA4.
  - *Advertising* accepted → gtag.js + Google Ads, and the Meta Pixel.
  - One gtag.js serves both Google IDs; accepting more later adds the missing `config` / Pixel.
- **Google Consent Mode v2:** when gtag does load, `ad_storage`, `analytics_storage`, `ad_user_data`
  and `ad_personalization` are first set to `denied` (plus `ads_data_redaction`), then `update`d to
  `granted` only for the accepted categories. Trade-off: Google can't model conversions from visitors
  who refuse or ignore the banner.
- **`track()` re-checks consent on every call**: GA4 events need analytics consent; Ads conversions
  and Pixel events need advertising consent.
- **Withdrawing consent** sends `denied` updates, calls `fbq('consent','revoke')`, deletes `_ga*`,
  `_gcl_*`, `_fbp`, `_fbc` cookies, then **reloads the page**: loaded tags can't be removed, and GA4
  would otherwise keep sending cookieless page views.
- GA4 cookies are capped at 13 months (`cookie_expires`).

## Campaign attribution (UTM capture)

`captureAttribution()` runs on every route change. If the URL has any of `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content`, `gclid`, `fbclid`, they replace the previous attribution (last touch).

- Always kept **in memory** for the tab (survives client-side navigation, not a reload).
- Saved to `localStorage` (`ml_attribution`, 30 days) **only with consent** (either category).
- `gclid` / `fbclid` are kept only with *Advertising* consent.
- Refusing deletes the stored copy.

Read it with `getAttribution(readConsent())`, e.g. to save it with a new account or listing (the
`attribution jsonb` migration is pending).

## Setup checklist (when you have the IDs)

**GA4**
1. Create a GA4 property and web stream for `maroclist.com`; copy the Measurement ID → `NEXT_PUBLIC_GA4_ID`.
2. Admin → Data retention → **14 months** (the privacy page says so).
3. Admin → Custom definitions → event-scoped dimensions: `locale`, `city`, `property_type`,
   `transaction_type`, `listing_id`, `placement`, `utm_campaign`.
4. Admin → Events → mark `listing_posted`, `sign_up`, `message_sent`, `whatsapp_click`, `show_number`
   as **key events**.

**Google Ads**
1. Tools → Conversions → New → Website → "Add manually" for each of the five conversion events. Copy
   the `AW-…` ID once → `NEXT_PUBLIC_GADS_ID`, and each label → `NEXT_PUBLIC_GADS_LABEL_*`.
2. Make `listing_posted` the primary conversion; the others secondary.
3. Link Google Ads and GA4.

**Meta**
1. Events Manager → create a Pixel → `NEXT_PUBLIC_META_PIXEL_ID`.
2. Verify the `maroclist.com` domain (Business Settings → Brand safety → Domains).
3. Both `listing_posted` and `message_sent` send **Lead**. To optimise seller campaigns on posted
   listings only, create a Custom Conversion on the Lead event with "URL contains `/post`"
   (`listing_posted` fires on the post pages, `message_sent` on listing pages).

Then on Vercel: add the variables to Production (and Preview if wanted) and redeploy.

## Testing

- Unit tests cover the no-op with empty IDs, the event → Meta/Ads mapping, consent parsing, Consent
  Mode state and attribution storage: `npm test`.
- In a browser: Google **Tag Assistant** (tagassistant.google.com) shows consent state and events;
  GA4 **DebugView**; Meta **Events Manager → Test events** or the Meta Pixel Helper extension.
- Check the three paths: refuse (no `_ga`/`_fbp` cookies, no `connect.facebook.net` request), accept,
  and customize.
