import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Maroclist – Immobilier au Maroc",
    template: "%s | Maroclist",
  },
  description:
    "Trouvez votre bien idéal au Maroc. Appartements, maisons, terrains, villas à vendre et à louer.",
  keywords: ["immobilier maroc", "maison maroc", "appartement maroc", "عقارات المغرب"],
  metadataBase: new URL("https://maroclist.com"),
  openGraph: {
    siteName: "Maroclist",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
