"use client";
import { useEffect, useState } from "react";

export default function ListingsCounter({ count, label }: { count: number; label: string }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (count === 0) return;
    const duration = 1500;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.floor(eased * count));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [count]);

  if (count === 0) return null;

  // Show real count until animation reaches it — avoids "0" flash on first render
  const display = animated || count;

  return (
    <p className="mt-4 text-center text-sm font-semibold text-white/80">
      <span className="text-white text-lg font-extrabold tabular-nums" suppressHydrationWarning>
        {display.toLocaleString()}
      </span>{" "}
      {label}
    </p>
  );
}
