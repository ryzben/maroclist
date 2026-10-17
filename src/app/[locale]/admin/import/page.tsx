"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { BadgeCheck, CheckCircle, Download, FileUp, ImagePlus, Loader2, Trash2, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { CITIES, PROPERTY_TYPES } from "@/types/property";
import { CSV_TEMPLATE, MAX_IMPORT_IMAGES, parseImportCsv, validateRecord, type ImportListing } from "@/lib/bulkImport";
import { listingTitle } from "@/lib/listingTitle";
import { formatPrice } from "@/lib/utils";

type Status = "pending" | "uploading" | "done" | "error";

interface Row {
  key: string;
  line: number | null;
  raw: Record<string, string>;
  listing: ImportListing | null;
  errors: string[];
  files: File[];
  status: Status;
  resultId?: string;
  message?: string;
}

const EMPTY_FORM: Record<string, string> = {
  property_type: "apartment",
  transaction_type: "sale",
  city: "casablanca",
  neighborhood: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  area_sqm: "",
  floor: "",
  description: "",
  contact_phone: "",
  images: "",
};

export default function AdminImportPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [auth, setAuth] = useState<"checking" | "admin" | "denied">("checking");
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [verified, setVerified] = useState(true);
  const [tab, setTab] = useState<"csv" | "form">("csv");
  const [csvText, setCsvText] = useState("");
  const [headerError, setHeaderError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login?next=/admin/import"); return; }
      const { data } = await supabase.rpc("is_admin");
      setAuth(data ? "admin" : "denied");
    });
  }, [router]);

  const valid = rows.filter((r) => r.listing && r.status !== "done");
  const counts = useMemo(() => ({
    valid: rows.filter((r) => r.listing).length,
    invalid: rows.filter((r) => !r.listing).length,
    done: rows.filter((r) => r.status === "done").length,
    failed: rows.filter((r) => r.status === "error").length,
  }), [rows]);

  function update(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function parseCsv(text: string) {
    const { rows: parsed, headerError: he } = parseImportCsv(text, partnerPhone || null);
    if (he) { setHeaderError(he === "empty" ? t("admin.csvEmpty") : t("admin.headerError", { cols: he })); return; }
    setHeaderError("");
    // Rows carry the normalised values so the server re-validates exactly what was previewed
    setRows(parsed.map((r) => ({
      key: crypto.randomUUID(),
      line: r.line,
      raw: r.listing ? toRaw(r.listing) : {},
      listing: r.listing,
      errors: r.errors,
      files: [],
      status: "pending" as Status,
    })));
  }

  function toRaw(l: ImportListing): Record<string, string> {
    return Object.fromEntries(
      Object.entries(l).map(([k, v]) => [k, Array.isArray(v) ? v.join("|") : v == null ? "" : String(v)])
    );
  }

  function addFormRow(e: React.FormEvent) {
    e.preventDefault();
    const { listing, errors } = validateRecord(form, partnerPhone || null);
    setFormErrors(errors);
    if (!listing) return;
    setRows((prev) => [...prev, { key: crypto.randomUUID(), line: null, raw: toRaw(listing), listing, errors: [], files: [], status: "pending" }]);
    // Keep type/transaction/city — agencies usually enter several similar listings in a row
    setForm((f) => ({ ...EMPTY_FORM, property_type: f.property_type, transaction_type: f.transaction_type, city: f.city }));
  }

  async function uploadFiles(userId: string, files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/import-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file);
      if (error) throw error;
      urls.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function runImport() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?next=/admin/import"); return; }
    setRunning(true);
    const batchId = crypto.randomUUID();
    // Sequential on purpose: predictable progress and no burst of storage uploads
    for (const row of valid) {
      update(row.key, { status: "uploading", message: undefined });
      try {
        const uploaded = await uploadFiles(user.id, row.files);
        const images = [...(row.listing!.images ?? []), ...uploaded].slice(0, MAX_IMPORT_IMAGES);
        const res = await fetch("/api/admin/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ record: { ...row.raw, images: images.join("|") }, partnerName, partnerPhone, verified, batchId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        update(row.key, {
          status: "done",
          resultId: data.id,
          message: data.failedImages ? t("admin.imagesSkipped", { count: data.failedImages }) : undefined,
        });
      } catch (err) {
        update(row.key, { status: "error", message: err instanceof Error ? err.message : String(err) });
      }
    }
    setRunning(false);
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "maroclist-import-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (auth !== "admin") {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">
          {auth === "checking" ? <Loader2 className="h-5 w-5 animate-spin" /> : t("admin.notAdmin")}
        </div>
        <Footer />
      </>
    );
  }

  const field = (key: string, label: string, type = "text") => (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input" />
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("admin.subtitle")}</p>
        </div>

        {/* Partner */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">{t("admin.partnerSection")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t("admin.partnerName")}</label>
              <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{t("admin.partnerPhone")}</label>
              <input type="tel" value={partnerPhone} onChange={(e) => setPartnerPhone(e.target.value)} placeholder="06 12 34 56 78" className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 accent-orange-500" />
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            {t("admin.verified")}
          </label>
        </section>

        {/* Input */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex border-b border-gray-100">
            {(["csv", "form"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-5 py-3 text-sm font-semibold ${tab === k ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-500"}`}
              >
                {k === "csv" ? t("admin.tabCsv") : t("admin.tabForm")}
              </button>
            ))}
          </div>

          {tab === "csv" ? (
            <div className="space-y-3 p-6">
              <p className="text-sm text-gray-500">{t("admin.csvHelp")}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  <Download className="h-3.5 w-3.5" /> {t("admin.downloadTemplate")}
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  <FileUp className="h-3.5 w-3.5" /> {t("admin.uploadCsv")}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      setCsvText(text);
                      parseCsv(text);
                    }}
                  />
                </label>
              </div>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={CSV_TEMPLATE}
                className="input font-mono text-xs"
                dir="ltr"
              />
              {headerError && <p className="text-sm text-red-600">{headerError}</p>}
              <button type="button" onClick={() => parseCsv(csvText)} disabled={!csvText.trim()} className="btn-primary disabled:opacity-40">
                {t("admin.parse")}
              </button>
            </div>
          ) : (
            <form onSubmit={addFormRow} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">{t("filter.propertyType")}</label>
                  <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="input">
                    {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{t(`property.types.${p}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t("filter.transactionType")}</label>
                  <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })} className="input">
                    <option value="sale">{t("hero.forSale")}</option>
                    <option value="rent">{t("hero.forRent")}</option>
                    <option value="holiday_rental">{t("hero.forHoliday")}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t("post.city")}</label>
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input">
                    {CITIES.map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
                  </select>
                </div>
                {field("neighborhood", t("post.neighborhood"))}
                {field("price", t("post.price"), "number")}
                {field("area_sqm", t("post.area"), "number")}
                {field("bedrooms", t("post.bedrooms"), "number")}
                {field("bathrooms", t("post.bathrooms"), "number")}
                {field("floor", t("post.floor"), "number")}
                {field("contact_phone", t("post.phone"), "tel")}
                <div className="sm:col-span-2">{field("images", t("admin.imageUrls"))}</div>
              </div>
              <div>
                <label className="label">{t("post.description")}</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" />
              </div>
              {formErrors.length > 0 && <p className="text-sm text-red-600">{formErrors.join(" · ")}</p>}
              <button type="submit" className="btn-primary">{t("admin.addRow")}</button>
            </form>
          )}
        </section>

        {/* Preview */}
        {rows.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
              <p className="text-sm font-semibold text-gray-900">
                {t("admin.rowsSummary", { valid: counts.valid, invalid: counts.invalid })}
                {(counts.done > 0 || counts.failed > 0) && (
                  <span className="ms-2 font-normal text-gray-500">— {t("admin.resultSummary", { ok: counts.done, failed: counts.failed })}</span>
                )}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRows([])} disabled={running} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <Trash2 className="h-3.5 w-3.5" /> {t("admin.clear")}
                </button>
                <button type="button" onClick={runImport} disabled={running || valid.length === 0} className="btn-primary inline-flex items-center gap-2 disabled:opacity-40">
                  {running && <Loader2 className="h-4 w-4 animate-spin" />}
                  {running
                    ? t("admin.importing", { done: counts.done + counts.failed, total: counts.valid })
                    : t("admin.import", { count: valid.length })}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.key} className={r.listing ? "" : "bg-red-50/50"}>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.line ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.listing ? (
                          <>
                            <p className="font-medium text-gray-900">{listingTitle(r.listing, locale)}</p>
                            <p className="text-xs text-gray-500">{formatPrice(r.listing.price)} · {r.listing.contact_phone}</p>
                          </>
                        ) : (
                          <p className="text-xs text-red-600">{r.errors.join(" · ")}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {r.listing && (
                          <label className="inline-flex cursor-pointer items-center gap-1 text-orange-600 hover:text-orange-700">
                            <ImagePlus className="h-3.5 w-3.5" />
                            {t("admin.photos", { count: (r.listing.images?.length ?? 0) + r.files.length })}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              className="hidden"
                              disabled={r.status === "done"}
                              onChange={(e) => update(r.key, { files: [...r.files, ...Array.from(e.target.files ?? [])].slice(0, MAX_IMPORT_IMAGES) })}
                            />
                          </label>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {r.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                        {r.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                            <Link href={`/listings/${r.resultId}`} target="_blank" className="underline">{t("admin.view")}</Link>
                          </span>
                        )}
                        {r.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />{t("admin.failed")}</span>
                        )}
                        {r.message && <p className="mt-0.5 max-w-xs whitespace-normal text-gray-500">{r.message}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
