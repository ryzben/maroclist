# Maroclist

A real estate marketplace for Morocco — connecting property sellers in Morocco with diaspora buyers in the US, Canada, and Europe.

Live: [maroclist.com](https://maroclist.com)

## Tech Stack

- **Next.js 16** (App Router, SSR)
- **Supabase** (PostgreSQL, Auth, Storage)
- **Tailwind CSS** with RTL support
- **next-intl** (French / Arabic / English)
- **Vercel** (hosting)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` (every variable is listed there), or create it with at least:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# MAD to USD display rate — update periodically (source: Google Finance)
NEXT_PUBLIC_MAD_TO_USD_RATE=0.099

# Seller hero "Envoyer par WhatsApp" button on /fr and /ar — digits only, country code, no "+".
# Without it the button is hidden.
NEXT_PUBLIC_WHATSAPP_NUMBER=19175822768
```

Get Supabase keys from your dashboard → **Settings → API**.

Other variables, set on Vercel (optional locally):

| Variable | Used for | Without it |
|---|---|---|
| `RESEND_API_KEY` | Contact-form emails, listing alerts | Emails aren't sent |
| `SUPABASE_SERVICE_ROLE_KEY` | Daily listing-alert cron (`/api/cron/alerts`) | Cron returns 500 |
| `CRON_SECRET` | Authenticates Vercel Cron on `/api/cron/alerts` | Cron returns 401 |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GADS_ID`, `NEXT_PUBLIC_GADS_LABEL_*`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Analytics, ad conversions, cookie banner — see [docs/analytics.md](docs/analytics.md) | That tracker is off; with none set there is no cookie banner |

`NEXT_PUBLIC_*` values are baked in at build time — after changing one on Vercel, redeploy.

### 3. Set up Supabase

Run SQL in the Supabase **SQL Editor** in this order:

1. [`supabase/schema.sql`](supabase/schema.sql) — base tables (`profiles`, `properties`), triggers, storage policies
2. The blocks below
3. Every file in [`supabase/migrations/`](supabase/migrations/), oldest first (`20261008_growth.sql`, then `20261016_seller_growth.sql`, …)

Every script is idempotent (`IF NOT EXISTS` / `DROP … IF EXISTS` / `CREATE OR REPLACE`), so re-running one is safe. Migrations are **not** applied automatically — run each new one by hand in production, then confirm the result (e.g. query `pg_policies`).

#### Storage bucket

```sql
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "Public can view property images"
  on storage.objects for select to public
  using (bucket_id = 'property-images');

create policy "Authenticated users can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images');

create policy "Users can delete own images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

#### RLS policies — `properties`

These are the policy names used in production; later migrations drop and recreate them by name, so keep them.
The insert policy is replaced by `20261016_seller_growth.sql` (which also lets admins insert for others).

```sql
-- schema.sql creates the same policies under older names — remove them
drop policy if exists "Anyone can read active properties" on public.properties;
drop policy if exists "Auth users can insert properties" on public.properties;
drop policy if exists "Users can update own properties" on public.properties;
drop policy if exists "Users can delete own properties" on public.properties;

create policy "Public read active listings"
  on public.properties for select to public
  using (is_active = true);

create policy "Owners read own listings"
  on public.properties for select to authenticated
  using (auth.uid() = user_id);

create policy "Authenticated users insert"
  on public.properties for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Owners update own listings"
  on public.properties for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners delete own listings"
  on public.properties for delete to authenticated
  using (auth.uid() = user_id);
```

#### `user_favorites` table

```sql
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, property_id)
);
alter table public.user_favorites enable row level security;
create policy "Users manage own favourites"
  on public.user_favorites for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

#### `agency_leads` table

```sql
create table if not exists public.agency_leads (
  id uuid primary key default gen_random_uuid(),
  agency_name text not null,
  city text not null,
  listing_count_range text not null,
  contact_name text not null,
  email text not null,
  whatsapp text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.agency_leads enable row level security;
create policy "Anyone can submit agency lead"
  on public.agency_leads for insert to public with check (true);
```

#### `city_alerts` table

```sql
create table if not exists public.city_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  city text not null,
  created_at timestamptz not null default now(),
  unique(email, city)
);
alter table public.city_alerts enable row level security;
create policy "Anyone can subscribe to city alert"
  on public.city_alerts for insert to public with check (true);
```

#### City counts RPC function

```sql
create or replace function get_city_counts()
returns table(city text, count bigint)
language sql security definer as $$
  select city, count(*)::bigint
  from properties
  where is_active = true
  group by city;
$$;
```

#### DB indexes

```sql
create index if not exists idx_properties_is_active        on public.properties(is_active);
create index if not exists idx_properties_city             on public.properties(city);
create index if not exists idx_properties_user_id          on public.properties(user_id);
create index if not exists idx_properties_transaction_type on public.properties(transaction_type);
create index if not exists idx_properties_active_created   on public.properties(created_at desc) where is_active = true;
create index if not exists idx_properties_active_city      on public.properties(city) where is_active = true;
```

#### Enable anonymous auth

In Supabase dashboard → **Authentication → Settings** → enable **Allow anonymous sign-ins**.
This lets sellers post without creating an account.

#### Make yourself admin

Admins can feature listings, edit any listing, and use `/admin/import` and `/admin/alerts`:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com'
on conflict do nothing;
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm run test:db
```

[`supabase/tests/migrations.test.mjs`](supabase/tests/migrations.test.mjs) runs the SQL against an in-memory Postgres
([PGlite](https://pglite.dev)) with Supabase's `auth` schema stubbed, acting as PostgREST does (`SET ROLE` + JWT claims).
No Docker or Supabase account needed. Two setups:

- **production** — `properties` reshaped to the policies, triggers and columns reported from production, asserted, then the
  latest migration applied twice (idempotency)
- **fresh** — `schema.sql` → every migration, as a new environment gets

It checks RLS (who can insert / read / update what), the admin-only `is_featured` guard, `highlight` sanitizing, and the
`updated_by` edit audit. When production's schema changes, update `PROD_POLICIES` / `PROD_STATE` in the test to match.

## Features

- **5-step posting wizard** — mobile-first, under 2 minutes, anonymous posting supported
- **Property listings** — sale, rent, holiday rental
- **Property types** — apartment, house, villa, riad, land, farm, commercial, new build
- **Photo uploads** — up to 15 photos per listing, WebP optimized
- **YouTube video tour** — optional virtual tour embed
- **Search and filter** — city, type, transaction, price range, bedrooms
- **Saved listings** — registered buyers can favourite listings
- **Phone masking** — seller number hidden until buyer clicks to reveal
- **Agency onboarding** — `/agences` landing page with lead capture
- **City empty states** — market content + alert subscription for cities with 0 listings
- **Trilingual UI** — French, English, Arabic (RTL)
- **SEO** — dynamic meta titles, JSON-LD structured data, sitemap, hreflang, canonical URLs
- **Trust bar** — replaces sponsor section on homepage
- **Listings counter** — animated count on homepage hero
- **Seller hero** — seller-first block on the `/fr` and `/ar` home pages: post CTA + WhatsApp button
- **Featured listings** — admin-only (`is_featured` is reset by a trigger when a non-admin sets it)
- **Listing highlight** — optional seller one-liner (≤ 60 chars, plain text, sanitized client- and server-side)
- **Edit audit** — `updated_by` records who last edited a listing; `/my-listings` shows "Modifié par Maroclist" after an admin edit
- **Verified partners + bulk import** — admin CSV import at `/admin/import`
- **Listing alerts** — email alerts for new listings, sent daily by Vercel Cron
- **Funnel tracking** — `post_start`, `post_published`, `whatsapp_buyer_click`, `whatsapp_seller_click` events

## Project Structure

```
src/
  app/
    [locale]/           # Locale-based routing (fr, ar, en)
      listings/         # Public listings page with filters
      listings/[id]/    # Property detail page
      post/             # 5-step posting wizard
      my-listings/      # Seller dashboard
      my-favourites/    # Saved listings for buyers
      agences/          # Agency onboarding landing page
      sell/             # Seller landing page
    api/
      contact/          # Contact form → DB + Resend email
      stats/            # Listing count (60s cache)
      agency-leads/     # Agency lead capture
      city-alerts/      # City alert subscriptions
  components/
    post/               # Wizard step components
  hooks/                # useCountUp animation hook
  lib/                  # Supabase clients, utilities, image optimization
  types/                # TypeScript types
```

## Deployment

Vercel project: `maroclist-p5rq`. A push to `main` deploys to production (maroclist.com); a push to any other branch
builds a preview at `https://maroclist-p5rq-git-<branch>-ryzbens-projects.vercel.app`.

Previews are behind Vercel Authentication — log in to Vercel to open them in a browser. From a terminal, plain `curl`
gets the login page; use the CLI, which adds the bypass header:

```bash
npx vercel@latest curl https://maroclist-p5rq-git-<branch>-ryzbens-projects.vercel.app/fr --yes
```

Managing environment variables (the folder must be linked once with `npx vercel@latest link --project maroclist-p5rq`):

```bash
npx vercel@latest env ls
npx vercel@latest env add NEXT_PUBLIC_WHATSAPP_NUMBER production,preview --value 2126XXXXXXXX --force
npx vercel@latest redeploy <deployment-url> --target preview   # rebuild so NEXT_PUBLIC_* changes take effect
```

Before merging a branch that adds a migration, run the migration in production first (see [Set up Supabase](#3-set-up-supabase)).

To roll back to v1: `git checkout -b restore-v1 v1 && git push origin restore-v1`
