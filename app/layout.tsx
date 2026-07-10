import type { Metadata } from "next";
import { jsonLd } from "@/lib/json-ld";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shokoshop.com";
const SITE_NAME = "ShokoShop";
const DESCRIPTION =
  "Custom T-shirts, hoodies and wall art featuring exclusive music, film, sports, kids, art and culture designs. Fast UK delivery, print-to-order quality — shop ShokoShop.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} – Custom T-Shirts, Hoodies & Wall Art`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Custom T-Shirts, Hoodies & Wall Art`,
    description: DESCRIPTION,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Custom T-Shirts, Hoodies & Wall Art`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// Organization + WebSite structured data on every page so search engines and
// AI answer engines can reliably identify the business and offer sitelinks
// search — this is what lets a query resolve to "ShokoShop" as an entity
// rather than just a page.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/shokoshoplogo-email.png`,
  description: DESCRIPTION,
  sameAs: [] as string[],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/products?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
