"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/** Admin-only "Featured" switch on a listing page. Renders nothing for everyone else. */
export default function FeaturedToggle({ propertyId, initialFeatured }: { propertyId: string; initialFeatured: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [featured, setFeatured] = useState(initialFeatured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.rpc("is_admin");
      setIsAdmin(data === true);
    });
  }, []);

  if (!isAdmin) return null;

  async function toggle() {
    setSaving(true);
    setError(false);
    const next = !featured;
    // The DB trigger silently keeps the old value for non-admins, so read back what was stored
    const { data, error: err } = await supabase
      .from("properties")
      .update({ is_featured: next })
      .eq("id", propertyId)
      .select("is_featured")
      .single();
    setSaving(false);
    if (err || data?.is_featured !== next) { setError(true); return; }
    setFeatured(next);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-sm">
      <span className="font-semibold text-amber-900">{t("featuredLabel")}</span>
      <div className="flex items-center gap-3">
        {error && <span className="text-red-600">{t("featuredError")}</span>}
        <button
          type="button"
          role="switch"
          aria-checked={featured}
          onClick={toggle}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition disabled:opacity-60",
            featured ? "bg-amber-400 text-amber-900" : "border border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" fill={featured ? "currentColor" : "none"} />}
          {featured ? t("featuredOn") : t("featuredOff")}
        </button>
      </div>
    </div>
  );
}
