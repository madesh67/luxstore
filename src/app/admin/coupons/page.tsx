/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";


import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, X, Loader2, RefreshCw, Ticket, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CouponFormState {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
}

const initialFormState: CouponFormState = {
  code: "",
  discountType: "PERCENTAGE",
  value: 0,
  minOrderValue: null,
  maxDiscount: null,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  usageLimit: null,
  perUserLimit: 1,
  isActive: true,
};

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCouponId, setEditingCouponId] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState<CouponFormState>(initialFormState);

  // Queries
  const { data: couponsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-coupons", page, search],
    queryFn: async () => {
      const res = await fetch(`/api/admin/coupons?page=${page}&limit=10&search=${search}`);
      if (!res.ok) throw new Error("Failed to fetch coupons");
      const payload = await res.json();
      return payload.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error?.message || "Failed to create coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error?.message || "Failed to update coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const openCreateModal = () => {
    setEditingCouponId(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setEditingCouponId(coupon.id);
    setFormState({
      code: coupon.code,
      discountType: coupon.discountType,
      value: Number(coupon.value),
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      startDate: new Date(coupon.startDate).toISOString().split("T")[0],
      endDate: new Date(coupon.endDate).toISOString().split("T")[0],
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCouponId(null);
    setFormState(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formState,
      startDate: new Date(formState.startDate),
      endDate: new Date(formState.endDate + "T23:59:59"), // Include full day
    };

    if (editingCouponId) {
      updateMutation.mutate({ id: editingCouponId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to deactivate and soft-delete this coupon?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-white">Coupon & Promotion Rules</h2>
          <p className="text-xs text-[#a8a6a3] mt-1">Configure percentage, fixed amount, and free shipping discounts.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            size="sm"
            className="border-[#26221f] text-xs font-semibold tracking-widest text-[#a8a6a3] hover:text-white uppercase gap-2 hover:bg-[#1a1715]"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
          >
            <Plus className="h-4 w-4" /> Add Coupon
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-[#12100f] border border-[#26221f] rounded-xl px-4 py-2">
        <input
          type="text"
          placeholder="Search coupons by code name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value.toUpperCase());
            setPage(1);
          }}
          className="bg-transparent border-0 outline-none text-xs text-[#e8e6e3] placeholder-[#7d7a77] w-full"
        />
      </div>

      {/* Coupons Table */}
      <div className="border border-[#26221f] rounded-xl bg-[#12100f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#26221f] text-[10px] uppercase tracking-widest text-[#7d7a77] font-bold">
                <th className="p-4">Code</th>
                <th className="p-4">Type</th>
                <th className="p-4">Value</th>
                <th className="p-4">Limits</th>
                <th className="p-4">Redemptions</th>
                <th className="p-4">Expiration Period</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221f]/50 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#a8a6a3]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                    Fetching Coupons...
                  </td>
                </tr>
              ) : !couponsData?.data || couponsData.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#7d7a77] uppercase tracking-widest">
                    No promotional coupons registered
                  </td>
                </tr>
              ) : (
                couponsData.data.map((c: any) => {
                  const now = new Date();
                  const isExpired = new Date(c.endDate) < now;
                  return (
                    <tr key={c.id} className={`hover:bg-[#1a1715]/40 transition-colors ${isExpired ? "opacity-60" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-accent" />
                          <span className="font-bold text-white font-mono text-[13px]">{c.code}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs uppercase font-bold text-[#a8a6a3]">
                          {c.discountType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-white">
                        {c.discountType === "PERCENTAGE" ? `${c.value}%` : `₹${Number(c.value).toLocaleString()}`}
                      </td>
                      <td className="p-4 text-[#7d7a77] space-y-0.5">
                        {c.minOrderValue && <p className="text-[10px]">Min Spend: ₹{Number(c.minOrderValue).toLocaleString()}</p>}
                        {c.maxDiscount && <p className="text-[10px]">Max Disc: ₹{Number(c.maxDiscount).toLocaleString()}</p>}
                      </td>
                      <td className="p-4 text-[#a8a6a3] font-semibold">
                        {c.usageCount} / {c.usageLimit || "∞"}
                      </td>
                      <td className="p-4 text-[#a8a6a3]">
                        <p className="flex items-center gap-1.5 text-[10px] text-[#7d7a77]">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.isActive && !isExpired
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                            : "bg-red-950/40 text-red-400 border border-red-900/30"
                        }`}>
                          {isExpired ? "Expired" : c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditModal(c)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#a8a6a3] hover:text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(c.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination */}
        {couponsData && couponsData.totalPages > 1 && (
          <div className="h-16 flex items-center justify-between px-6 border-t border-[#26221f]">
            <span className="text-xs text-[#7d7a77]">
              Page {couponsData.page} of {couponsData.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="text-xs border-[#26221f]"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(couponsData.totalPages, p + 1))}
                disabled={page === couponsData.totalPages}
                variant="outline"
                size="sm"
                className="text-xs border-[#26221f]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12100f] border border-[#26221f] w-full max-w-xl rounded-xl shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#26221f]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {editingCouponId ? "Modify Coupon" : "Add Promo Coupon"}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="text-[#a8a6a3] hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={formState.code}
                    onChange={(e) => setFormState((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. LUXURY20"
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Discount Type</label>
                  <select
                    value={formState.discountType}
                    onChange={(e: any) => setFormState((p) => ({ ...p, discountType: e.target.value }))}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Value (INR)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formState.value}
                    disabled={formState.discountType === "FREE_SHIPPING"}
                    onChange={(e) => setFormState((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Min Order Spend</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.minOrderValue || ""}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, minOrderValue: parseFloat(e.target.value) || null }))
                    }
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Max Discount Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.maxDiscount || ""}
                    disabled={formState.discountType !== "PERCENTAGE"}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, maxDiscount: parseFloat(e.target.value) || null }))
                    }
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formState.startDate}
                    onChange={(e) => setFormState((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Expiration End Date</label>
                  <input
                    type="date"
                    required
                    value={formState.endDate}
                    onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Global Redemption Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.usageLimit || ""}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, usageLimit: parseInt(e.target.value, 10) || null }))
                    }
                    placeholder="e.g. 500 total uses"
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Redemptions Per User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.perUserLimit || ""}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, perUserLimit: parseInt(e.target.value, 10) || null }))
                    }
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(e) => setFormState((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-[#26221f] bg-[#1c1a17] text-accent focus:ring-0"
                />
                <span className="text-xs text-[#a8a6a3]">Set Active Status</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#26221f]">
                <Button type="button" variant="outline" onClick={closeModal} className="text-xs border-[#26221f]">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingCouponId ? "Save Changes" : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
