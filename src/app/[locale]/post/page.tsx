"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Step1Type from "@/components/post/Step1Type";
import Step2City from "@/components/post/Step2City";
import Step3Price from "@/components/post/Step3Price";
import Step4Photos from "@/components/post/Step4Photos";
import Step5Contact from "@/components/post/Step5Contact";
import SuccessScreen from "@/components/post/SuccessScreen";
import { publishListing, type PostWizardState } from "@/lib/post";
import type { PropertyType, TransactionType, City } from "@/types/property";

const INITIAL: PostWizardState = {
  propertyType: null,
  transactionType: null,
  city: null,
  neighborhood: null,
  price: "",
  images: [],
  contactPhone: "",
};

export default function PostPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<PostWizardState>(INITIAL);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login?next=/post");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => s - 1), []);

  function setTypes(p: PropertyType, tt: TransactionType) {
    setState((prev) => ({ ...prev, propertyType: p, transactionType: tt }));
  }
  function setCity(city: City) {
    setState((prev) => ({
      ...prev,
      city,
      neighborhood: prev.city === city ? prev.neighborhood : null,
    }));
  }
  function setNeighborhood(neighborhood: string | null) {
    setState((prev) => ({ ...prev, neighborhood }));
  }
  function setPrice(price: string) {
    setState((prev) => ({ ...prev, price }));
  }
  function setImages(images: File[]) {
    setState((prev) => ({ ...prev, images }));
  }
  function setPhone(contactPhone: string) {
    setState((prev) => ({ ...prev, contactPhone }));
  }

  async function handlePublish() {
    setIsSubmitting(true);
    try {
      const { id } = await publishListing(state, locale);
      setPublishedId(id);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  if (publishedId) {
    return <SuccessScreen listingId={publishedId} />;
  }

  // Steps 1–5 fill the screen without Navbar to maximize mobile space
  if (step >= 1 && step <= 5) {
    return (
      <>
        {step === 1 && (
          <Step1Type
            propertyType={state.propertyType}
            transactionType={state.transactionType}
            onChange={setTypes}
            onNext={next}
          />
        )}
        {step === 2 && (
          <Step2City
            city={state.city}
            neighborhood={state.neighborhood}
            onChange={setCity}
            onNeighborhoodChange={setNeighborhood}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <Step3Price
            price={state.price}
            onChange={setPrice}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <Step4Photos
            images={state.images}
            onChange={setImages}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && (
          <Step5Contact
            contactPhone={state.contactPhone}
            onChange={setPhone}
            onSubmit={handlePublish}
            onBack={back}
            isSubmitting={isSubmitting}
          />
        )}
      </>
    );
  }

  return <Navbar />;
}
