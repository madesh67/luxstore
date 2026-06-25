"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/hooks/use-auth";
import { useOrderDetails, OrderItemType } from "@/hooks/use-orders";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { TrackingCard } from "@/components/shared/tracking-card";
import { ReturnRequestForm } from "@/components/shared/return-request-form";
import { InvoiceDownloadButton } from "@/components/shared/invoice-download-button";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, User, Mail, CreditCard, Receipt } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: user, isLoading: userLoading } = useUser();

  const orderId = params.orderId as string;

  const {
    data: orderData,
    isLoading: orderLoading,
    isError,
  } = useOrderDetails(orderId);

  // Redirect to login if user is guest/logged out
  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  if (userLoading || orderLoading) {
    return (
      <Container className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </Container>
    );
  }

  if (!user) return null;

  const order = orderData?.order;

  if (isError || !order) {
    return (
      <PageWrapper>
        <Container className="py-12 text-center space-y-4 max-w-lg">
          <div className="border border-destructive/20 bg-destructive/5 text-destructive rounded-sm p-6 text-xs">
            Failed to retrieve order details or order is unauthorized.
          </div>
          <Button asChild variant="outline" className="uppercase tracking-widest text-[10px] font-bold">
            <Link href="/account/orders">Back to Orders</Link>
          </Button>
        </Container>
      </PageWrapper>
    );
  }

  // Parse shipping snapshot
  const address = (typeof order.shippingAddressSnapshot === "string"
    ? JSON.parse(order.shippingAddressSnapshot)
    : order.shippingAddressSnapshot) || {};

  // Check if return eligible
  const isReturnEligible =
    order.status === "DELIVERED" &&
    new Date().getTime() - new Date(order.updatedAt).getTime() < 30 * 24 * 60 * 60 * 1000;

  return (
    <PageWrapper>
      <Container className="py-12 space-y-8 max-w-5xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> All Orders
          </Link>

          <InvoiceDownloadButton orderId={order.id} />
        </div>

        {/* Order Header Grid */}
        <div className="border border-border bg-card rounded-sm p-6 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light">Order Number</span>
            <h1 className="text-lg font-bold tracking-wider text-foreground">{order.orderNumber}</h1>
            <p className="text-[11px] font-light text-muted-foreground flex items-center gap-1.5 pt-1">
              <Calendar className="h-3.5 w-3.5 text-accent" /> Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light block">Order Status</span>
              <span className="inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-1 uppercase rounded-sm border bg-muted text-muted-foreground border-border">
                {order.status.replace("_", " ")}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light block">Grand Total</span>
              <span className="text-base font-semibold text-foreground">₹{Number(order.total).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Items column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Curated items table */}
            <div className="border border-border bg-card rounded-sm p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-accent font-semibold border-b border-border/40 pb-3 flex items-center gap-1.5">
                <Receipt className="h-4 w-4" /> Curated Crate Breakdown
              </h2>

              <div className="divide-y divide-border/40">
                {order.items.map((item: OrderItemType) => (
                  <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 bg-muted border border-border/40 rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center text-muted-foreground">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <Receipt className="h-6 w-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground uppercase truncate">{item.productName}</h4>
                      <p className="text-[10px] text-muted-foreground font-light mt-0.5">SKU: {item.productSku}</p>
                      <p className="text-[11px] font-light text-muted-foreground mt-1">₹{Number(item.price).toLocaleString("en-IN")} &times; {item.quantity}</p>
                    </div>

                    <div className="text-right flex flex-col justify-between">
                      <span className="text-xs font-semibold text-foreground font-mono">
                        ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking System Card */}
            <TrackingCard shipment={order.shipment} />
          </div>

          {/* Sidebar (Timeline, Shipping snapshot, Return Form) */}
          <div className="space-y-6">
            {/* Order Timeline */}
            <div className="border border-border bg-card rounded-sm p-6 space-y-6">
              <h2 className="text-xs uppercase tracking-widest text-foreground font-semibold border-b border-border/40 pb-3">
                Activity Timeline
              </h2>
              <OrderTimeline timeline={order.timeline} />
            </div>

            {/* Address & Payment Summary details */}
            <div className="border border-border bg-card rounded-sm p-6 space-y-6 text-xs font-light text-muted-foreground">
              <h2 className="text-xs uppercase tracking-widest text-foreground font-semibold text-accent border-b border-border/40 pb-3">
                Billing & Delivery
              </h2>

              <div className="space-y-1 text-foreground leading-relaxed">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">Shipping Destination</span>
                <p className="font-semibold">{address.fullName || "Guest Account"}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country || "India"}</p>
                <p className="flex items-center gap-1.5 mt-2 text-[10px] font-light text-muted-foreground">
                  <User className="h-3 w-3" /> Phone: {address.phoneNumber}
                </p>
                <p className="flex items-center gap-1.5 text-[10px] font-light text-muted-foreground">
                  <Mail className="h-3 w-3" /> Email: {order.email}
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">Billing Summary</span>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-foreground">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost:</span>
                  <span className="font-mono text-foreground">₹{Number(order.shippingCost).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Cost (GST):</span>
                  <span className="font-mono text-foreground">₹{Number(order.taxCost).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-dashed border-border/60 text-foreground font-semibold">
                  <span>Grand Total:</span>
                  <span className="font-mono text-accent">₹{Number(order.total).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">Payment Method</span>
                <p className="flex items-center gap-1.5 text-foreground">
                  <CreditCard className="h-3.5 w-3.5 text-accent" /> Card Payment via Stripe
                </p>
                <p className="text-[9px] text-muted-foreground font-mono mt-1 truncate">ID: {order.paymentIntentId || "N/A"}</p>
              </div>
            </div>

            {/* Return Request Action Panel */}
            <ReturnRequestForm
              orderId={order.id}
              orderNumber={order.orderNumber}
              returnRequest={order.returnRequest}
              isReturnEligible={isReturnEligible}
            />
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
