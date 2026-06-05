# Maroclist

A real estate marketplace for Morocco — list and browse properties for sale, rent, or holiday rental.

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
```

Get these from your Supabase dashboard → **Settings → API**.

### 3. Set up Supabase

#### Storage bucket

Run in the Supabase **SQL Editor**:

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

#### Row Level Security policies for `properties`

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

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Property listings (sale, rent, holiday rental)
- Property types: apartment, house, land, farm, team house
- Photo uploads (up to 10 per listing)
- YouTube video tour (optional)
- Search and filter by city, type, price, bedrooms
- Bilingual UI: French and Arabic (RTL)
- User accounts — post, edit, delete listings
- Contact form per listing

## Project Structure

```
src/
  app/
    [locale]/          # Locale-based routing (fr, ar, en)
      listings/        # Public listings page
      listings/[id]/   # Property detail page
      post/            # Create listing
      my-listings/     # Seller dashboard
      sell/            # Seller landing page
  components/          # Shared UI components
  lib/                 # Supabase client, utilities
  types/               # TypeScript types
```

## Deployment

Pushed to `main` on GitHub triggers an automatic Vercel deployment.
