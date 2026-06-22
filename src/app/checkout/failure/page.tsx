import type { Metadata } from "next";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout Session Failed | LuxStore Premium",
  description: "Checkout payment failed. Please check your credentials and try again.",
};

export default function CheckoutFailurePage() {
  return (
    <PageWrapper>
      <Container className="py-24 max-w-xl text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <XCircle className="h-14 w-14 text-destructive mx-auto animate-bounce" />
          <span className="text-[10px] tracking-[0.3em] font-semibold text-destructive uppercase block">
            Payment Rejected
          </span>
          <h1 className="text-3xl font-display font-light uppercase tracking-wider text-foreground">
            Transaction Failed
          </h1>
          <p className="text-xs text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
            Your card issuer declined the payment authorization. No funds were captured. Please verify your billing address or try a different card.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild variant="outline" className="w-full sm:w-auto uppercase tracking-widest text-[10px] h-12 px-8">
            <Link href="/cart"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Bag</Link>
          </Button>
          <Button asChild variant="gold" className="w-full sm:w-auto uppercase tracking-widest text-xs h-12 px-8 font-bold">
            <Link href="/checkout"><RefreshCw className="h-4 w-4 mr-2" /> Retry Checkout</Link>
          </Button>
        </div>
      </Container>
    </PageWrapper>
  );
}
