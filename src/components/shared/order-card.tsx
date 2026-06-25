"use client";

import Link from "next/link";
import { ChevronRight, Calendar, CreditCard, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { OrderType } from "@/hooks/use-orders";

interface OrderCardProps {
  order: OrderType;
}

const statusColors: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50",
  PAID: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50",
  PROCESSING: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/50",
  PACKED: "text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-200/50",
  SHIPPED: "text-sky-600 bg-sky-50 dark:bg-sky-950/20 border-sky-200/50",
  DELIVERED: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200/50",
  CANCELLED: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200/50",
  REFUNDED: "text-neutral-600 bg-neutral-50 dark:bg-neutral-950/20 border-neutral-200/50",
  RETURN_REQUESTED: "text-pink-600 bg-pink-50 dark:bg-pink-950/20 border-pink-200/50",
  RETURNED: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200/50",
};

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="border border-border bg-card rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 bg-muted/50">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light">Order Number</p>
          <p className="text-sm font-semibold tracking-wider text-foreground">{order.orderNumber}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-light text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            {formatDate(order.createdAt)}
          </div>
          <div className="flex items-center gap-2 text-xs font-light text-muted-foreground">
            <Package className="h-3.5 w-3.5 text-accent" />
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <CreditCard className="h-3.5 w-3.5 text-accent" />
            ₹{Number(order.total).toLocaleString("en-IN")}
          </div>
        </div>

        <div>
          <span className={`inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-1 uppercase rounded-sm border ${statusColors[order.status] || "text-neutral-600 bg-neutral-50"}`}>
            {order.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Preview of item names */}
        <div className="flex-1 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light">Curation details</p>
          <p className="text-sm font-light line-clamp-1 text-foreground">
            {order.items.map((item) => `${item.productName} (x${item.quantity})`).join(", ")}
          </p>
        </div>

        <div>
          <Link
            href={`/account/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest"
          >
            Manage Order <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
