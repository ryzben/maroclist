"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";

interface FavouriteButtonProps {
  propertyId: string;
  initialSaved: boolean;
  className?: string;
}

export default function FavouriteButton({ propertyId, initialSaved, className = "" }: FavouriteButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    // Optimistic update
    setSaved((prev) => !prev);
    try {
      if (saved) {
        await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId);
      } else {
        await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, property_id: propertyId });
      }
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
      aria-label={saved ? "Remove from favourites" : "Save listing"}
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
