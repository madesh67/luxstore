"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCheckoutStatus } from "@/hooks/use-checkout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Loader2, CheckCircle2, ArrowRight, Home, Calendar } from "lucide-react";
import Link from "next/link";
import { Container } from "./container";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntentId = searchParams.get("paymentIntentId") || "";

  // Poll order status
  const { data, isLoading, isError } = useCheckoutStatus({ paymentIntentId });

  React.useEffect(() => {
    if (!paymentIntentId) {
      router.push("/");
    }
  }, [paymentIntentId, router]);

  if (isLoading || !data) {
    return (
      <Container className="py-24 max-w-xl text-center space-y-4 animate-fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
        <h2 className="text-xl uppercase tracking-widest font-display font-medium text-foreground">Confirming Payment</h2>
        <p className="text-xs text-muted-foreground font-light max-w-sm mx-auto leading-relaxed">
          Stripe is verifying your transaction. We are preparing your curated masterpieces. Please do not close or reload this page.
        </p>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-24 max-w-xl text-center space-y-6 animate-fade-in">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          ⚠️
        </div>
        <h2 className="text-xl uppercase tracking-widest font-display font-medium text-foreground">Verification Delay</h2>
        <p className="text-xs text-muted-foreground font-light max-w-sm mx-auto leading-relaxed">
          We are experiencing a small delay validating your payment. You will receive an email confirmation once the transaction completes.
        </p>
        <Button asChild variant="outline" className="text-xs uppercase tracking-widest">
          <Link href="/">Return to Storefront</Link>
        </Button>
      </Container>
    );
  }

  interface AddressSnapshotType {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: "HOME" | "WORK" | "OTHER";
  }

  interface OrderType {
    id: string;
    orderNumber: string;
    email: string;
    createdAt: string;
    subtotal: number;
    shippingCost: number;
    taxCost: number;
    total: number;
    shippingAddressSnapshot: unknown;
    items: {
      productName: string;
      productSku: string;
      quantity: number;
      price: number;
    }[];
  }

  const order = data.order as unknown as OrderType;
  const items = order.items || [];
  const address = order.shippingAddressSnapshot as unknown as AddressSnapshotType;

  return (
    <Container className="py-16 max-w-3xl space-y-12 animate-fade-in">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-14 w-14 text-accent mx-auto animate-pulse" />
        <span className="text-[10px] tracking-[0.3em] font-semibold text-accent uppercase block">
          Payment Authorized
        </span>
        <h1 className="text-3xl font-display font-light uppercase tracking-wider text-foreground">
          Thank you for your order
        </h1>
        <p className="text-xs text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
          Your order has been placed successfully and is currently being curated. A confirmation email was dispatched to <strong>{order.email}</strong>.
        </p>
      </div>

      {/* Details Card */}
      <div className="border border-border/40 bg-card p-6 rounded-sm divide-y divide-border/20 space-y-6">
        {/* Order Number Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Order Number</p>
            <p className="text-base font-mono font-bold text-foreground">{order.orderNumber}</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Date Placed</p>
            <p className="text-xs text-foreground flex items-center gap-1.5 justify-end">
              <Calendar className="h-3.5 w-3.5" /> {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>
        </div>

        {/* Shipping & Delivery Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          <div className="space-y-2 text-xs">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Shipping Address</p>
            <p className="font-semibold text-foreground uppercase">{address.firstName} {address.lastName}</p>
            <p className="text-muted-foreground font-light leading-relaxed">
              {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
              {address.city}, {address.state} - {address.postalCode}
            </p>
            <p className="text-muted-foreground font-light">Contact: {address.phoneNumber}</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Carrier & Shipping</p>
            <p className="font-semibold text-foreground uppercase">Luxury Express Shipping</p>
            <p className="text-muted-foreground font-light">
              Delivery will be coordinated using priority channels. Expected transition within 3 business days.
            </p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="py-6 space-y-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Purchased Items</p>
          <div className="divide-y divide-border/20">
            {items.map((item: { productName: string; productSku: string; quantity: number; price: number }, idx: number) => (
              <div key={idx} className="flex justify-between items-center py-3 text-xs">
                <div>
                  <h4 className="font-display font-medium text-foreground uppercase">{item.productName}</h4>
                  <p className="text-muted-foreground/60 text-[10px] uppercase font-semibold">SKU: {item.productSku} (x{item.quantity})</p>
                </div>
                <div className="font-mono text-foreground font-semibold">
                  {formatPrice(Number(item.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="pt-6 text-xs space-y-2.5">
          <div className="flex justify-between text-muted-foreground font-light">
            <span>Subtotal</span>
            <span className="font-mono">{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground font-light">
            <span>Shipping</span>
            <span className="font-mono">{Number(order.shippingCost) === 0 ? "FREE" : formatPrice(Number(order.shippingCost))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground font-light">
            <span>Tax</span>
            <span className="font-mono">{formatPrice(Number(order.taxCost))}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-3 border-t border-border/20 text-foreground">
            <span>Grand Total Paid</span>
            <span className="font-mono text-accent text-base">{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button asChild variant="outline" className="w-full sm:w-auto uppercase tracking-widest text-[10px] h-12 px-8">
          <Link href="/"><Home className="h-4 w-4 mr-2" /> Go to Home</Link>
        </Button>
        <Button asChild variant="gold" className="w-full sm:w-auto uppercase tracking-widest text-xs h-12 px-8 font-bold">
          <Link href="/shop">Continue Shopping <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>
    </Container>
  );
}
