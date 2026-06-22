import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-display font-light text-accent/30 tracking-widest mb-2">
        404
      </h1>
      <h2 className="text-2xl tracking-widest uppercase mb-4 text-foreground">
        Page Not Found
      </h2>
      <p className="text-sm text-muted-foreground max-w-md font-light leading-relaxed mb-8">
        The page you are looking for does not exist or has been moved. Explore our latest arrivals or return to the main hall.
      </p>
      <Button asChild variant="default" size="lg">
        <Link href="/">
          Return Home
        </Link>
      </Button>
    </Container>
  );
}
