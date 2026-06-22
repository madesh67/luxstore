"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound } from "lucide-react";
import { useResetPassword } from "@/hooks/use-auth";
import { resetPasswordSchema, ResetPasswordInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  
  const resetPasswordMutation = useResetPassword(token);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: Omit<ResetPasswordInput, "token">) => {
    setErrorMsg(null);
    if (!token) {
      setErrorMsg("A valid security token is missing from the link URL");
      return;
    }
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (err) => {
        setErrorMsg(err.message);
      },
    });
  };

  if (!token) {
    return (
      <div className="w-full text-center space-y-4 p-8 border border-destructive/20 bg-destructive/5 rounded-sm">
        <h1 className="text-xl font-semibold text-destructive">Invalid Reset Link</h1>
        <p className="text-xs text-muted-foreground font-light leading-relaxed">
          The link you followed does not contain a secure token. Please request a new password reset.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/forgot-password">Request Reset Link</Link>
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full text-center space-y-6 p-8 border border-accent/20 bg-accent/5 rounded-sm animate-fade-in">
        <div className="flex justify-center">
          <KeyRound className="h-16 w-16 text-accent animate-pulse" />
        </div>
        <h1 className="text-2xl font-display font-light uppercase tracking-widest text-foreground">
          Password Updated
        </h1>
        <p className="text-sm text-muted-foreground font-light leading-relaxed">
          Your account password has been successfully updated. You can now sign in using your new credentials.
        </p>
        <Button asChild variant="default" className="w-full h-12 uppercase text-xs tracking-widest">
          <Link href="/auth/login">Continue to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 p-8 border border-border bg-card shadow-sm rounded-sm">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-light uppercase tracking-widest text-foreground font-display">
          New Password
        </h1>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">
          Set a secure new password for your account
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 border border-destructive/20 bg-destructive/5 text-destructive text-xs font-medium rounded-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            disabled={resetPasswordMutation.isPending}
            className="h-12"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-[10px] text-destructive font-medium leading-tight">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            disabled={resetPasswordMutation.isPending}
            className="h-12"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="gold"
          className="w-full h-12 uppercase tracking-widest text-xs"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "UPDATE PASSWORD"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
            <ResetPasswordForm />
          </React.Suspense>
        </div>
      </Container>
    </PageWrapper>
  );
}
