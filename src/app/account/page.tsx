"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogOut, CheckCircle2, User as UserIcon, Lock } from "lucide-react";
import { useUser, useUpdateProfile, useChangePassword, useLogout } from "@/hooks/use-auth";
import { changePasswordSchema, ChangePasswordInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/shared/container";
import { PageWrapper } from "@/components/layouts/page-wrapper";
import { formatDate } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const logoutMutation = useLogout();

  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Profile Form Hook
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue,
    formState: { errors: profileErrors },
  } = useForm<{ firstName: string; lastName: string }>();

  // Password Form Hook
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Pre-populate fields once user details load
  React.useEffect(() => {
    if (user) {
      setValue("firstName", user.firstName || "");
      setValue("lastName", user.lastName || "");
    }
  }, [user, setValue]);

  // Route back if user is guest (unauthenticated)
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  const onUpdateProfile = (data: { firstName: string; lastName: string }) => {
    setProfileSuccess(null);
    setProfileError(null);
    updateProfileMutation.mutate(data, {
      onSuccess: (res) => {
        setProfileSuccess(res.message);
      },
      onError: (err) => {
        setProfileError(err.message);
      },
    });
  };

  const onChangePassword = (data: ChangePasswordInput) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    changePasswordMutation.mutate(data, {
      onSuccess: (res) => {
        setPasswordSuccess(res.message);
        resetPasswordForm();
      },
      onError: (err) => {
        setPasswordError(err.message);
      },
    });
  };

  const onLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/auth/login");
        router.refresh();
      },
    });
  };

  if (isLoading) {
    return (
      <Container className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </Container>
    );
  }

  if (isError || !user) {
    return null;
  }

  return (
    <PageWrapper>
      <Container className="py-12 space-y-10 max-w-5xl">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 border border-border bg-card rounded-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-secondary/80 rounded-full flex items-center justify-center text-accent">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold uppercase tracking-wider text-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-xs text-muted-foreground font-light">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.isEmailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 uppercase rounded-sm border border-green-200/50">
                <CheckCircle2 className="h-3 w-3" /> Verified Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 uppercase rounded-sm border border-amber-200/50">
                Email Unverified
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-semibold"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Action Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Details Form */}
          <div className="p-8 border border-border bg-card rounded-sm space-y-6">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-accent border-b border-border pb-3">
              Profile Details
            </h2>

            {profileSuccess && (
              <div className="p-3 border border-green-200/50 bg-green-500/5 text-green-600 text-xs font-medium rounded-sm">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 border border-destructive/20 bg-destructive/5 text-destructive text-xs font-medium rounded-sm">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  disabled={updateProfileMutation.isPending}
                  className="uppercase tracking-widest text-xs h-12"
                  {...registerProfile("firstName", { required: "First name is required" })}
                />
                {profileErrors.firstName && (
                  <p className="text-xs text-destructive font-medium">{profileErrors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  disabled={updateProfileMutation.isPending}
                  className="uppercase tracking-widest text-xs h-12"
                  {...registerProfile("lastName", { required: "Last name is required" })}
                />
                {profileErrors.lastName && (
                  <p className="text-xs text-destructive font-medium">{profileErrors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Registered Email</Label>
                <Input
                  disabled
                  value={user.email}
                  className="uppercase tracking-widest text-xs h-12 bg-neutral-100 dark:bg-neutral-900 border-dashed text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground font-light leading-relaxed">
                  Email addresses are permanent unique identifiers and cannot be altered.
                </p>
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full h-12 uppercase tracking-widest text-xs"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "UPDATE PROFILE"
                )}
              </Button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-8 border border-border bg-card rounded-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Lock className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-accent">
                Change Password
              </h2>
            </div>

            {passwordSuccess && (
              <div className="p-3 border border-green-200/50 bg-green-500/5 text-green-600 text-xs font-medium rounded-sm">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 border border-destructive/20 bg-destructive/5 text-destructive text-xs font-medium rounded-sm">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  disabled={changePasswordMutation.isPending}
                  className="h-12"
                  placeholder="••••••••"
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive font-medium">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  disabled={changePasswordMutation.isPending}
                  className="h-12"
                  placeholder="••••••••"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-[10px] text-destructive font-medium leading-tight">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  disabled={changePasswordMutation.isPending}
                  className="h-12"
                  placeholder="••••••••"
                  {...registerPassword("confirmNewPassword")}
                />
                {passwordErrors.confirmNewPassword && (
                  <p className="text-xs text-destructive font-medium">{passwordErrors.confirmNewPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full h-12 uppercase tracking-widest text-xs"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "CHANGE PASSWORD"
                )}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
