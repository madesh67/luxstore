"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "../shared/container";

const FOOTER_LINKS = [
  {
    title: "Shop",
    items: [
      { label: "Timepieces", href: "#" },
      { label: "Leather Bags", href: "#" },
      { label: "Wallets & Folios", href: "#" },
      { label: "Eyewear", href: "#" },
      { label: "Gift Sets", href: "#" },
    ],
  },
  {
    title: "Our Story",
    items: [
      { label: "The Atelier", href: "#" },
      { label: "Craftsmanship", href: "#" },
      { label: "Sustainability", href: "#" },
      { label: "The Journal", href: "#" },
    ],
  },
  {
    title: "Customer Care",
    items: [
      { label: "Client Services", href: "#" },
      { label: "Shipping & Returns", href: "#" },
      { label: "Product Care", href: "#" },
      { label: "Gift Cards", href: "#" },
      { label: "FAQs", href: "#" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/superadmin")) {
    return null;
  }

  return (
    <footer className="w-full bg-[#171513] text-[#e8e6e3] border-t border-border/10">
      <Container className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand details */}
        <div className="lg:col-span-2 space-y-6">
          <Link href="/">
            <span className="font-display text-2xl font-bold tracking-widest text-[#e8e6e3]">
              LUX<span className="text-accent">STORE</span>
            </span>
          </Link>
          <p className="text-sm text-[#a8a6a3] max-w-sm font-light leading-relaxed">
            Crafting premium, timeless accessories designed to elevate the modern lifestyle. Built on a foundation of exceptional craftsmanship, ethical sourcing, and clean design aesthetics.
          </p>
          <div className="flex space-x-4">
            {/* Socials placeholder */}
            <span className="text-xs tracking-widest font-semibold uppercase text-accent">Follow Us</span>
            <span className="text-xs text-[#a8a6a3] hover:text-[#e8e6e3] cursor-pointer">Instagram</span>
            <span className="text-xs text-[#a8a6a3] hover:text-[#e8e6e3] cursor-pointer">Pinterest</span>
            <span className="text-xs text-[#a8a6a3] hover:text-[#e8e6e3] cursor-pointer">LinkedIn</span>
          </div>
        </div>

        {/* Link Columns */}
        {FOOTER_LINKS.map((group) => (
          <div key={group.title} className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-accent">{group.title}</h4>
            <ul className="space-y-2.5">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs text-[#a8a6a3] hover:text-[#e8e6e3] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      {/* Bottom Bar */}
      <div className="w-full border-t border-[#2d2a27]/40 bg-[#12100f] py-8 text-center text-xs text-[#7d7a77]">
        <Container className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} LuxStore. All rights reserved. Created as an architectural template.
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:underline">Terms of Service</Link>
            <Link href="#" className="hover:underline">Sitemap</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
