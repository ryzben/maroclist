import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-free anon client for public, cacheable reads (city pages, sitemap, OG images).
 * Using the cookie-based server client would force every page that reads data to render dynamically.
 */
export function createSupabasePublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
