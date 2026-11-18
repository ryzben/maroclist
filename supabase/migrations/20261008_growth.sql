-- ============================================================
-- Maroclist – growth & trust migration (2026-10-08)
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- Admins + Verified Partner (bulk import, step 5)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- No policies: the table is only readable through is_admin() below.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- To make yourself admin (replace the email):
--   INSERT INTO public.admins (user_id)
--   SELECT id FROM auth.users WHERE email = 'you@example.com'
--   ON CONFLICT DO NOTHING;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_verified_partner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'wizard'; -- wizard | quick | import
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS import_batch_id UUID;

-- Owners can update their own rows (RLS), so stop non-admins from granting themselves the badge.
-- auth.role() is NULL in the SQL editor / service role, which are allowed through.
CREATE OR REPLACE FUNCTION public.guard_partner_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified_partner := false;
      NEW.partner_name := NULL;
      NEW.import_batch_id := NULL;
      IF NEW.source = 'import' THEN NEW.source := 'wizard'; END IF;
    ELSE
      NEW.is_verified_partner := OLD.is_verified_partner;
      NEW.partner_name := OLD.partner_name;
      NEW.import_batch_id := OLD.import_batch_id;
      NEW.source := OLD.source;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_guard_partner ON public.properties;
CREATE TRIGGER properties_guard_partner
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.guard_partner_fields();

CREATE INDEX IF NOT EXISTS properties_partner_idx ON public.properties (is_verified_partner) WHERE is_verified_partner = true;

-- ------------------------------------------------------------
-- Buyer alerts (step 8)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  whatsapp TEXT,
  city TEXT,                 -- NULL = any city
  property_type TEXT,        -- NULL = any type
  transaction_type TEXT,     -- NULL = any (sale / rent / holiday_rental)
  budget_max NUMERIC(14, 2), -- NULL = no limit
  locale TEXT NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en', 'ar')),
  source TEXT,               -- page the signup came from (city_page, listing, home, …)
  is_active BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  last_notified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
);

-- One alert per contact + criteria (coalesce so NULL "any" values still collide)
CREATE UNIQUE INDEX IF NOT EXISTS listing_alerts_unique_idx ON public.listing_alerts (
  coalesce(lower(email), ''), coalesce(whatsapp, ''), coalesce(city, ''),
  coalesce(property_type, ''), coalesce(transaction_type, ''), coalesce(budget_max, 0)
);
CREATE INDEX IF NOT EXISTS listing_alerts_active_idx ON public.listing_alerts (is_active, city);

ALTER TABLE public.listing_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone may subscribe; nobody but admins (and the service-role cron) can read the list
DROP POLICY IF EXISTS "Anyone can create alerts" ON public.listing_alerts;
CREATE POLICY "Anyone can create alerts"
  ON public.listing_alerts FOR INSERT
  WITH CHECK (is_active = true);

DROP POLICY IF EXISTS "Admins can read alerts" ON public.listing_alerts;
CREATE POLICY "Admins can read alerts"
  ON public.listing_alerts FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update alerts" ON public.listing_alerts;
CREATE POLICY "Admins can update alerts"
  ON public.listing_alerts FOR UPDATE USING (public.is_admin());

-- Unsubscribe by secret token without exposing the table
CREATE OR REPLACE FUNCTION public.unsubscribe_alert(p_token UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
  UPDATE public.listing_alerts SET is_active = false WHERE unsubscribe_token = p_token AND is_active;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.unsubscribe_alert(UUID) TO anon, authenticated;

-- Carry over sign-ups from the old city-only email alerts, if that table exists
DO $$
BEGIN
  IF to_regclass('public.city_alerts') IS NOT NULL THEN
    INSERT INTO public.listing_alerts (email, city, source)
    SELECT email, city, 'city_alerts' FROM public.city_alerts WHERE email IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
