"use client";
import { useCountUp } from "@/hooks/useCountUp";

export default function ListingsCounter({ count, label }: { count: number; label: string }) {
  const animated = useCountUp(count);
  if (count === 0) return null;
  return (
    <p className="mt-4 text-center text-sm font-semibold text-white/80">
      <span className="text-white text-lg font-extrabold tabular-nums">
        {animated.toLocaleString()}
      </span>{" "}
      {label}
    </p>
  );
}
