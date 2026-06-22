import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AppProvider } from "@/providers/app-provider";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { CartDrawer } from "@/components/shared/cart-drawer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "LuxStore | Premium Accessories",
    template: "%s | LuxStore",
  },
  description: "Premium accessories crafted with timeless elegance and modern luxury.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "LuxStore",
    description: "Premium accessories crafted with timeless elegance and modern luxury.",
    type: "website",
    siteName: "LuxStore",
  },
  twitter: {
    card: "summary_large_image",
    title: "LuxStore",
    description: "Premium accessories crafted with timeless elegance and modern luxury.",
  },
};

import { OrganizationJsonLd } from "@/components/shared/json-ld";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col justify-between">
        <AppProvider>
          <OrganizationJsonLd />
          <Header />
          <CartDrawer />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
