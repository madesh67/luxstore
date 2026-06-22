"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-auth";
import { useOrders, OrderType } from "@/hooks/use-orders";
import { OrderCard } from "@/components/shared/order-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Loader2, Search, ArrowLeft, RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURN_REQUESTED", label: "Return Requested" },
  { value: "RETURNED", label: "Returned" },
];

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Date: Newest First" },
  { value: "createdAt-asc", label: "Date: Oldest First" },
  { value: "total-desc", label: "Total: High to Low" },
  { value: "total-asc", label: "Total: Low to High" },
];

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("createdAt-desc");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [sortBy, sortOrder] = sort.split("-") as [string, "asc" | "desc"];

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError,
    refetch,
  } = useOrders({
    page,
    limit: 5,
    search: searchQuery || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  });

  // Redirect to login if user is guest/logged out
  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search);
  };

  const handleReset = () => {
    setSearch("");
    setSearchQuery("");
    setStatus("");
    setSort("createdAt-desc");
    setPage(1);
  };

  if (userLoading) {
    return (
      <Container className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </Container>
    );
  }

  if (!user) return null;

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.totalPages || 1;

  return (
    <PageWrapper>
      <Container className="py-12 space-y-8 max-w-5xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Dashboard
          </Link>

          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-display font-semibold uppercase tracking-wider text-foreground">
            Order History
          </h1>
          <p className="text-xs text-muted-foreground font-light mt-1">
            Browse, manage, and track all your curated luxury orders.
          </p>
        </div>

        {/* Search, Filter, Sort Controls */}
        <div className="border border-border bg-card rounded-sm p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search orders by number or item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-xs uppercase tracking-wider"
              />
            </div>
            <Button type="submit" variant="gold" className="h-11 px-6 uppercase tracking-widest text-xs font-semibold">
              SEARCH
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 border-t border-border/40">
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Filter Status</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1);
                    setStatus(e.target.value);
                  }}
                  className="h-10 px-3 border border-input bg-background rounded-sm text-xs focus:ring-1 focus:ring-accent focus:border-accent outline-none w-full sm:w-48 appearance-none cursor-pointer"
                >
                  {STATUS_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Sort Order</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value);
                  }}
                  className="h-10 px-3 border border-input bg-background rounded-sm text-xs focus:ring-1 focus:ring-accent focus:border-accent outline-none w-full sm:w-48 appearance-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground h-10 w-full sm:w-auto"
              >
                Clear all filters
              </Button>
            </div>
          </div>
        </div>

        {/* Orders Listing */}
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
              <p className="text-xs font-light text-muted-foreground mt-4">Retrieving your order archives...</p>
            </div>
          ) : isError ? (
            <div className="py-12 border border-destructive/20 bg-destructive/5 text-destructive rounded-sm p-6 text-center text-xs">
              Failed to retrieve orders list. Please refresh the page.
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-border/80 rounded-sm p-12 text-center bg-card flex flex-col items-center gap-4">
              <div className="h-12 w-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">No orders matching criteria</h3>
                <p className="text-xs font-light text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We couldn&apos;t find any records. Check your search query, or start shopping our new collections.
                </p>
              </div>
              <Button asChild variant="gold" size="sm" className="uppercase tracking-widest text-[10px] font-semibold mt-2">
                <Link href="/shop">SHOP NEW ARRIVALS</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {orders.map((order: OrderType) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="uppercase tracking-widest text-[9px] font-bold"
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-light text-muted-foreground uppercase tracking-widest">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="uppercase tracking-widest text-[9px] font-bold"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </PageWrapper>
  );
}
