import type { Metadata } from "next";
import { CartPageClient } from "@/components/shared/cart-page-client";
import { PageWrapper } from "@/components/layouts/page-wrapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Bag | LuxStore Premium",
  description: "View and edit the curated pieces saved in your selection bag at LuxStore before checkout.",
  openGraph: {
    title: "Review Shopping Bag | LuxStore",
    description: "View and edit the curated pieces saved in your selection bag at LuxStore before checkout.",
    type: "website",
  },
};

export default function CartPage() {
  return (
    <PageWrapper>
      <CartPageClient />
    </PageWrapper>
  );
}
