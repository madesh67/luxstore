"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLogin } from "@/hooks/use-auth";
import { loginSchema, LoginInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    setErrorMsg(null);
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.push("/account");
        router.refresh();
      },
      onError: (err) => {
        setErrorMsg(err.message);
      },
    });
  };

  return (
    <PageWrapper>
      <Container className="flex min-h-[75vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 p-8 border border-border bg-card shadow-sm rounded-sm">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-light uppercase tracking-widest text-foreground font-display">
              Sign In
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">
              Access your personalized LuxStore profile
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
                disabled={loginMutation.isPending}
                className="uppercase tracking-widest text-xs h-12"
                placeholder="YOUR.EMAIL@DOMAIN.COM"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[10px] uppercase tracking-wider font-semibold text-accent hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                disabled={loginMutation.isPending}
                className="h-12"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full h-12 uppercase tracking-widest text-xs"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "SIGN IN"
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground font-light">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-semibold text-accent hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
