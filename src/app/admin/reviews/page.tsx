"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Check,
  X,
  EyeOff,
  Trash2,
  Flag,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  isFlagged: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  product: {
    name: string;
  };
}

export default function AdminReviewsPage() {

  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [flagFilter, setFlagFilter] = React.useState<string>("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Queries
  const { data: reviewsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-reviews", page, search, statusFilter, flagFilter],
    queryFn: async () => {
      let url = `/api/admin/reviews?page=${page}&limit=10`;
      if (search) url += `&search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (flagFilter) url += `&isFlagged=${flagFilter === "true"}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const payload = await res.json();
      return payload.data;
    },
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to moderate review status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
    },
  });

  const toggleFlagMutation = useMutation({
    mutationFn: async ({ id, isFlagged }: { id: string; isFlagged: boolean }) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFlagged }),
      });
      if (!res.ok) throw new Error("Failed to update flag state");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (data: { ids: string[]; status: string }) => {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to process bulk status moderation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
      setSelectedIds([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to bulk delete reviews");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
      setSelectedIds([]);
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && reviewsData?.data) {
      setSelectedIds(reviewsData.data.map((r: Review) => r.id));
    } else {
      setSelectedIds([]);
    }
  };


  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedIds.length === 0) return;
    bulkStatusMutation.mutate({ ids: selectedIds, status });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to permanently delete these ${selectedIds.length} reviews?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this review?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-white">Review Moderation</h2>
          <p className="text-xs text-[#a8a6a3] mt-1">Audit customer testimonials, flag reviews, and update active approvals.</p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="border-[#26221f] text-xs font-semibold tracking-widest text-[#a8a6a3] hover:text-white uppercase gap-2 hover:bg-[#1a1715]"
        >
          <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#12100f] border border-[#26221f] rounded-xl p-4">
        {/* Search */}
        <div className="md:col-span-2 flex items-center gap-3 bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-[#7d7a77]" />
          <input
            type="text"
            placeholder="Search reviews by comment, product or writer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent border-0 outline-none text-xs text-[#e8e6e3] placeholder-[#7d7a77] w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-1.5 text-xs text-white">
          <Filter className="h-4.5 w-4.5 text-[#7d7a77] mr-1" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent border-0 outline-none text-xs w-full text-[#a8a6a3]"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved / Visible</option>
            <option value="REJECTED">Rejected</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>

        {/* Flagged filter */}
        <div className="flex items-center gap-2 bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-1.5 text-xs text-white">
          <Flag className="h-4 w-4 text-[#7d7a77] mr-1" />
          <select
            value={flagFilter}
            onChange={(e) => {
              setFlagFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent border-0 outline-none text-xs w-full text-[#a8a6a3]"
          >
            <option value="">All Reviews</option>
            <option value="true">Flagged Items Only</option>
            <option value="false">Unflagged Items Only</option>
          </select>
        </div>
      </div>

      {/* Bulk actions tray */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-accent/30 bg-accent/5 animate-fade-in">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            {selectedIds.length} reviews selected
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkStatusUpdate("APPROVED")}
              variant="outline"
              size="sm"
              className="text-[10px] border-emerald-900/50 hover:bg-emerald-950/20 text-emerald-400 font-bold uppercase tracking-wider h-8"
            >
              Approve All
            </Button>
            <Button
              onClick={() => handleBulkStatusUpdate("REJECTED")}
              variant="outline"
              size="sm"
              className="text-[10px] border-amber-900/50 hover:bg-amber-950/20 text-amber-400 font-bold uppercase tracking-wider h-8"
            >
              Reject All
            </Button>
            <Button
              onClick={() => handleBulkStatusUpdate("HIDDEN")}
              variant="outline"
              size="sm"
              className="text-[10px] border-gray-800 hover:bg-gray-900 text-gray-400 font-bold uppercase tracking-wider h-8"
            >
              Hide All
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="outline"
              size="sm"
              className="text-[10px] border-red-900/50 hover:bg-red-950/20 text-red-400 font-bold uppercase tracking-wider h-8"
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Reviews Moderation Table */}
      <div className="border border-[#26221f] rounded-xl bg-[#12100f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#26221f] text-[10px] uppercase tracking-widest text-[#7d7a77] font-bold">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={reviewsData?.data && selectedIds.length === reviewsData.data.length}
                    onChange={handleSelectAll}
                    className="rounded border-[#26221f] bg-[#1c1a17] text-accent focus:ring-0"
                  />
                </th>
                <th className="p-4">Customer</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Score</th>
                <th className="p-4 w-96">Review text</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221f]/50 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#a8a6a3]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                    Fetching Reviews...
                  </td>
                </tr>
              ) : !reviewsData?.data || reviewsData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#7d7a77] uppercase tracking-widest">
                    No reviews mapped
                  </td>
                </tr>
              ) : (
                reviewsData.data.map((r: Review) => (
                  <tr key={r.id} className="hover:bg-[#1a1715]/40 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                        className="rounded border-[#26221f] bg-[#1c1a17] text-accent focus:ring-0"
                      />
                    </td>
                    <td className="p-4 font-semibold text-white">
                      <p>{r.user.firstName} {r.user.lastName}</p>
                      <p className="text-[10px] text-[#7d7a77] font-mono">{r.user.email}</p>
                    </td>
                    <td className="p-4 text-[#a8a6a3]">{r.product.name}</td>
                    <td className="p-4">
                      <div className="flex items-center text-accent">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`h-3 w-3 ${idx < r.rating ? "fill-accent" : "text-[#26221f]"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      {r.isFlagged && (
                        <span className="inline-flex items-center gap-1 bg-red-950/60 text-red-400 border border-red-900/30 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1.5">
                          <AlertTriangle className="h-2.5 w-2.5" /> Flagged
                        </span>
                      )}
                      <p className="font-semibold text-white">{r.title}</p>
                      <p className="text-[#a8a6a3] italic">{r.comment}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        r.status === "APPROVED"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                          : r.status === "PENDING"
                          ? "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                          : r.status === "HIDDEN"
                          ? "bg-gray-800 text-gray-400 border border-gray-700"
                          : "bg-red-950/40 text-red-400 border border-red-900/30"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          onClick={() => updateStatusMutation.mutate({ id: r.id, status: "APPROVED" })}
                          variant="ghost"
                          size="icon"
                          disabled={r.status === "APPROVED"}
                          className="h-7 w-7 text-emerald-400 hover:bg-emerald-950/30"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => updateStatusMutation.mutate({ id: r.id, status: "REJECTED" })}
                          variant="ghost"
                          size="icon"
                          disabled={r.status === "REJECTED"}
                          className="h-7 w-7 text-amber-500 hover:bg-amber-950/30"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => updateStatusMutation.mutate({ id: r.id, status: "HIDDEN" })}
                          variant="ghost"
                          size="icon"
                          disabled={r.status === "HIDDEN"}
                          className="h-7 w-7 text-gray-400 hover:bg-gray-800"
                          title="Hide"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => toggleFlagMutation.mutate({ id: r.id, isFlagged: !r.isFlagged })}
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${r.isFlagged ? "text-red-400 bg-red-950/20" : "text-gray-400 hover:text-white"}`}
                          title={r.isFlagged ? "Unflag" : "Flag"}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(r.id)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:bg-red-950/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reviewsData && reviewsData.totalPages > 1 && (
          <div className="h-16 flex items-center justify-between px-6 border-t border-[#26221f]">
            <span className="text-xs text-[#7d7a77]">
              Page {reviewsData.page} of {reviewsData.totalPages}
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
                onClick={() => setPage((p) => Math.min(reviewsData.totalPages, p + 1))}
                disabled={page === reviewsData.totalPages}
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
    </div>
  );
}
