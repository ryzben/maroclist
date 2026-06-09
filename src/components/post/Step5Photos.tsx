"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, ImagePlus } from "lucide-react";
import StepWrapper from "./StepWrapper";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 10;

interface Step5Props {
  images: File[];
  onChange: (images: File[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5Photos({ images, onChange, onNext, onBack }: Step5Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t("wizard.photoTypeError"));
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError(t("wizard.photoSizeError"));
        continue;
      }
      valid.push(file);
    }
    const next = [...images, ...valid].slice(0, MAX_PHOTOS);
    onChange(next);
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <StepWrapper
      step={5}
      totalSteps={6}
      title={t("wizard.step5Title")}
      subtitle={t("wizard.step5Subtitle")}
      onBack={onBack}
    >
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-8 transition hover:border-orange-400 hover:bg-orange-50"
      >
        <Upload className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">{t("wizard.addPhotos")}</span>
        <span className="text-xs text-gray-400">{t("wizard.photoLimit", { max: MAX_PHOTOS })}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
              {i === 0 && (
                <span className="absolute left-1 top-1 z-10 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  1
                </span>
              )}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-orange-300 hover:bg-orange-50 transition"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={images.length === 0}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
      >
        {images.length > 0
          ? t("wizard.continueWithPhotos", { count: images.length })
          : t("wizard.addAtLeastOne")}
      </button>
    </StepWrapper>
  );
}
