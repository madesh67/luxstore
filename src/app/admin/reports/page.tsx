"use client";

import * as React from "react";
import {
  BarChart3,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  Boxes,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const [startDate, setStartDate] = React.useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [exportingType, setExportingType] = React.useState<string | null>(null);

  const reports = [
    {
      id: "sales",
      title: "Sales Report",
      description: "Order sheets, tracking numbers, transaction amounts, and shipment statuses.",
      icon: BarChart3,
      color: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
      text: "text-blue-400",
    },
    {
      id: "revenue",
      title: "Revenue Report",
      description: "Gross revenue totals, subtotals, tax costs, and shipping fee margins.",
      icon: TrendingUp,
      color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
      text: "text-emerald-400",
    },
    {
      id: "customers",
      title: "Customer Report",
      description: "Customer accounts growth, orders volume, active accounts, and total spend.",
      icon: Users,
      color: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
      text: "text-cyan-400",
    },
    {
      id: "products",
      title: "Product Performance",
      description: "Unit sales volume, revenue contribution breakdown, and catalog analytics.",
      icon: FileText,
      color: "from-purple-500/10 to-pink-500/5 border-purple-500/20",
      text: "text-purple-400",
    },
    {
      id: "inventory",
      title: "Inventory Stock Sheet",
      description: "Current counts, available reserves, incoming purchase orders, and alerts.",
      icon: Boxes,
      color: "from-orange-500/10 to-amber-500/5 border-orange-500/20",
      text: "text-orange-400",
    },
    {
      id: "coupons",
      title: "Coupon Redemptions",
      description: "Discount code logs, usage frequencies, and total redemption values.",
      icon: Tag,
      color: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
      text: "text-amber-400",
    },
  ];

  const handleDownload = async (type: string) => {
    setExportingType(type);
    try {
      const url = `/api/admin/reports?type=${type}&startDate=${startDate}&endDate=${endDate}&format=csv`;
      
      // Trigger native browser download behavior
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export report sheet.");
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-foreground">Business Reporting Center</h2>
          <p className="text-xs text-muted-foreground mt-1">Export raw tabular data sheets to CSV format for financial audit.</p>
        </div>
      </div>

      {/* Date filter card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" /> Date Timeframe Boundaries
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const isExporting = exportingType === report.id;
          return (
            <div
              key={report.id}
              className={`p-6 rounded-xl border bg-gradient-to-br ${report.color} flex flex-col justify-between h-56`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
                    {report.title}
                  </span>
                  <Icon className={`h-5 w-5 ${report.text}`} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{report.description}</p>
              </div>

              <Button
                onClick={() => handleDownload(report.id)}
                disabled={isExporting}
                className="w-full bg-transparent hover:bg-muted border border-border hover:border-border text-foreground text-xs font-semibold tracking-widest uppercase gap-2 py-2.5 h-auto transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-accent" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download CSV
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
