"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRegister } from "@/hooks/use-auth";
import { registerSchema, RegisterInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";

export default function RegisterPage() {
  const registerMutation = useRegister();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    setErrorMsg(null);
    registerMutation.mutate(data, {
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
              <CheckCircle2 className="h-16 w-16 text-accent animate-bounce" />
            </div>
            <h1 className="text-2xl font-display font-light uppercase tracking-widest text-foreground">
              Account Created
            </h1>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              We have dispatched a verification email to your address. Please click the link inside the email to activate your account.
            </p>
            <Button asChild variant="default" className="w-full h-12 uppercase text-xs tracking-widest">
              <Link href="/auth/login">Continue to Sign In</Link>
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
              Create Account
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">
              Register at the LuxStore atelier
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 border border-destructive/20 bg-destructive/5 text-destructive text-xs font-medium rounded-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  disabled={registerMutation.isPending}
                  className="uppercase tracking-widest text-xs h-12"
                  placeholder="JOHN"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-[10px] text-destructive font-medium">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  disabled={registerMutation.isPending}
                  className="uppercase tracking-widest text-xs h-12"
                  placeholder="DOE"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-[10px] text-destructive font-medium">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                disabled={registerMutation.isPending}
                className="uppercase tracking-widest text-xs h-12"
                placeholder="JOHN.DOE@DOMAIN.COM"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                disabled={registerMutation.isPending}
                className="h-12"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-[10px] text-destructive font-medium leading-tight">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                disabled={registerMutation.isPending}
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
              className="w-full h-12 uppercase tracking-widest text-xs pt-1"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "REGISTER"
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground font-light">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-accent hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
