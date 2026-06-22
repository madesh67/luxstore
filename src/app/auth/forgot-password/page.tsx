"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Inbox } from "lucide-react";
import { useForgotPassword } from "@/hooks/use-auth";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    setErrorMsg(null);
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (err) => {
        setErrorMsg(err.message);
      },
    });
  };

  if (isSuccess) {
    return (
      <PageWrapper>
        <Container className="flex min-h-[75vh] items-center justify-center py-12">
          <div className="w-full max-w-md p-8 border border-accent/20 bg-accent/5 text-center space-y-6 rounded-sm animate-fade-in">
            <div className="flex justify-center">
              <Inbox className="h-16 w-16 text-accent animate-pulse" />
            </div>
            <h1 className="text-2xl font-display font-light uppercase tracking-widest text-foreground">
              Reset Link Sent
            </h1>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              If your email is registered in our system, you will receive a message with a link to reset your password shortly.
            </p>
            <Button asChild variant="outline" className="w-full h-12 uppercase text-xs tracking-widest">
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </div>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container className="flex min-h-[75vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 p-8 border border-border bg-card shadow-sm rounded-sm">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-light uppercase tracking-widest text-foreground font-display">
              Reset Password
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">
              Enter your email to receive a password reset link
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 border border-destructive/20 bg-destructive/5 text-destructive text-xs font-medium rounded-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                disabled={forgotPasswordMutation.isPending}
                className="uppercase tracking-widest text-xs h-12"
                placeholder="YOUR.EMAIL@DOMAIN.COM"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full h-12 uppercase tracking-widest text-xs"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "SEND RESET LINK"
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-accent hover:underline uppercase tracking-wider"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
