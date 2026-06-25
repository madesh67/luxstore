/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";


import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  ArrowUpDown,
  History,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [lowStockOnly, setLowStockOnly] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"status" | "logs">("status");

  // Adjust modal states
  const [isAdjustModalOpen, setIsAdjustModalOpen] = React.useState(false);
  const [selectedInventory, setSelectedInventory] = React.useState<any | null>(null);
  const [adjustQty, setAdjustQty] = React.useState(0);
  const [adjustAction, setAdjustAction] = React.useState<"ADJUSTMENT" | "RECONCILIATION">("ADJUSTMENT");
  const [adjustNotes, setAdjustNotes] = React.useState("");

  // Threshold modal states
  const [isThresholdModalOpen, setIsThresholdModalOpen] = React.useState(false);
  const [thresholdState, setThresholdState] = React.useState({ lowStockThreshold: 5, incoming: 0 });

  // Queries
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ["admin-inventory", page, search, lowStockOnly],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/inventory?page=${page}&limit=10&search=${search}&lowStockOnly=${lowStockOnly}`
      );
      if (!res.ok) throw new Error("Failed to fetch inventory tracking");
      const payload = await res.json();
      return payload.data;
    },
  });

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["admin-inventory-logs", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/inventory/history?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch inventory logs");
      const payload = await res.json();
      return payload.data;
    },
    enabled: activeTab === "logs",
  });

  // Mutations
  const adjustMutation = useMutation({
    mutationFn: async (data: { id: string; quantityChange: number; action: string; notes?: string }) => {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log stock adjustment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory-logs"] });
      closeAdjustModal();
    },
  });

  const thresholdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { lowStockThreshold: number; incoming: number } }) => {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update thresholds");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      closeThresholdModal();
    },
  });

  const openAdjustModal = (inv: any) => {
    setSelectedInventory(inv);
    setAdjustQty(0);
    setAdjustAction("ADJUSTMENT");
    setAdjustNotes("");
    setIsAdjustModalOpen(true);
  };

  const closeAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setSelectedInventory(null);
  };

  const openThresholdModal = (inv: any) => {
    setSelectedInventory(inv);
    setThresholdState({
      lowStockThreshold: inv.lowStockThreshold,
      incoming: inv.incoming,
    });
    setIsThresholdModalOpen(true);
  };

  const closeThresholdModal = () => {
    setIsThresholdModalOpen(false);
    setSelectedInventory(null);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    if (adjustQty === 0) {
      alert("Adjustment quantity change cannot be 0");
      return;
    }

    adjustMutation.mutate({
      id: selectedInventory.id,
      quantityChange: adjustQty,
      action: adjustAction,
      notes: adjustNotes,
    });
  };

  const handleThresholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;

    thresholdMutation.mutate({
      id: selectedInventory.id,
      data: thresholdState,
    });
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-foreground">Inventory Controls</h2>
          <p className="text-xs text-muted-foreground mt-1">Audit stock quantities, review transaction logs, and manage alerts.</p>
        </div>

        <div className="flex items-center gap-2 border border-border rounded-lg p-0.5 bg-card">
          <Button
            onClick={() => {
              setActiveTab("status");
              setPage(1);
            }}
            variant="ghost"
            className={`text-xs font-semibold uppercase tracking-wider px-4 py-1.5 h-auto ${
              activeTab === "status" ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="h-3.5 w-3.5 mr-2" /> Stock Status
          </Button>
          <Button
            onClick={() => {
              setActiveTab("logs");
              setPage(1);
            }}
            variant="ghost"
            className={`text-xs font-semibold uppercase tracking-wider px-4 py-1.5 h-auto ${
              activeTab === "logs" ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5 mr-2" /> Audit Trail Logs
          </Button>
        </div>
      </div>

      {activeTab === "status" ? (
        <>
          {/* Status Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex-1 flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2">
              <input
                type="text"
                placeholder="Search products by SKU or Name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-0 outline-none text-xs text-foreground placeholder-[#7d7a77] w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-border bg-background text-accent focus:ring-0"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Show Low Stock Alerts Only
              </span>
            </label>
          </div>

          {/* Stock Table */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">
                    <th className="p-4">SKU</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-center">Total Quantity</th>
                    <th className="p-4 text-center">Reserved</th>
                    <th className="p-4 text-center">Available</th>
                    <th className="p-4 text-center">Incoming</th>
                    <th className="p-4 text-center">Low Threshold</th>
                    <th className="p-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-xs">
                  {inventoryLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                        Fetching Inventory Status...
                      </td>
                    </tr>
                  ) : !inventoryData?.data || inventoryData.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground/80 uppercase tracking-widest">
                        No inventory data matching criteria
                      </td>
                    </tr>
                  ) : (
                    inventoryData.data.map((item: any) => {
                      const isLowStock = item.quantity <= item.lowStockThreshold;
                      return (
                        <tr key={item.id} className={`hover:bg-muted/40 transition-colors ${isLowStock ? "bg-red-950/5" : ""}`}>
                          <td className="p-4 font-mono text-[11px] text-muted-foreground">{item.product.sku}</td>
                          <td className="p-4 font-semibold text-foreground">
                            <span className="flex items-center gap-2">
                              {item.product.name}
                              {isLowStock && (
                                <span className="bg-red-950/60 text-red-400 border border-red-900/30 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Alert
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-foreground">{item.quantity}</td>
                          <td className="p-4 text-center text-muted-foreground/80">{item.reserved}</td>
                          <td className="p-4 text-center text-emerald-400 font-semibold">{item.available}</td>
                          <td className="p-4 text-center text-muted-foreground">{item.incoming}</td>
                          <td className="p-4 text-center text-amber-500 font-semibold">{item.lowStockThreshold}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                onClick={() => openAdjustModal(item)}
                                variant="outline"
                                size="sm"
                                className="text-xs md:text-[10px] border-border hover:bg-muted h-11 md:h-7 uppercase tracking-wider font-bold flex items-center px-4"
                              >
                                Adjust Stock
                              </Button>
                              <Button
                                onClick={() => openThresholdModal(item)}
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 md:h-7 md:w-7 text-muted-foreground/80 hover:text-foreground flex items-center justify-center"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Inventory Status Pagination */}
            {inventoryData && inventoryData.totalPages > 1 && (
              <div className="h-16 flex items-center justify-between px-6 border-t border-border">
                <span className="text-xs text-muted-foreground/80">
                  Page {inventoryData.page} of {inventoryData.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="text-xs border-border"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(inventoryData.totalPages, p + 1))}
                    disabled={page === inventoryData.totalPages}
                    variant="outline"
                    size="sm"
                    className="text-xs border-border"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Logs Tab */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">SKU / Product</th>
                    <th className="p-4 text-center">Movement</th>
                    <th className="p-4 text-center">Prev Qty</th>
                    <th className="p-4 text-center">New Qty</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-xs">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                        Fetching Audit Logs...
                      </td>
                    </tr>
                  ) : !logsData?.data || logsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground/80 uppercase tracking-widest">
                        No logs recorded yet
                      </td>
                    </tr>
                  ) : (
                    logsData.data.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-4 text-muted-foreground/80 font-mono text-[10px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-foreground">{log.inventory.product.name}</p>
                          <p className="text-[10px] text-muted-foreground/80 font-mono">{log.inventory.product.sku}</p>
                        </td>
                        <td className={`p-4 text-center font-bold ${log.quantity > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </td>
                        <td className="p-4 text-center text-muted-foreground/80">{log.previousQty}</td>
                        <td className="p-4 text-center text-foreground font-semibold">{log.newQty}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.action === "RECONCILIATION"
                              ? "bg-purple-950/50 text-purple-400 border border-purple-900/30"
                              : log.action === "RESERVATION"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-900/30"
                              : "bg-background text-muted-foreground border border-border"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{log.user ? `${log.user.firstName} (${log.user.email})` : "System"}</td>
                        <td className="p-4 text-muted-foreground/80 italic">{log.notes || "None"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Audit Logs Pagination */}
            {logsData && logsData.totalPages > 1 && (
              <div className="h-16 flex items-center justify-between px-6 border-t border-border">
                <span className="text-xs text-muted-foreground/80">
                  Page {logsData.page} of {logsData.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="text-xs border-border"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(logsData.totalPages, p + 1))}
                    disabled={page === logsData.totalPages}
                    variant="outline"
                    size="sm"
                    className="text-xs border-border"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Adjust Stock Quantities</h3>
              <Button variant="ghost" size="icon" onClick={closeAdjustModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-6">
              <div className="bg-background border border-border p-4 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-foreground">{selectedInventory.product.name}</p>
                <p className="text-[10px] text-muted-foreground/80 font-mono uppercase tracking-widest">SKU: {selectedInventory.product.sku}</p>
                <p className="text-xs text-foreground pt-2">Current Count: <strong className="text-accent">{selectedInventory.quantity} units</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Adjustment Type</label>
                  <select
                    value={adjustAction}
                    onChange={(e: any) => setAdjustAction(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  >
                    <option value="ADJUSTMENT">Standard Adjustment</option>
                    <option value="RECONCILIATION">Reconciliation Audit</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delta Change (+ / -)</label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAdjustQty((q) => q - 1)}
                      className="border-border h-9 w-9 rounded-r-none rounded-l-lg"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <input
                      type="number"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-9 bg-background border-y border-border text-center text-xs text-foreground outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAdjustQty((q) => q + 1)}
                      className="border-border h-9 w-9 rounded-l-none rounded-r-lg"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes / Reason</label>
                <textarea
                  required
                  rows={3}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Received shipment, audited stock discrepancy"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={closeAdjustModal} className="text-xs border-border">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
                >
                  {adjustMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {isThresholdModalOpen && selectedInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Edit Stock Alert Settings</h3>
              <Button variant="ghost" size="icon" onClick={closeThresholdModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleThresholdSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Threshold Limit</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={thresholdState.lowStockThreshold}
                  onChange={(e) =>
                    setThresholdState((p) => ({ ...p, lowStockThreshold: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Incoming Purchase Order Stock</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={thresholdState.incoming}
                  onChange={(e) =>
                    setThresholdState((p) => ({ ...p, incoming: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={closeThresholdModal} className="text-xs border-border">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={thresholdMutation.isPending}
                  className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
                >
                  {thresholdMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Thresholds
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
