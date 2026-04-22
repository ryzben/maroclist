"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Upload, CheckCircle, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { CITIES, PROPERTY_TYPES } from "@/types/property";

interface FormState {
  title: string;
  title_ar: string;
  description: string;
  price: string;
  currency: string;
  property_type: string;
  transaction_type: string;
  city: string;
  neighborhood: string;
  area_sqm: string;
  bedrooms: string;
  bathrooms: string;
  contact_phone: string;
  contact_email: string;
  video_url: string;
}

const INITIAL: FormState = {
  title: "",
  title_ar: "",
  description: "",
  price: "",
  currency: "MAD",
  property_type: "apartment",
  transaction_type: "sale",
  city: "casablanca",
  neighborhood: "",
  area_sqm: "",
  bedrooms: "",
  bathrooms: "",
  contact_phone: "",
  contact_email: "",
  video_url: "",
};

export default function PostPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("property-images")
          .getPublicUrl(path);
        imageUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from("properties").insert({
        user_id: user.id,
        is_active: true,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        price: Number(form.price),
        currency: form.currency,
        property_type: form.property_type,
        transaction_type: form.transaction_type,
        city: form.city,
        neighborhood: form.neighborhood || null,
        area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        images: imageUrls,
        video_url: form.video_url || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
      });

      if (insertError) throw insertError;

      router.push("/my-listings");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("post.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("post.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t("post.basicInfo")}</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("post.propertyTitle")} (FR) *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={t("post.propertyTitlePlaceholder")}
                  className="input"
                />
              </div>
              <div dir="rtl">
                <label className="label">عنوان الإعلان (AR)</label>
                <input
                  value={form.title_ar}
                  onChange={(e) => set("title_ar", e.target.value)}
                  placeholder="مثال: شقة 3 غرف..."
                  className="input text-right"
                  lang="ar"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("filter.transactionType")} *</label>
                <select required value={form.transaction_type} onChange={(e) => set("transaction_type", e.target.value)} className="input">
                  <option value="sale">{t("hero.forSale")}</option>
                  <option value="rent">{t("hero.forRent")}</option>
                  <option value="holiday_rental">{t("hero.forHoliday")}</option>
                </select>
              </div>
              <div>
                <label className="label">{t("filter.propertyType")} *</label>
                <select required value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className="input">
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`property.types.${type}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t("post.description")}</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={t("post.descriptionPlaceholder")}
                className="input resize-none"
              />
            </div>
          </div>

          {/* Location */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t("property.location")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("post.city")} *</label>
                <select required value={form.city} onChange={(e) => set("city", e.target.value)} className="input">
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{t(`cities.${city}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("post.neighborhood")}</label>
                <input
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  placeholder={t("post.neighborhoodPlaceholder")}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Property details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t("property.details")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="label">{t("post.price")} *</label>
                <input required type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">{t("post.area")}</label>
                <input type="number" min="0" value={form.area_sqm} onChange={(e) => set("area_sqm", e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">{t("post.bedrooms")}</label>
                <input type="number" min="0" max="20" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">{t("post.bathrooms")}</label>
                <input type="number" min="0" max="10" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t("post.photos")}</h2>
            <p className="text-sm text-gray-500">{t("post.photosDesc")}</p>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 hover:border-brand-400 hover:bg-brand-50">
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">{t("post.addPhotos")}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {previews.map((url, i) => (
                  <div key={i} className="relative h-20 overflow-hidden rounded-lg">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute end-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">{t("post.video")}</h2>
            <p className="text-sm text-gray-500">{t("post.videoDesc")}</p>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input"
            />
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Contact</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("post.phone")}</label>
                <input type="tel" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+212 6XX XXX XXX" className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? t("common.loading") : t("post.submit")}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
