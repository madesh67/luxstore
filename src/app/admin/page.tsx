/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";


import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Percent,
  Users,
  UserPlus,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function fetchDashboardData() {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
  const payload = await res.json();
  return payload.data;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-accent" />
          <p className="text-xs uppercase tracking-widest text-[#a8a6a3]">Loading Metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-lg text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Failed to load metrics</h3>
        <p className="text-xs text-red-300/80 mt-1">{(error as Error)?.message || "An unknown error occurred"}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4 text-xs border-red-900/50 hover:bg-red-950/40">
          Retry
        </Button>
      </div>
    );
  }

  const { kpis, recentOrders, topProducts, recentCustomers, inventoryAlerts } = data;

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${(kpis.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: Coins,
      description: "Aggregated gross sales",
      color: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
      text: "text-amber-400",
    },
    {
      title: "Total Orders",
      value: kpis.totalOrders || 0,
      icon: ShoppingBag,
      description: "Placed store transactions",
      color: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
      text: "text-blue-400",
    },
    {
      title: "Average Order Value",
      value: `₹${(kpis.averageOrderValue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      description: "Average revenue per order",
      color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
      text: "text-emerald-400",
    },
    {
      title: "Conversion Rate",
      value: `${(kpis.conversionRate || 0).toFixed(2)}%`,
      icon: Percent,
      description: "Checkout success ratio",
      color: "from-purple-500/10 to-pink-500/5 border-purple-500/20",
      text: "text-purple-400",
    },
    {
      title: "New Customers",
      value: kpis.newCustomers || 0,
      icon: UserPlus,
      description: "Signed up in last 30 days",
      color: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
      text: "text-cyan-400",
    },
    {
      title: "Active Customers",
      value: kpis.activeCustomers || 0,
      icon: Users,
      description: "Unique buyers count",
      color: "from-orange-500/10 to-amber-500/5 border-orange-500/20",
      text: "text-orange-400",
    },
    {
      title: "Low Stock Products",
      value: kpis.lowStockProducts || 0,
      icon: AlertTriangle,
      description: "Below safety thresholds",
      color: kpis.lowStockProducts > 0 ? "from-red-500/10 to-rose-500/5 border-red-500/30 animate-pulse" : "from-gray-500/10 to-gray-500/5 border-gray-500/20",
      text: kpis.lowStockProducts > 0 ? "text-red-400" : "text-gray-400",
    },
    {
      title: "Pending Orders",
      value: kpis.pendingOrders || 0,
      icon: Clock,
      description: "Awaiting fulfillment",
      color: "from-teal-500/10 to-emerald-500/5 border-teal-500/20",
      text: "text-teal-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-white">Operations Dashboard</h2>
          <p className="text-xs text-[#a8a6a3] mt-1">Real-time statistics and premium store metrics monitoring.</p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="w-fit border-[#26221f] text-xs font-semibold tracking-widest text-[#a8a6a3] hover:text-white uppercase gap-2 hover:bg-[#1a1715]"
        >
          <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-xl border bg-gradient-to-br ${card.color} shadow-sm space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest uppercase text-[#a8a6a3]">{card.title}</span>
                <Icon className={`h-5 w-5 ${card.text}`} />
              </div>
              <div>
                <p className="text-2xl font-display font-semibold text-white">{card.value}</p>
                <p className="text-[10px] text-[#7d7a77] mt-1">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Premium Sales & Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Area Chart SVG */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-[#26221f] bg-[#12100f] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest uppercase text-white">Sales Performance Curve</h3>
            <span className="text-[10px] text-accent uppercase font-bold tracking-widest bg-accent/10 px-2 py-0.5 rounded">Last 30 Days</span>
          </div>
          {/* Custom SVG Line Chart */}
          <div className="h-64 w-full relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#26221f" strokeDasharray="3,3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#26221f" strokeDasharray="3,3" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#26221f" strokeDasharray="3,3" />
              <line x1="0" y1="190" x2="500" y2="190" stroke="#26221f" />

              {/* Area & Line */}
              <path
                d="M 0 190 Q 50 170 100 130 T 200 90 T 300 110 T 400 60 T 500 40 L 500 190 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M 0 190 Q 50 170 100 130 T 200 90 T 300 110 T 400 60 T 500 40"
                fill="none"
                stroke="#d4af37"
                strokeWidth="2.5"
              />

              {/* Tooltip Indicators */}
              <circle cx="200" cy="90" r="5" fill="#d4af37" stroke="#12100f" strokeWidth="2" />
              <circle cx="400" cy="60" r="5" fill="#d4af37" stroke="#12100f" strokeWidth="2" />
              <circle cx="500" cy="40" r="5" fill="#d4af37" stroke="#12100f" strokeWidth="2" />
            </svg>
            <div className="absolute top-2 left-2 flex gap-4 text-[9px] text-[#7d7a77] uppercase font-bold tracking-widest">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Revenue (INR)</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="p-6 rounded-xl border border-[#26221f] bg-[#12100f] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest uppercase text-white">Top Selling Products</h3>
            <Link href="/admin/products" className="text-[10px] text-accent hover:underline font-bold uppercase tracking-wider flex items-center gap-1">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-xs text-[#7d7a77] py-8 text-center uppercase tracking-widest">No order data yet</p>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#26221f]/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold font-display text-accent bg-accent/10 h-6 w-6 rounded flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <p className="text-xs font-semibold text-white truncate max-w-[140px]">{p.name}</p>
                  </div>
                  <span className="text-xs font-bold text-accent bg-[#1c1a17] px-2.5 py-1 rounded">
                    {p.salesCount} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lists Section: Recent Orders & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders List */}
        <div className="p-6 rounded-xl border border-[#26221f] bg-[#12100f] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest uppercase text-white">Recent Orders</h3>
            <span className="text-[9px] text-[#7d7a77] uppercase font-bold tracking-widest">Store log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#26221f] text-[10px] uppercase tracking-widest text-[#7d7a77] font-bold">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26221f]/40 text-xs">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#7d7a77] uppercase tracking-widest">No orders logged</td>
                  </tr>
                ) : (
                  recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-[#151312]/30 transition-colors">
                      <td className="py-3 font-semibold text-white">{o.orderNumber}</td>
                      <td className="py-3 text-[#a8a6a3]">{o.email}</td>
                      <td className="py-3 font-semibold text-white">₹{Number(o.total.toString()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                          o.status === "DELIVERED"
                            ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                            : o.status === "PENDING"
                            ? "bg-amber-950/50 text-amber-400 border border-amber-900/30"
                            : "bg-blue-950/50 text-blue-400 border border-blue-900/30"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="p-6 rounded-xl border border-[#26221f] bg-[#12100f] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest uppercase text-white">Inventory Stock Alerts</h3>
            <Link href="/admin/inventory" className="text-[10px] text-accent hover:underline font-bold uppercase tracking-wider flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {inventoryAlerts.length === 0 ? (
              <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 py-4 px-4 rounded-lg text-center uppercase tracking-widest font-bold">
                ✓ All catalog stocks are above threshold
              </p>
            ) : (
              inventoryAlerts.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-red-950/15 border border-red-950/40">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="text-[10px] text-[#7d7a77] font-semibold uppercase tracking-widest">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                      item.quantity === 0
                        ? "bg-red-950 text-red-400 border border-red-900/30 animate-pulse"
                        : "bg-amber-950 text-amber-400 border border-amber-900/30"
                    }`}>
                      {item.quantity === 0 ? "Out of Stock" : `${item.quantity} Left`}
                    </span>
                    <p className="text-[9px] text-[#7d7a77] mt-1.5 uppercase font-bold tracking-wider">Threshold: {item.threshold}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
