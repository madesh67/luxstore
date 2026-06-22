import type { Metadata } from "next";
import { CheckoutClient } from "@/components/shared/checkout-client";
import { PageWrapper } from "@/components/layouts/page-wrapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Checkout | LuxStore Premium",
  description: "Secure payment gateway for ordering handcrafted luxury accessories at LuxStore.",
  openGraph: {
    title: "Checkout | LuxStore",
    description: "Secure payment gateway for ordering handcrafted luxury accessories at LuxStore.",
    type: "website",
  },
};

export default function CheckoutPage() {
  return (
    <PageWrapper>
      <CheckoutClient />
    </PageWrapper>
  );
}
