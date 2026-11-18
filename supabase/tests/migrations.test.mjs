// Applies Maroclist's SQL to a real Postgres (PGlite/WASM) with Supabase's auth primitives stubbed,
// then runs the seller-growth checks as PostgREST would (SET ROLE + JWT claims). Two setups:
//   production — public.properties reshaped to the state reported from prod (pg_policies / pg_trigger /
//                columns, 2026-10-17), asserted, then 20261016 applied TWICE (idempotency)
//   fresh      — schema.sql → 20261008 → 20261016, as a brand-new environment would get
// Run: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const sql = (f) => readFileSync(`${REPO}/${f}`, "utf8");
const OWNER = "11111111-1111-1111-1111-111111111111";
const ADMIN = "22222222-2222-2222-2222-222222222222";
const OTHER = "33333333-3333-3333-3333-333333333333";
const all = [];

const SUPABASE_STUBS = `
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth; CREATE SCHEMA storage;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
    SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $$;
  CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, bucket_id text, name text, owner uuid);
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
    SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
`;
const GRANTS = `
  GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth TO anon, authenticated;
`;
// Production's public.properties policies as reported (pg_policies). Bodies of the owner update/delete
// policies weren't given; auth.uid() = user_id is assumed.
const PROD_POLICIES = `
  DROP POLICY "Anyone can read active properties" ON public.properties;
  DROP POLICY "Auth users can insert properties" ON public.properties;
  DROP POLICY "Users can update own properties" ON public.properties;
  DROP POLICY "Users can delete own properties" ON public.properties;
  CREATE POLICY "Authenticated users insert" ON public.properties FOR INSERT WITH CHECK (true);
  CREATE POLICY "Owners delete own listings" ON public.properties FOR DELETE USING (auth.uid() = user_id);
  CREATE POLICY "Owners read own listings" ON public.properties FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Owners update own listings" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Public read active listings" ON public.properties FOR SELECT USING (is_active = true);
`;
// The rest of the reported prod state, asserted before migrating so the starting point can't drift
const PROD_STATE = {
  policies: ["Authenticated users insert", "Owners delete own listings", "Owners read own listings",
    "Owners update own listings", "Public read active listings"],
  triggers: ["properties_guard_partner:guard_partner_fields", "properties_updated_at:set_updated_at"],
  present: ["is_featured", "is_verified_partner", "partner_name", "import_batch_id", "source", "updated_at"],
  missing: ["highlight", "updated_by"],
};
const inventory = async (db) => ({
  policies: (await db.query(`SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='properties'
    ORDER BY policyname`)).rows.map((r) => r.policyname),
  triggers: (await db.query(`SELECT t.tgname || ':' || p.proname AS t FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid='public.properties'::regclass AND NOT t.tgisinternal ORDER BY 1`)).rows.map((r) => r.t),
  columns: (await db.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public'
    AND table_name='properties'`)).rows.map((r) => r.column_name),
});
// The query the user runs on prod to confirm Oct 8 is fully applied (every object it creates exists)
const OCT8_APPLIED = `SELECT to_regclass('public.admins') IS NOT NULL
  AND to_regprocedure('public.is_admin()') IS NOT NULL
  AND to_regprocedure('public.guard_partner_fields()') IS NOT NULL
  AND to_regclass('public.listing_alerts') IS NOT NULL
  AND to_regprocedure('public.unsubscribe_alert(uuid)') IS NOT NULL
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties'
              AND column_name='import_batch_id') AS oct8_applied`;

async function suite(setup) {
  const db = new PGlite();
  const results = [];
  const check = (name, ok, detail = "") => results.push({ setup, name, ok, detail });

  async function as(uid, q, params = [], role = "authenticated") {
    await db.exec("BEGIN");
    try {
      await db.query(`SET LOCAL ROLE ${role}`);
      if (uid) await db.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role })]);
      const r = await db.query(q, params);
      await db.exec("COMMIT");
      return r.rows;
    } catch (e) { await db.exec("ROLLBACK"); throw e; }
  }
  const tryAs = async (...a) => { try { return { rows: await as(...a) }; } catch (e) { return { error: e.message }; } };
  const row = async (id) => (await db.query("SELECT * FROM public.properties WHERE id = $1", [id])).rows[0];
  const note = (p) => !!p.updated_by && p.updated_by !== p.user_id; // same rule as /my-listings
  const newListing = (uid, owner = uid) => tryAs(uid, `INSERT INTO public.properties (user_id, title, price, property_type, transaction_type, city)
    VALUES ($1, 'T', 100, 'apartment', 'sale', 'casablanca') RETURNING id`, [owner]);

  // ── Build the starting state ──
  await db.exec(SUPABASE_STUBS);
  await db.exec(sql("supabase/schema.sql"));
  await db.exec(sql("supabase/migrations/20261008_growth.sql"));
  await db.exec(GRANTS);
  await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${OWNER}','o@x'),('${ADMIN}','a@x'),('${OTHER}','x@x');
                 INSERT INTO public.admins (user_id) VALUES ('${ADMIN}');`);

  if (setup === "production") {
    await db.exec(PROD_POLICIES);
    const inv = await inventory(db);
    check("prod state: 5 reported policies", JSON.stringify(inv.policies) === JSON.stringify(PROD_STATE.policies), inv.policies.join(" | "));
    check("prod state: 2 reported triggers", JSON.stringify(inv.triggers) === JSON.stringify(PROD_STATE.triggers), inv.triggers.join(" | "));
    check("prod state: Oct 8 + base columns present", PROD_STATE.present.every((c) => inv.columns.includes(c)));
    check("prod state: highlight / updated_by missing", PROD_STATE.missing.every((c) => !inv.columns.includes(c)));
    check("prod state: Oct 8 detection query → true", (await db.query(OCT8_APPLIED)).rows[0].oct8_applied === true);
    // The hole being closed: before the migration, a user can create a listing owned by someone else
    const hole = await newListing(OTHER, OWNER);
    check("pre-migration: insert for someone else is allowed (the hole)", !!hole.rows, hole.error ?? "allowed");
    await db.exec("DELETE FROM public.properties");
  }

  const runs = setup === "production" ? 2 : 1;
  for (let i = 1; i <= runs; i++) {
    try { await db.exec(sql("supabase/migrations/20261016_seller_growth.sql")); check(`apply 20261016 (run ${i})`, true); }
    catch (e) { check(`apply 20261016 (run ${i})`, false, e.message); return results; }
  }
  if (setup === "production") {
    // Oct 8 is idempotent too — re-running it over prod must not break anything
    try { await db.exec(sql("supabase/migrations/20261008_growth.sql")); check("re-run 20261008 over prod state", true); }
    catch (e) { check("re-run 20261008 over prod state", false, e.message); }
  }

  // ── Inventory after migration ──
  const pols = (await db.query(`SELECT policyname, cmd, coalesce(qual,'') AS qual, coalesce(with_check,'') AS chk
    FROM pg_policies WHERE schemaname='public' AND tablename='properties' ORDER BY policyname`)).rows;
  const ownerRead = pols.filter((p) => p.cmd === "SELECT" && /auth\.uid\(\) = user_id/.test(p.qual));
  check("exactly one owner-read SELECT policy", ownerRead.length === 1, ownerRead.map((p) => p.policyname).join(", "));
  if (setup === "production") {
    const expected = ["Admins can read all properties", "Admins can update any property", "Authenticated users insert",
      "Owners delete own listings", "Owners read own listings", "Owners update own listings", "Public read active listings"];
    const names = pols.map((p) => p.policyname);
    check("policy set = prod 5 + 2 admin policies, no duplicates", JSON.stringify(names) === JSON.stringify(expected), names.join(" | "));
    const ins = pols.find((p) => p.policyname === "Authenticated users insert");
    check("insert policy tightened", /auth\.uid\(\) = user_id/.test(ins?.chk) && /is_admin/.test(ins?.chk), ins?.chk);
  }
  const trg = (await db.query(`SELECT tgname FROM pg_trigger WHERE tgrelid='public.properties'::regclass AND NOT tgisinternal ORDER BY tgname`)).rows.map((r) => r.tgname);
  check("triggers present, audit sorts last", trg.at(-1) === "properties_zz_audit" && trg.length === 5, trg.join(" | "));

  // ── Insert policy ──
  let r = await newListing(OTHER, OWNER);
  check("insert for someone else → rejected", !!r.error, r.error?.slice(0, 60) ?? "ALLOWED");
  r = await tryAs(null, `INSERT INTO public.properties (user_id, title, price, property_type, transaction_type, city)
    VALUES ($1, 'T', 100, 'apartment', 'sale', 'casablanca')`, [OWNER], "anon");
  check("anonymous (anon role) insert → rejected", !!r.error, r.error?.slice(0, 60) ?? "ALLOWED");
  r = await newListing(ADMIN, OWNER);
  check("admin inserts for someone else → allowed", !!r.rows?.length, r.error ?? "ok");
  if (r.rows?.length) await db.query("DELETE FROM public.properties WHERE id = $1", [r.rows[0].id]);

  // 7. Owner insert (spoofed updated_by / is_featured ignored)
  const ins = await as(OWNER, `INSERT INTO public.properties (user_id, title, price, property_type, transaction_type, city, updated_by, is_featured)
    VALUES ($1, 'T', 1500000, 'apartment', 'sale', 'casablanca', $2, true) RETURNING id`, [OWNER, ADMIN]);
  const id = ins[0].id;
  let p = await row(id);
  check("7. insert works, updated_by empty (spoof ignored)", p.updated_by === null, `updated_by=${p.updated_by}`);
  check("5a. non-admin insert with is_featured=true → false", p.is_featured === false);

  // 1. Owner edit
  let ret = await as(OWNER, "UPDATE public.properties SET price = 1450000 WHERE id = $1 AND user_id = $2 RETURNING id", [id, OWNER]);
  p = await row(id);
  check("1. owner edit → updated_by = owner, no note", ret.length === 1 && p.updated_by === OWNER && !note(p));

  // 2. Admin edit
  ret = await as(ADMIN, "UPDATE public.properties SET description = 'x' WHERE id = $1 RETURNING id", [id]);
  const ownerView = (await as(OWNER, "SELECT * FROM public.properties WHERE user_id = $1", [OWNER]))[0];
  check("2. admin edit → updated_by = admin, note on owner's list", ret.length === 1 && ownerView.updated_by === ADMIN && note(ownerView));

  // 3. Owner no-op save keeps note; real change clears it
  await as(OWNER, "UPDATE public.properties SET price = price WHERE id = $1 AND user_id = $2", [id, OWNER]);
  check("3a. owner no-op save keeps admin note (documented)", (await row(id)).updated_by === ADMIN);
  await as(OWNER, "UPDATE public.properties SET price = 1400000 WHERE id = $1 AND user_id = $2", [id, OWNER]);
  p = await row(id);
  check("3. owner saves again → note clears", p.updated_by === OWNER && !note(p));

  // 4. Admin flips featured only
  ret = await as(ADMIN, "UPDATE public.properties SET is_featured = true WHERE id = $1 RETURNING is_featured", [id]);
  p = await row(id);
  check("4. admin featured-only flip → updated_by unchanged", ret[0]?.is_featured === true && p.updated_by === OWNER);

  // 5. Non-admins can't change featured
  await as(OWNER, "UPDATE public.properties SET is_featured = false WHERE id = $1 AND user_id = $2", [id, OWNER]);
  check("5b. owner un-featuring own listing → blocked", (await row(id)).is_featured === true);
  ret = await as(OTHER, "UPDATE public.properties SET is_featured = false, price = 1 WHERE id = $1 RETURNING id", [id]);
  p = await row(id);
  check("5c. other user updating someone's listing → 0 rows", ret.length === 0 && p.is_featured && Number(p.price) === 1400000);

  // 6. Highlight
  await as(OWNER, "UPDATE public.properties SET highlight = $1 WHERE id = $2", ["  Vue mer\nproche   plage <script>alert(1)</script>  ", id]);
  p = await row(id);
  check("6a. line break + <script> cleaned", p.highlight === "Vue mer proche plage scriptalert(1)/script", JSON.stringify(p.highlight));
  await as(OWNER, "UPDATE public.properties SET highlight = $1 WHERE id = $2", ["x".repeat(80), id]);
  check("6b. 80 chars capped at 60", (await row(id)).highlight?.length === 60);
  await as(OWNER, "UPDATE public.properties SET highlight = $1 WHERE id = $2", ["a‮b\u0007c", id]);
  check("6c. bidi override + control char stripped", (await row(id)).highlight === "abc");
  await as(OWNER, "UPDATE public.properties SET highlight = NULL WHERE id = $1", [id]);
  check("6d. clearing saves NULL", (await row(id)).highlight === null);

  // Inactive listings
  await db.query("UPDATE public.properties SET is_active = false WHERE id = $1", [id]);
  ret = await as(OWNER, "UPDATE public.properties SET price = 1300000 WHERE id = $1 AND user_id = $2 RETURNING id", [id, OWNER]);
  check("x. owner edits own inactive listing", ret.length === 1);
  check("x. other user can't see an inactive listing", (await as(OTHER, "SELECT id FROM public.properties WHERE id = $1", [id])).length === 0);
  check("x. anon can't see an inactive listing", (await as(null, "SELECT id FROM public.properties WHERE id = $1", [id], "anon")).length === 0);
  ret = await as(ADMIN, "UPDATE public.properties SET price = 1250000 WHERE id = $1 RETURNING updated_by", [id]);
  check("x. admin edits inactive listing → note set", ret[0]?.updated_by === ADMIN);

  return results;
}

for (const s of ["production", "fresh"]) all.push(...(await suite(s)));
for (const r of all) console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.setup}] ${r.name}${r.detail ? `  — ${r.detail}` : ""}`);
const failed = all.filter((r) => !r.ok).length;
console.log(`\n${all.length - failed}/${all.length} passed`);
process.exit(failed ? 1 : 0);
