"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type NewsletterValues = z.infer<typeof newsletterSchema>;

export function NewsletterForm() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (_data: NewsletterValues) => {
    setStatus("loading");
    // Simulate API registration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setStatus("success");
    reset();
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-accent/20 bg-accent/5 max-w-md mx-auto text-center rounded-sm animate-fade-in">
        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center mb-4">
          <Check className="h-5 w-5 text-accent-foreground" />
        </div>
        <h4 className="text-sm font-semibold uppercase tracking-wider mb-2">Welcome to the Club</h4>
        <p className="text-xs text-muted-foreground font-light">
          You are now subscribed to the LuxStore newsletter. Early access notifications will be sent to your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="ENTER YOUR EMAIL"
            aria-label="Email address"
            className="border-border/60 uppercase tracking-widest text-xs h-12 bg-background/50 placeholder:text-muted-foreground/60"
            disabled={status === "loading"}
            {...register("email")}
          />
        </div>
        <Button
          type="submit"
          variant="gold"
          className="h-12 px-8 uppercase text-xs tracking-widest"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "SUBSCRIBE"
          )}
        </Button>
      </div>
      {errors.email && (
        <p className="text-xs text-destructive text-left font-medium">{errors.email.message}</p>
      )}
    </form>
  );
}
