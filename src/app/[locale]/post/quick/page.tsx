"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import SuccessScreen from "@/components/post/SuccessScreen";
import CaptchaWidget, { useCaptcha } from "@/components/Captcha";
import { isCaptchaError } from "@/lib/captcha";
import { supabase } from "@/lib/supabase";
import { publishListing } from "@/lib/post";
import { track } from "@/lib/analytics";
import { findCity } from "@/lib/listingTitle";
import { madToUsd, normalizePhone } from "@/lib/utils";
import { CITIES, type City, type PropertyType, type TransactionType } from "@/types/property";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 10;
const QUICK_TYPES: PropertyType[] = ["apartment", "house", "villa", "land"];

export default function QuickPostPage() {
  return (
    <Suspense>
      <QuickPostForm />
    </Suspense>
  );
}

/**
 * One-screen listing form for sellers arriving from WhatsApp. Only phone, city, price and one photo are
 * required; type/transaction default to the most common choice. Supports prefill links such as
 * /fr/post/quick?city=casablanca&phone=0612345678&price=900000&type=apartment&tx=rent
 */
function QuickPostForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialType = params.get("type") as PropertyType | null;
  const initialTx = params.get("tx") as TransactionType | null;
  const [phone, setPhone] = useState(() => (params.get("phone") ? normalizePhone(params.get("phone")!) : ""));
  const [city, setCity] = useState<City | "">(() => (findCity(params.get("city") ?? "") as City | null) ?? "");
  const [price, setPrice] = useState(() => params.get("price")?.replace(/\D/g, "") ?? "");
  const [propertyType, setPropertyType] = useState<PropertyType>(initialType && QUICK_TYPES.includes(initialType) ? initialType : "apartment");
  const [transactionType, setTransactionType] = useState<TransactionType>(initialTx === "rent" ? "rent" : "sale");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  // Captcha is only needed for the anonymous sign-in, i.e. when there's no session yet (null = checking)
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const captcha = useCaptcha();

  useEffect(() => {
    track("post_start", { flow: "quick", prefilled: params.size > 0 });
    supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    // Object URLs are created and revoked in the same effect so none leak; state only mirrors them
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const ok = Array.from(files).filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE);
    if (ok.length < files.length) setError(t("wizard.photoTypeError"));
    setImages((prev) => [...prev, ...ok].slice(0, MAX_PHOTOS));
  }

  const missing = !phone || !city || !Number(price) || images.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missing) { setError(t("quickPost.missing")); return; }
    setSubmitting(true);
    setError("");
    track("post_submit", { flow: "quick", photos: images.length });
    try {
      // No account wall: an anonymous Supabase session satisfies RLS + storage policies.
      // The seller can attach an email later to keep managing the listing from other devices.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!captcha.ready) {
          setHasSession(false); // session may have expired since load: show the widget
          setError(captcha.requiredMessage);
          return;
        }
        const { error: anonErr } = await supabase.auth.signInAnonymously({ options: captcha.options });
        if (anonErr && isCaptchaError(anonErr)) {
          setError(captcha.errorMessage(anonErr));
          return;
        }
        if (anonErr) {
          // Anonymous sign-ins disabled in Supabase → fall back to the normal login
          router.push("/login?next=/post/quick");
          return;
        }
      }
      const { id } = await publishListing(
        {
          propertyType,
          transactionType,
          city: city as City,
          neighborhood: null,
          price,
          bedrooms: "",
          area: "",
          floor: "",
          description: "",
          highlight: "",
          images,
          contactPhone: phone,
        },
        { source: "quick" }
      );
      track("listing_posted", { flow: "quick", listing_id: id, city, property_type: propertyType, transaction_type: transactionType, photos: images.length });
      setPublishedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (publishedId) return <SuccessScreen listingId={publishedId} />;

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      active ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="min-h-[100dvh] bg-white">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-6 px-4 pb-28 pt-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("quickPost.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("quickPost.subtitle")}</p>
        </div>

        {/* 1. WhatsApp number */}
        <div>
          <label className="label">{t("quickPost.phone")} *</label>
          <PhoneInput
            defaultCountry="MA"
            international
            value={phone}
            onChange={(v) => { setPhone(v ?? ""); setError(""); }}
            placeholder={t("wizard.phonePlaceholder")}
            numberInputProps={{ className: "text-lg", autoComplete: "tel" }}
          />
        </div>

        {/* 2. City */}
        <div>
          <label className="label">{t("post.city")} *</label>
          <select value={city} onChange={(e) => setCity(e.target.value as City)} className="input text-base">
            <option value="">{t("quickPost.chooseCity")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
          </select>
        </div>

        {/* 3. Price */}
        <div>
          <label className="label">{t("quickPost.price")} *</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="input pe-16 text-xl font-bold"
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">MAD</span>
          </div>
          {Number(price) > 0 && <p className="mt-1 text-xs text-gray-400">≈ {madToUsd(Number(price))}</p>}
        </div>

        {/* 4. Photos */}
        <div>
          <label className="label">{t("quickPost.photos")} *</label>
          <div className="grid grid-cols-4 gap-2">
            {previews.map((url, i) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  aria-label={t("common.removePhoto")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-orange-400 hover:bg-orange-50"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-[10px] font-semibold">{images.length}/{MAX_PHOTOS}</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>

        {/* Optional, pre-selected */}
        <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t("quickPost.optional")}</p>
          <div className="flex flex-wrap gap-2">
            {(["sale", "rent"] as const).map((tx) => (
              <button key={tx} type="button" onClick={() => setTransactionType(tx)} className={chip(transactionType === tx)}>
                {tx === "sale" ? t("hero.forSale") : t("hero.forRent")}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TYPES.map((p) => (
              <button key={p} type="button" onClick={() => setPropertyType(p)} className={chip(propertyType === p)}>
                {t(`property.types.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {hasSession === false && <CaptchaWidget captcha={captcha} />}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-center text-xs text-gray-400">
          {t("quickPost.fullFormHint")}{" "}
          <Link href="/post" className="font-semibold text-orange-500 hover:underline">{t("quickPost.fullFormLink")}</Link>
        </p>

        {/* Sticky submit — thumb-reachable on phones */}
        <div className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-md">
            <button
              type="submit"
              disabled={submitting || missing}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-40"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t("wizard.publishing")}</> : t("quickPost.submit")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
