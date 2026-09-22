"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, ShieldCheck, HeartHandshake, Eye } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { motion } from "framer-motion";

const COLLECTIONS = [
  {
    title: "Timepieces",
    description: "Chronographs built with precision engineering",
    imageUrl: "/images/collections/timepieces-collection.jpg",
    href: "/shop?category=timepieces",
  },
  {
    title: "Leather Goods",
    description: "Full-grain calfskin bags and classic wallets",
    imageUrl: "/images/collections/leather-goods-collection.jpg",
    href: "/shop?category=leather",
  },
  {
    title: "Eyewear",
    description: "Handcrafted sunglasses with polarized lenses",
    imageUrl: "/images/collections/eyewear-collection.jpg",
    href: "/shop?category=eyewear",
  },
];

const FEATURES = [
  {
    icon: Compass,
    title: "Atelier Craftsmanship",
    description: "Each accessory is individually finished by expert artisans in our studios.",
  },
  {
    icon: ShieldCheck,
    title: "Exceptional Materials",
    description: "Only premium full-grain Italian leathers and high-grade alloys are selected.",
  },
  {
    icon: HeartHandshake,
    title: "Lifetime Assurance",
    description: "We are committed to quality, backing our craft with a complete warranty.",
  },
  {
    icon: Eye,
    title: "Timeless Design",
    description: "Classic silhouettes reimagined with a modern, minimal aesthetic.",
  },
];

export default function HomePage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative flex h-[85vh] w-full items-center justify-center overflow-hidden bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000"
            alt="Luxury fashion accessories background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
              },
            },
          }}
          className="relative z-10 max-w-3xl space-y-6 px-4 text-center text-white"
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
            }}
            className="block animate-pulse text-xs font-semibold uppercase tracking-[0.3em] text-accent"
          >
            Introducing The Atelier Series
          </motion.span>
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
            }}
            className="font-display text-2xl font-light uppercase leading-tight tracking-wide sm:text-4xl md:text-6xl"
          >
            CRAFTED FOR THE <br />
            <span className="font-semibold text-accent">DISCERNING INDIVIDUAL</span>
          </motion.h1>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
            }}
            className="mx-auto max-w-xl text-sm font-light leading-relaxed text-neutral-300 md:text-base"
          >
            Elevating everyday rituals. Discover our curated collection of premium leather goods,
            precision watches, and luxury optical frames.
          </motion.p>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
            }}
            className="mx-auto flex w-full max-w-[280px] flex-col justify-center gap-4 pt-4 sm:max-w-none sm:flex-row"
          >
            <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
              <Link href="/shop">Shop Collection</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-white bg-transparent text-white hover:bg-white hover:text-black sm:w-auto"
            >
              <Link href="#">Our Story</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Collections Section */}
      <section className="bg-background py-24">
        <Container className="space-y-16">
          <div className="mx-auto max-w-xl space-y-4 text-center">
            <h2 className="text-3xl font-light uppercase tracking-widest text-foreground">
              CURATED COLLECTIONS
            </h2>
            <div className="mx-auto h-[1px] w-20 bg-accent" />
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              Explore meticulously categorized accessories tailored for high-end styling and
              everyday functional luxury.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {COLLECTIONS.map((col, idx) => (
              <Link
                key={idx}
                href={col.href}
                className="hover-lift group relative h-[450px] overflow-hidden border border-border/40"
              >
                <Image
                  src={col.imageUrl}
                  alt={col.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full space-y-2 p-8 text-white">
                  <h3 className="font-display text-xl font-medium uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <p className="text-xs font-light text-neutral-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {col.description}
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-accent transition-colors group-hover:text-white">
                    Explore{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Philosophy Split Section */}
      <section className="border-b border-t border-border/40 bg-secondary/25 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-[400px] min-h-[450px] lg:h-auto">
            <Image
              src="https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=1200"
              alt="Artisan stitching leather"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center space-y-8 px-6 py-16 sm:p-16 lg:p-24">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Our Philosophy
            </span>
            <h2 className="font-display text-3xl font-light uppercase leading-tight tracking-wider text-foreground sm:text-4xl">
              Built on Legacy, <br />
              <span className="font-semibold">Sustainably Sourced</span>
            </h2>
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              We believe a product should last a lifetime. That&apos;s why we source our leathers
              only from certified gold-rated Italian tanneries, and build our movements in
              partnership with generational watchmakers. We combine historical techniques with
              state-of-the-art structural materials.
            </p>
            <div className="flex">
              <Button
                asChild
                variant="outline"
                className="border-primary px-4 text-[10px] text-primary hover:bg-primary hover:text-primary-foreground sm:px-6 sm:text-sm"
              >
                <Link href="#">View Craftsmanship Journal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-background py-24">
        <Container className="space-y-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="space-y-4 rounded-sm border border-border/30 p-6 transition-colors hover:border-accent/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    {feat.title}
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Newsletter Signup Section */}
      <section className="relative overflow-hidden border-t border-border bg-card py-24 text-center text-foreground">
        <Container className="relative z-10 max-w-2xl space-y-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            STAY IN TOUCH
          </span>
          <h2 className="font-display text-3xl font-light uppercase tracking-widest text-foreground">
            JOIN THE ATELIER CIRCLE
          </h2>
          <p className="mx-auto max-w-md text-sm font-light leading-relaxed text-muted-foreground">
            Subscribe to receive private previews of upcoming seasonal collections, artisan stories,
            and members-only invitations.
          </p>
          <div className="pt-4">
            <NewsletterForm />
          </div>
        </Container>
      </section>
    </PageWrapper>
  );
}
