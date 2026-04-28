"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Upload, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { CITIES, PROPERTY_TYPES } from "@/types/property";
import { normalizePhone } from "@/lib/utils";

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

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations();
  const router = useRouter();

  const [id, setId] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id: listingId }) => {
      setId(listingId);
      load(listingId);
    });
  }, [params]);

  async function load(listingId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (!data) { router.push("/my-listings"); return; }

    setForm({
      title:            data.title ?? "",
      title_ar:         data.title_ar ?? "",
      description:      data.description ?? "",
      price:            data.price?.toString() ?? "",
      currency:         data.currency ?? "MAD",
      property_type:    data.property_type ?? "apartment",
      transaction_type: data.transaction_type ?? "sale",
      city:             data.city ?? "casablanca",
      neighborhood:     data.neighborhood ?? "",
      area_sqm:         data.area_sqm?.toString() ?? "",
      bedrooms:         data.bedrooms?.toString() ?? "",
      bathrooms:        data.bathrooms?.toString() ?? "",
      contact_phone:    data.contact_phone ?? "",
      contact_email:    data.contact_email ?? "",
      video_url:        data.video_url ?? "",
    });
    setExistingImages(data.images ?? []);
    setLoading(false);
  }

  function set(key: keyof FormState, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function removeExisting(idx: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleNewImages(e: React.ChangeEvent<HTMLInputElement>) {
    const remaining = 10 - existingImages.length - newFiles.length;
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  }

  function removeNew(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("property-images")
          .getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }

      const { error: updateError } = await supabase
        .from("properties")
        .update({
          title:            form.title,
          title_ar:         form.title_ar || null,
          description:      form.description || null,
          price:            Number(form.price),
          currency:         form.currency,
          property_type:    form.property_type,
          transaction_type: form.transaction_type,
          city:             form.city,
          neighborhood:     form.neighborhood || null,
          area_sqm:         form.area_sqm ? Number(form.area_sqm) : null,
          bedrooms:         form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms:        form.bathrooms ? Number(form.bathrooms) : null,
          images:           [...existingImages, ...uploadedUrls],
          video_url:        form.video_url || null,
          contact_phone:    form.contact_phone ? normalizePhone(form.contact_phone) : null,
          contact_email:    form.contact_email || null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      router.push("/my-listings");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">{t("common.loading")}</div>
        <Footer />
      </>
    );
  }

  if (!form) return null;

  const totalImages = existingImages.length + newFiles.length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("post.editTitle")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("post.editSubtitle")}</p>
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

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">{t("post.currentPhotos")}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {existingImages.map((url, i) => (
                    <div key={url} className="relative h-20 overflow-hidden rounded-lg">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExisting(i)}
                        className="absolute end-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-red-600 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new images */}
            {totalImages < 10 && (
              <>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 hover:border-orange-400 hover:bg-orange-50 transition">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">{t("post.addPhotos")}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
                </label>

                {newPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {newPreviews.map((url, i) => (
                      <div key={i} className="relative h-20 overflow-hidden rounded-lg">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNew(i)}
                          className="absolute end-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-red-600 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-xs text-gray-400">{totalImages}/10 {t("post.photos").toLowerCase()}</p>
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/my-listings")}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              {t("filter.reset") /* "Cancel" equivalent */}
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-base">
              {saving ? t("common.loading") : t("post.saveChanges")}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
