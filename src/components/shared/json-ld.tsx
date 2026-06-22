import * as React from "react";

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    areaServed?: string;
  };
}

export function OrganizationJsonLd({
  name = "LuxStore",
  url = "https://luxstore.com",
  logo = "https://luxstore.com/images/logo.png",
  contactPoint = {
    telephone: "+91-98765-43210",
    contactType: "customer service",
    areaServed: "IN",
  },
}: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: contactPoint.telephone,
      contactType: contactPoint.contactType,
      areaServed: contactPoint.areaServed,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  item: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string[];
  sku: string;
  price: number;
  currency?: string;
  availability?: string; // e.g. "InStock" or "OutOfStock"
  ratingAverage?: number;
  ratingCount?: number;
  brandName?: string;
  reviews?: Array<{
    authorName: string;
    reviewRating: number;
    reviewBody: string;
    datePublished?: string;
  }>;
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  price,
  currency = "INR",
  availability = "InStock",
  ratingAverage,
  ratingCount,
  brandName = "LuxStore Premium",
  reviews = [],
}: ProductJsonLdProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image,
    description,
    sku,
    mpn: sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: typeof window !== "undefined" ? window.location.href : undefined,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  };

  if (ratingAverage && ratingCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingAverage.toString(),
      reviewCount: ratingCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (reviews.length > 0) {
    schema.review = reviews.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.reviewRating.toString(),
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Person",
        name: r.authorName,
      },
      reviewBody: r.reviewBody,
      datePublished: r.datePublished || new Date().toISOString().split("T")[0],
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
