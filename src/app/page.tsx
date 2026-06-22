import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, ShieldCheck, HeartHandshake, Eye } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/shared/newsletter-form";

const COLLECTIONS = [
  {
    title: "Timepieces",
    description: "Chronographs built with precision engineering",
    imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800",
    href: "/shop?category=timepieces",
  },
  {
    title: "Leather Goods",
    description: "Full-grain calfskin bags and classic wallets",
    imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800",
    href: "/shop?category=leather",
  },
  {
    title: "Eyewear",
    description: "Handcrafted sunglasses with polarized lenses",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800",
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
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden bg-black">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000"
          alt="Luxury fashion accessories background"
          fill
          priority
          className="object-cover object-center opacity-65 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />

        <div className="relative z-10 text-center text-white px-4 max-w-3xl space-y-6">
          <span className="text-xs tracking-[0.3em] font-semibold uppercase text-accent animate-pulse">
            Introducing The Atelier Series
          </span>
          <h1 className="text-4xl md:text-6xl font-light tracking-wide uppercase leading-tight font-display">
            CRAFTED FOR THE <br />
            <span className="font-semibold text-accent">DISCERNING INDIVIDUAL</span>
          </h1>
          <p className="text-sm md:text-base font-light text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Elevating everyday rituals. Discover our curated collection of premium leather goods, precision watches, and luxury optical frames.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Button asChild variant="gold" size="lg">
              <Link href="/shop">
                Shop Collection
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
              <Link href="#">
                Our Story
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Collections Section */}
      <section className="py-24 bg-background">
        <Container className="space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl font-light uppercase tracking-widest text-foreground">
              CURATED COLLECTIONS
            </h2>
            <div className="h-[1px] w-20 bg-accent mx-auto" />
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Explore meticulously categorized accessories tailored for high-end styling and everyday functional luxury.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COLLECTIONS.map((col, idx) => (
              <Link
                key={idx}
                href={col.href}
                className="group relative h-[450px] overflow-hidden hover-lift border border-border/40"
              >
                <Image
                  src={col.imageUrl}
                  alt={col.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8 text-white space-y-2">
                  <h3 className="text-xl uppercase tracking-wider font-display font-medium">
                    {col.title}
                  </h3>
                  <p className="text-xs text-neutral-300 font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {col.description}
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-xs font-semibold tracking-widest uppercase text-accent group-hover:text-white transition-colors">
                    Explore <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Philosophy Split Section */}
      <section className="bg-secondary/25 py-0 border-t border-b border-border/40">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-[400px] lg:h-auto min-h-[450px]">
            <Image
              src="https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=1200"
              alt="Artisan stitching leather"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-16 sm:p-16 lg:p-24 space-y-8">
            <span className="text-xs tracking-[0.2em] font-semibold uppercase text-accent">
              Our Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-wider text-foreground leading-tight font-display">
              Built on Legacy, <br />
              <span className="font-semibold">Sustainably Sourced</span>
            </h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              We believe a product should last a lifetime. That&apos;s why we source our leathers only from certified gold-rated Italian tanneries, and build our movements in partnership with generational watchmakers. We combine historical techniques with state-of-the-art structural materials.
            </p>
            <div className="flex">
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                <Link href="#">
                  View Craftsmanship Journal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-background">
        <Container className="space-y-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="space-y-4 p-6 border border-border/30 rounded-sm hover:border-accent/40 transition-colors">
                  <div className="h-10 w-10 bg-secondary/50 rounded-full flex items-center justify-center text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs tracking-widest font-semibold uppercase text-foreground">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Newsletter Signup Section */}
      <section className="py-24 bg-[#171513] text-[#e8e6e3] text-center relative overflow-hidden border-t border-border/10">
        <Container className="relative z-10 max-w-2xl space-y-6">
          <span className="text-xs tracking-[0.2em] font-semibold uppercase text-accent">
            STAY IN TOUCH
          </span>
          <h2 className="text-3xl font-light uppercase tracking-widest text-[#e8e6e3] font-display">
            JOIN THE ATELIER CIRCLE
          </h2>
          <p className="text-sm text-[#a8a6a3] font-light max-w-md mx-auto leading-relaxed">
            Subscribe to receive private previews of upcoming seasonal collections, artisan stories, and members-only invitations.
          </p>
          <div className="pt-4">
            <NewsletterForm />
          </div>
        </Container>
      </section>
    </PageWrapper>
  );
}
