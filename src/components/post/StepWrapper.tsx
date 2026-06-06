"use client";

import { ChevronLeft } from "lucide-react";

interface StepWrapperProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export default function StepWrapper({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
}: StepWrapperProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className="h-1 bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
        <p className="text-xs font-semibold text-gray-400">
          {step} / {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-4 pb-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
