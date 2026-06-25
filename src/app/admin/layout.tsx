"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  FolderTree,
  Award,
  Star,
  Ticket,
  Settings,
  Image as ImageIcon,
  BarChart3,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useLogout } from "@/hooks/use-auth";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Brands", href: "/admin/brands", icon: Award },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const logoutMutation = useLogout();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Client-side authentication check helper
  React.useEffect(() => {
    if (!isLoading && (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN"))) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-accent">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="font-display text-sm tracking-widest uppercase text-accent/70">
            Initializing LuxStore Command Panel...
          </span>
        </div>
      </div>
    );
  }

  // If user role is not authorized, don't flash dashboard
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 md:translate-x-0 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand/Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-1">
            <span className="font-display text-xl font-bold tracking-wider text-foreground">
              LUX<span className="text-accent">COMMAND</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with User Profile Summary & Logout */}
        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{user.role}</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-xs font-bold tracking-wider text-destructive hover:bg-destructive/10 hover:text-destructive gap-3 uppercase py-2.5 rounded-lg"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
              <span className="hidden sm:inline">Command Center / </span><span className="text-foreground">{pathname?.split("/").pop() || "Dashboard"}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="text-xs border-border hover:bg-muted gap-2">
              <Link href="/" target="_blank">
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">View Storefront</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Body Wrapper */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
