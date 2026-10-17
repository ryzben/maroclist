-- Seller growth (2026-10-16): admin-only `is_featured`, optional `highlight` text, edit audit (`updated_by`).
-- Requires 20261008_growth.sql (public.is_admin()). Run manually in the Supabase SQL editor.

-- Owners can update their own rows through RLS, so stop non-admins from featuring themselves.
-- auth.role() is NULL in the SQL editor / service role, which are allowed through.
CREATE OR REPLACE FUNCTION public.guard_featured()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_featured := false;
    ELSE
      NEW.is_featured := OLD.is_featured;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_guard_featured ON public.properties;
CREATE TRIGGER properties_guard_featured
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.guard_featured();

-- Lets admins toggle `is_featured` on anyone's listing (owners keep their existing update policy)
DROP POLICY IF EXISTS "Admins can update any property" ON public.properties;
CREATE POLICY "Admins can update any property"
  ON public.properties FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- schema.sql only lets anyone read *active* rows, and Postgres applies SELECT policies to UPDATE ... WHERE,
-- so a deactivated listing vanished from its owner's /my-listings and every edit of it was a silent no-op.
-- Public pages are unaffected: they all filter is_active = true explicitly.
DROP POLICY IF EXISTS "Owners can read own properties" ON public.properties;
CREATE POLICY "Owners can read own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all properties" ON public.properties;
CREATE POLICY "Admins can read all properties"
  ON public.properties FOR SELECT
  USING (public.is_admin());

-- Optional seller one-liner shown under the generated title (max 60 chars, plain text).
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS highlight TEXT;

-- Server-side twin of sanitizeHighlight() in src/lib/highlight.ts, so direct API writes are cleaned too
CREATE OR REPLACE FUNCTION public.sanitize_highlight()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.highlight IS NOT NULL THEN
    -- Whitespace first, so a line break becomes a space instead of gluing two words together
    NEW.highlight := regexp_replace(NEW.highlight, '\s+', ' ', 'g');
    NEW.highlight := regexp_replace(NEW.highlight, '[\x01-\x1F\x7F-\x9F\u200E\u200F\u202A-\u202E\u2066-\u2069<>]', '', 'g');
    NEW.highlight := btrim(left(btrim(NEW.highlight), 60));
    NEW.highlight := NULLIF(NEW.highlight, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_sanitize_highlight ON public.properties;
CREATE TRIGGER properties_sanitize_highlight
  BEFORE INSERT OR UPDATE OF highlight ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_highlight();

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_highlight_len;
ALTER TABLE public.properties ADD CONSTRAINT properties_highlight_len CHECK (char_length(highlight) <= 60);

-- Lightweight edit audit: who last changed a listing. /my-listings shows "Modifié par Maroclist" when
-- that's someone other than the owner (i.e. an admin). `updated_at` already exists (schema.sql).
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Always overwrites client-sent values, so nobody can spoof the audit. auth.uid() is NULL for the
-- SQL editor / service role. A change that only flips `is_featured` keeps the previous editor: the
-- "featured" badge already tells the owner, and featuring isn't an edit of their content.
CREATE OR REPLACE FUNCTION public.audit_property_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  others_only public.properties%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.updated_by := NULL;
    RETURN NEW;
  END IF;

  NEW.updated_at := now();
  others_only := NEW;
  others_only.is_featured := OLD.is_featured;
  others_only.updated_at := OLD.updated_at;
  others_only.updated_by := OLD.updated_by;
  IF others_only IS NOT DISTINCT FROM OLD THEN
    NEW.updated_by := OLD.updated_by;
  ELSE
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Named to sort last: Postgres fires BEFORE triggers alphabetically, so this sees the row after the
-- guard / sanitize triggers have adjusted it.
DROP TRIGGER IF EXISTS properties_zz_audit ON public.properties;
CREATE TRIGGER properties_zz_audit
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.audit_property_update();
