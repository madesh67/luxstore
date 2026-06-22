import type { Metadata } from "next";
import { WishlistGrid } from "@/components/shared/wishlist-grid";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Container } from "@/components/shared/container";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Saved Masterpieces | LuxStore Wishlist",
  description: "View and edit your personal wishlist collections at LuxStore.",
  openGraph: {
    title: "Saved Masterpieces | LuxStore",
    description: "View and edit your personal wishlist collections at LuxStore.",
    type: "website",
  },
};

export default function WishlistPage() {
  return (
    <PageWrapper>
      <Container className="py-12 space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="border-b border-border/40 pb-6">
          <span className="text-[10px] tracking-[0.3em] font-semibold text-accent uppercase flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-accent fill-accent" /> Saved Items
          </span>
          <h1 className="text-3xl font-display font-light uppercase tracking-wider text-foreground mt-1">
            Your Wishlist
          </h1>
        </div>

        {/* Wishlist Items Grid */}
        <WishlistGrid />
      </Container>
    </PageWrapper>
  );
}
