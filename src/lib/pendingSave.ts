/**
 * "Save listing" while logged out: the heart sends the visitor to
 *   /login?next=/listings/<id>&action=save&listing=<id>
 * and after login/signup we finish the save, then go back to the listing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Login URL (locale-less) that returns to the listing and saves it. */
export function saveLoginHref(listingId: string): string {
  const q = new URLSearchParams({ next: `/listings/${listingId}`, action: "save", listing: listingId });
  return `/login?${q.toString()}`;
}

/** The listing id to save, if this auth page was opened by a logged-out heart click. */
export function pendingSaveId(params: Pick<URLSearchParams, "get">): string | null {
  const id = params.get("listing");
  return params.get("action") === "save" && id && UUID.test(id) ? id : null;
}

/** Query to carry the pending save from login → signup (or back), so it isn't lost on the way. */
export function pendingSaveQuery(params: Pick<URLSearchParams, "get">): string {
  const id = pendingSaveId(params);
  return id ? `&action=save&listing=${id}` : "";
}

/**
 * Saves the listing for the signed-in user. Already-saved is fine (unique user_id + property_id).
 * Never throws: a failed save must not block the redirect after login.
 */
export async function completePendingSave(
  supabase: SupabaseClient,
  params: Pick<URLSearchParams, "get">,
): Promise<void> {
  const listingId = pendingSaveId(params);
  if (!listingId) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("user_favorites")
      .insert({ user_id: user.id, property_id: listingId });
    if (error && error.code !== "23505") console.warn("Pending save failed:", error.message);
  } catch {
    // ignore — the user can tap the heart again
  }
}
