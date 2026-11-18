-- Run on 2026-11-17 in the Supabase SQL editor. Deactivated:
--   efce5564-8704-4384-aff4-ac2e67f95a18
--   7a768985-b063-4f1a-807d-15b952df94d7
--   e0627deb-efec-422f-888f-be8bdc19e3f3
-- Checked afterwards: 6 active listings left, these 3 no longer public.
--
-- Task 8: hide 3 listings with unusable photos
--   efce5564…  Apartment for sale à Agadir       Mubawab watermark
--   7a768985…  Apartment for sale à Casablanca   developer banner (Annabi Immobilier sales office)
--   e0627deb…  Apartment for sale à Fès          Fès tanneries stock photo
--
-- Run by hand in the Supabase SQL editor. Not a migration.
-- This sets is_active = false (hidden from the public, still visible to the owner and admins).
-- It does not delete anything.

-- Step 1: check these are the right rows. Expect exactly 3 rows, all is_active = true.
SELECT id, title, city, user_id, is_active, images[1] AS first_image, created_at
FROM public.properties
WHERE id IN (
  'efce5564-8704-4384-aff4-ac2e67f95a18',  -- Agadir: Mubawab watermark
  '7a768985-b063-4f1a-807d-15b952df94d7',  -- Casablanca: developer banner
  'e0627deb-efec-422f-888f-be8bdc19e3f3'   -- Fès: tanneries stock photo
);

-- Step 2: deactivate them. Run as a single statement, with no BEGIN/COMMIT:
-- the SQL editor rolls back a transaction that isn't committed in the same run.
-- Expect 3 rows in the RETURNING output.
UPDATE public.properties
SET is_active = false
WHERE id IN (
  'efce5564-8704-4384-aff4-ac2e67f95a18',
  '7a768985-b063-4f1a-807d-15b952df94d7',
  'e0627deb-efec-422f-888f-be8bdc19e3f3'
)
  AND is_active = true
RETURNING id, title, is_active;

-- Undo (if needed): run the same UPDATE with is_active = true and AND is_active = false.
