"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { saveLoginHref } from "@/lib/pendingSave";

interface FavouriteButtonProps {
  propertyId: string;
  initialSaved: boolean;
  className?: string;
}

export default function FavouriteButton({ propertyId, initialSaved, className = "" }: FavouriteButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("favourites");

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Come back to this listing after login and finish the save there (see lib/pendingSave)
      router.push(saveLoginHref(propertyId));
      return;
    }

    setLoading(true);
    // Optimistic update
    setSaved((prev) => !prev);
    try {
      const { error } = saved
        ? await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("property_id", propertyId)
        : await supabase
            .from("user_favorites")
            .insert({ user_id: user.id, property_id: propertyId });
      // Supabase reports failures in `error` instead of throwing; "already saved" counts as saved
      if (error && error.code !== "23505") throw error;
    } catch {
      // Rollback on error
      setSaved((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      // Toggle button: constant label, state carried by aria-pressed
      aria-label={t("save")}
      aria-pressed={saved}
      title={saved ? t("remove") : t("save")}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-110 active:scale-95 ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          saved ? "fill-red-500 text-red-500" : "text-gray-400"
        } ${loading ? "opacity-50" : ""}`}
      />
    </button>
  );
}
