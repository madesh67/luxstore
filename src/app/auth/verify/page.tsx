"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("Verifying your email address...");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("A verification token is missing from the link URL");
      return;
    }

    const triggerVerification = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data?.error?.message || "Verification failed");
        }

        setStatus("success");
        setMessage(data?.data?.message || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification request failed");
      }
    };

    triggerVerification();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="w-full text-center space-y-6 p-8 border border-border bg-card rounded-sm">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
        <h1 className="text-xl font-display font-light uppercase tracking-widest text-foreground">
          Confirming Token
        </h1>
        <p className="text-xs text-muted-foreground font-light">{message}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full text-center space-y-6 p-8 border border-accent/20 bg-accent/5 rounded-sm animate-fade-in">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-accent animate-bounce" />
        </div>
        <h1 className="text-2xl font-display font-light uppercase tracking-widest text-foreground">
          Email Verified
        </h1>
        <p className="text-sm text-muted-foreground font-light leading-relaxed">
          {message} Your LuxStore account is now active and ready.
        </p>
        <Button asChild variant="default" className="w-full h-12 uppercase text-xs tracking-widest">
          <Link href="/auth/login">Continue to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full text-center space-y-6 p-8 border border-destructive/20 bg-destructive/5 rounded-sm animate-fade-in">
      <div className="flex justify-center">
        <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
      </div>
      <h1 className="text-2xl font-display font-light uppercase tracking-widest text-destructive">
        Verification Failed
      </h1>
      <p className="text-sm text-muted-foreground font-light leading-relaxed">
        {message}
      </p>
      <Button asChild variant="outline" className="w-full h-12 uppercase text-xs tracking-widest">
        <Link href="/auth/login">Back to Sign In</Link>
      </Button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <PageWrapper>
      <Container className="flex min-h-[75vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <React.Suspense
            fallback={
              <div className="flex justify-center p-8 border border-border rounded-sm">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            }
          >
            <VerifyEmailForm />
          </React.Suspense>
        </div>
      </Container>
    </PageWrapper>
  );
}
