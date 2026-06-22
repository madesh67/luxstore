import { Container } from "@/components/shared/container";

export default function Loading() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-t-2 border-accent border-r-2 border-r-transparent animate-spin" />
        <span className="absolute font-display text-[9px] uppercase tracking-widest text-muted-foreground animate-pulse">
          LUX
        </span>
      </div>
      <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground font-light">
        Loading Atelier...
      </p>
    </Container>
  );
}
