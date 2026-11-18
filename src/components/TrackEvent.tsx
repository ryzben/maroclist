"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent, type AnalyticsParams } from "@/lib/analytics";

/** Fires one analytics event when mounted — lets server components (e.g. the listing page) track views. */
export default function TrackEvent({ event, params }: { event: AnalyticsEvent; params?: AnalyticsParams }) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, params?.listing_id]);
  return null;
}
