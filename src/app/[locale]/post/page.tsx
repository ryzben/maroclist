"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
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
  price: "",
  images: [],
  contactPhone: "",
};

export default function PostPage() {
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<PostWizardState>(INITIAL);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => s - 1), []);

  function setTypes(p: PropertyType, t: TransactionType) {
    setState((prev) => ({ ...prev, propertyType: p, transactionType: t }));
  }
  function setCity(city: City) {
    setState((prev) => ({ ...prev, city }));
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
            onChange={setCity}
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
