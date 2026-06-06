# Maroclist

A real estate marketplace for Morocco — connecting property sellers in Morocco with diaspora buyers in the US, Canada, and Europe.

Live: [maroclist.com](https://maroclist.com)

## Tech Stack

- **Next.js 15** (App Router, SSR)
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

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# MAD to USD display rate — update periodically (source: Google Finance)
NEXT_PUBLIC_MAD_TO_USD_RATE=0.099
```

Get Supabase keys from your dashboard → **Settings → API**.

### 3. Set up Supabase

Run all SQL blocks in the Supabase **SQL Editor** in order.

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

```sql
create policy "Public read active listings"
  on public.properties for select to public
  using (is_active = true);

create policy "Owners read own listings"
  on public.properties for select to authenticated
  using (auth.uid() = user_id);

create policy "Authenticated users insert"
  on public.properties for insert to authenticated
  with check (true);

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

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

Pushed to `main` on GitHub triggers an automatic Vercel deployment.

To roll back to v1: `git checkout -b restore-v1 v1 && git push origin restore-v1`
