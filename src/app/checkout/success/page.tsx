import type { Metadata } from "next";
import { CheckoutSuccessClient } from "@/components/shared/checkout-success-client";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Placed Successfully | LuxStore Premium",
  description: "Curating your handcrafted luxury selection. Thank you for your purchase.",
};

export default function CheckoutSuccessPage() {
  return (
    <PageWrapper>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-32 space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Syncing Order Details...</span>
        </div>
      }>
        <CheckoutSuccessClient />
      </Suspense>
    </PageWrapper>
  );
}
