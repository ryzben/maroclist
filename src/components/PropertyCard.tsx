import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";
import { Property } from "@/types/property";
import { formatPrice, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
}

const TRANSACTION_COLORS = {
  sale: "bg-orange-500 text-white",
  rent: "bg-emerald-600 text-white",
  holiday_rental: "bg-violet-600 text-white",
};

const TRANSACTION_LABELS: Record<string, string> = {
  sale: "hero.forSale",
  rent: "hero.forRent",
  holiday_rental: "hero.forHoliday",
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const title = locale === "ar" && property.title_ar ? property.title_ar : property.title;
  const cityLabel = t(`cities.${property.city}`);
  const mainImage = property.images?.[0];

  return (
    <Link href={`/listings/${property.id}`} className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-xs text-gray-400">Pas de photo</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Top badges */}
        <div className="absolute start-3 top-3 flex gap-1.5">
          <span className={cn("badge text-xs shadow-sm", TRANSACTION_COLORS[property.transaction_type])}>
            {t(TRANSACTION_LABELS[property.transaction_type])}
          </span>
          {property.is_featured && (
            <span className="badge bg-amber-400 text-amber-900 shadow-sm">
              ★ {t("common.featured")}
            </span>
          )}
        </div>

        {/* Property type pill */}
        <div className="absolute end-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
            {t(`property.types.${property.property_type}`)}
          </span>
        </div>

        {/* Image count */}
        {property.images?.length > 1 && (
          <div className="absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            {property.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xl font-bold text-rose-600">
            {formatPrice(property.price, property.currency)}
            {property.transaction_type !== "sale" && (
              <span className="text-sm font-normal text-gray-400">
                {property.transaction_type === "holiday_rental" ? "/nuit" : t("property.perMonth")}
              </span>
            )}
          </p>
        </div>

        {/* Title */}
        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-800 transition-colors group-hover:text-orange-600">
          {title}
        </h3>

        {/* Location */}
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          <span className="truncate">
            {cityLabel}{property.neighborhood ? `, ${property.neighborhood}` : ""}
          </span>
        </div>

        {/* Stats row */}
        {(property.bedrooms || property.bathrooms || property.area_sqm) && (
          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
            {property.bedrooms ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <BedDouble className="h-3.5 w-3.5 text-gray-400" />
                {property.bedrooms} ch.
              </span>
            ) : null}
            {property.bathrooms ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Bath className="h-3.5 w-3.5 text-gray-400" />
                {property.bathrooms}
              </span>
            ) : null}
            {property.area_sqm ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
                {property.area_sqm} m²
              </span>
            ) : null}
            <span className="ms-auto text-xs text-gray-300">
              {timeAgo(property.created_at, locale)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
