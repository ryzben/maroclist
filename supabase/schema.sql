-- ============================================================
-- Maroclist – Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price NUMERIC(14, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'MAD',
  property_type TEXT NOT NULL CHECK (
    property_type IN ('apartment', 'house', 'villa', 'riad', 'new_build', 'land', 'farm', 'commercial')
  ),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent', 'holiday_rental')),
  city TEXT NOT NULL,
  neighborhood TEXT,
  area_sqm NUMERIC(10, 2),
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  images TEXT[] DEFAULT '{}',
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Anyone can read active listings
DROP POLICY IF EXISTS "Anyone can read active properties" ON public.properties;
CREATE POLICY "Anyone can read active properties"
  ON public.properties FOR SELECT
  USING (is_active = true);

-- Authenticated users can insert
DROP POLICY IF EXISTS "Auth users can insert properties" ON public.properties;
CREATE POLICY "Auth users can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own listings
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
CREATE POLICY "Users can update own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Full-text search index
CREATE INDEX IF NOT EXISTS properties_title_fts
  ON public.properties USING gin(to_tsvector('french', coalesce(title, '') || ' ' || coalesce(title_ar, '')));

-- Performance indexes
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties (city);
CREATE INDEX IF NOT EXISTS properties_type_idx ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS properties_transaction_idx ON public.properties (transaction_type);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties (price);
CREATE INDEX IF NOT EXISTS properties_active_created_idx ON public.properties (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS properties_featured_idx ON public.properties (is_featured) WHERE is_featured = true;

-- ============================================================
-- Storage Bucket (run in Supabase Dashboard > Storage)
-- OR uncomment if using service role:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policies
DROP POLICY IF EXISTS "Public images are viewable" ON storage.objects;
CREATE POLICY "Public images are viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Auth users can upload images" ON storage.objects;
CREATE POLICY "Auth users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
