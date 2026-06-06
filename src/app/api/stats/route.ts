import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  return NextResponse.json(
    { listings_count: count ?? 0 },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
