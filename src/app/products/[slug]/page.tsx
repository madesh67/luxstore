import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { ProductDetailClient } from "@/components/shared/product-detail-client";
import { PageWrapper } from "@/components/layouts/page-wrapper";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

// 1. Dynamic Metadata Generation for SEO (Search Engine Optimization)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const product = await ProductService.getProductDetails(slug);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const primaryImage = product.images?.[0]?.imageUrl || "";

    return {
      title: `${product.name} | LuxStore Premium`,
      description: product.shortDescription,
      alternates: {
        canonical: `${appUrl}/products/${slug}`,
      },
      openGraph: {
        title: `${product.name} | LuxStore`,
        description: product.shortDescription,
        url: `${appUrl}/products/${slug}`,
        siteName: "LuxStore",
        images: primaryImage ? [{ url: primaryImage, alt: product.name }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: product.shortDescription,
        images: primaryImage ? [primaryImage] : [],
      },
    };
  } catch {
    return {
      title: "Product Not Found | LuxStore",
    };
  }
}

import { BreadcrumbJsonLd } from "@/components/shared/json-ld";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  let productDetails;
  let relatedProducts = [];

  try {
    productDetails = await ProductService.getProductDetails(slug);
    
    // Fetch related products (same category or brand)
    relatedProducts = await ProductService.getRelatedProducts(
      productDetails.id,
      productDetails.categoryId,
      productDetails.brandId,
      4
    );
  } catch {
    notFound(); // Triggers global Next.js not-found.tsx
  }

  // Await and serialize models for safety across Network boundary
  const serializedProduct = JSON.parse(JSON.stringify(productDetails));
  const serializedRelated = JSON.parse(JSON.stringify(relatedProducts));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Formulate JSON-LD Product Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": serializedProduct.name,
    "image": serializedProduct.images.map((img: { imageUrl: string }) => img.imageUrl),
    "description": serializedProduct.description,
    "sku": serializedProduct.sku,
    "offers": {
      "@type": "Offer",
      "url": `${appUrl}/products/${slug}`,
      "priceCurrency": "INR",
      "price": serializedProduct.price.toString(),
      "availability": serializedProduct.inventory && serializedProduct.inventory.quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    "brand": {
      "@type": "Brand",
      "name": serializedProduct.brand?.name || "LuxStore",
    },
  };

  const breadcrumbs = [
    { name: "Home", item: appUrl },
    { name: "Shop", item: `${appUrl}/shop` },
    { name: serializedProduct.name, item: `${appUrl}/products/${slug}` },
  ];

  return (
    <PageWrapper>
      {/* Inject JSON-LD Schema on Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <ProductDetailClient 
        product={serializedProduct} 
        relatedProducts={serializedRelated} 
      />
    </PageWrapper>
  );
}
