"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { Container } from "../shared/container";
import { ThemeToggle } from "../shared/theme-toggle";
import { Button } from "../ui/button";
import { useUser } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { NotificationCenter } from "../shared/notification-center";

const NAV_ITEMS = [
  { label: "New Arrivals", href: "/shop" },
  { label: "Timepieces", href: "/shop?category=timepieces" },
  { label: "Leather", href: "/shop?category=leather-bags" },
  { label: "Eyewear", href: "/shop?category=eyewear" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const { data: user } = useUser();
  const { data: cartData } = useCart();
  const { data: wishlistData } = useWishlist();

  const [guestWishlistCount, setGuestWishlistCount] = React.useState(0);

  // Sync guest wishlist length from localStorage
  React.useEffect(() => {
    const syncGuestWishlist = () => {
      if (!user) {
        const stored = localStorage.getItem("luxstore_guest_wishlist");
        if (stored) {
          try {
            setGuestWishlistCount(JSON.parse(stored).length);
          } catch {
            setGuestWishlistCount(0);
          }
        } else {
          setGuestWishlistCount(0);
        }
      }
    };

    syncGuestWishlist();
    window.addEventListener("wishlist-update", syncGuestWishlist);
    return () => {
      window.removeEventListener("wishlist-update", syncGuestWishlist);
    };
  }, [user]);

  const wishlistCount = user ? wishlistData?.wishlist.items.length || 0 : guestWishlistCount;
  const cartCount = cartData?.cart.totalQuantity || 0;
  const accountHref = user ? "/account" : "/auth/login";

  // Close mobile menu on resize if screen grows larger than mobile breakpoint
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOpenCart = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-cart-drawer"));
  };

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/superadmin")) {
    return null;
  }

  return (

    <header className="w-full sticky top-0 z-40">
      {/* Top Banner */}
      <div className="w-full bg-[#a88a44] py-2 text-center text-[10px] sm:text-xs tracking-widest text-white uppercase font-bold px-4">
        LuxStore Preview: Orders are currently not being processed.
      </div>

      {/* Main Header navigation */}
      <div className="glass-header w-full border-b border-border/40 bg-background/95">
        <Container className="flex h-16 items-center justify-between">
          {/* Mobile Menu Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className="font-display text-lg sm:text-2xl font-semibold tracking-wider text-foreground">
              LUX<span className="text-accent">STORE</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs font-semibold tracking-widest text-foreground/80 hover:text-foreground uppercase transition-colors py-2 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </Link>
            ))}
          </nav>

          {/* Action Utilities (Search, Account, Wishlist, Cart) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex text-foreground/80 hover:text-foreground">
              <Link href="/shop" aria-label="Search">
                <Search className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </Button>
            
            <Button asChild variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
              <Link href={accountHref} aria-label="Account">
                <User className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </Button>

            <NotificationCenter />

            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex text-foreground/80 hover:text-foreground relative">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-[1.2rem] w-[1.2rem]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenCart}
              className="text-foreground/80 hover:text-foreground relative"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-[1.2rem] w-[1.2rem]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Button>

            <div className="hidden sm:block pl-1 border-l border-border/60">
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[104px] bottom-0 z-40 bg-background/98 animate-fade-in flex flex-col px-6 py-8 border-t border-border/50">
          <nav className="flex flex-col space-y-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium tracking-widest text-foreground hover:text-accent uppercase transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-border/60 pt-6 flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full flex items-center justify-center gap-2">
              <Link href={accountHref} onClick={() => setMobileMenuOpen(false)}>
                <User className="h-4 w-4" /> Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full flex items-center justify-center gap-2">
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="h-4 w-4" /> Wishlist ({wishlistCount})
              </Link>
            </Button>
            <div className="flex justify-between items-center border-t border-border/60 pt-4 mt-2">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
