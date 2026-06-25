/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";


import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, X, Upload, Loader2, RefreshCw, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerFormState {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  order: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

const initialFormState: BannerFormState = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  position: "HERO",
  order: 0,
  startDate: null,
  endDate: null,
  isActive: true,
};

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBannerId, setEditingBannerId] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState<BannerFormState>(initialFormState);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Queries
  const { data: bannersData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-banners", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/banners?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch banners");
      const payload = await res.json();
      return payload.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const sortMutation = useMutation({
    mutationFn: async (orders: { id: string; order: number }[]) => {
      const res = await fetch("/api/admin/banners/sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });
      if (!res.ok) throw new Error("Failed to sort banners");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const openCreateModal = () => {
    setEditingBannerId(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: any) => {
    setEditingBannerId(banner.id);
    setFormState({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      position: banner.position,
      order: banner.order,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split("T")[0] : null,
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split("T")[0] : null,
      isActive: banner.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBannerId(null);
    setFormState(initialFormState);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "banners");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      setFormState((prev) => ({
        ...prev,
        imageUrl: data.data.secureUrl,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.imageUrl) {
      alert("Banner image is required");
      return;
    }

    const payload = {
      ...formState,
      startDate: formState.startDate ? new Date(formState.startDate) : null,
      endDate: formState.endDate ? new Date(formState.endDate + "T23:59:59") : null,
      linkUrl: formState.linkUrl || null,
    };

    if (editingBannerId) {
      updateMutation.mutate({ id: editingBannerId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this promotional banner?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!bannersData?.data) return;
    const items = [...bannersData.data];
    const targetIdx = index + (direction === "up" ? -1 : 1);

    if (targetIdx < 0 || targetIdx >= items.length) return;

    // Swap order values
    const current = items[index];
    const target = items[targetIdx];

    const sortPayload = [
      { id: current.id, order: target.order },
      { id: target.id, order: current.order },
    ];

    sortMutation.mutate(sortPayload);
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-foreground">Promotional Banner Cards</h2>
          <p className="text-xs text-muted-foreground mt-1">Schedule and position homepage hero slides and strip campaigns.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            size="sm"
            className="border-border text-xs font-semibold tracking-widest text-muted-foreground hover:text-foreground uppercase gap-2 hover:bg-muted"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
          >
            <Plus className="h-4 w-4" /> Add Banner
          </Button>
        </div>
      </div>

      {/* Banners List */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">
                <th className="p-4 w-48">Image Banner</th>
                <th className="p-4">Campaign Title</th>
                <th className="p-4">Position</th>
                <th className="p-4 text-center">Display Order</th>
                <th className="p-4">Fulfillment Schedule</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                    Fetching Campaigns...
                  </td>
                </tr>
              ) : !bannersData?.data || bannersData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground/80 uppercase tracking-widest">
                    No promotional campaigns created
                  </td>
                </tr>
              ) : (
                bannersData.data.map((b: any, idx: number) => {
                  const now = new Date();
                  const isExpired = b.endDate && new Date(b.endDate) < now;
                  const isScheduled = b.startDate && new Date(b.startDate) > now;
                  return (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-4">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="h-16 w-32 object-cover rounded-lg border border-border bg-background"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-foreground">{b.title}</p>
                        <p className="text-muted-foreground text-[11px] truncate max-w-[180px]">{b.subtitle || "-"}</p>
                        {b.linkUrl && <p className="text-[10px] text-accent truncate max-w-[180px] mt-0.5">{b.linkUrl}</p>}
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                          {b.position}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-foreground mr-2">{b.order}</span>
                          <Button
                            onClick={() => handleMove(idx, "up")}
                            disabled={idx === 0}
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 md:h-6 md:w-6 text-muted-foreground/80 hover:text-foreground flex items-center justify-center"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleMove(idx, "down")}
                            disabled={idx === bannersData.data.length - 1}
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 md:h-6 md:w-6 text-muted-foreground/80 hover:text-foreground flex items-center justify-center"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground space-y-0.5">
                        {b.startDate || b.endDate ? (
                          <p className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                            <Calendar className="h-3 w-3" />
                            {b.startDate ? new Date(b.startDate).toLocaleDateString() : "Anytime"} – {b.endDate ? new Date(b.endDate).toLocaleDateString() : "Anytime"}
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-400">Always Active</p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isExpired
                            ? "bg-red-950/40 text-red-400 border border-red-900/30"
                            : isScheduled
                            ? "bg-blue-950/40 text-blue-400 border border-blue-900/30"
                            : b.isActive
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                            : "bg-red-950/40 text-red-400 border border-red-900/30"
                        }`}>
                          {isExpired ? "Expired" : isScheduled ? "Scheduled" : b.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditModal(b)}
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 md:h-8 md:w-8 text-muted-foreground hover:text-foreground flex items-center justify-center"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(b.id)}
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 md:h-8 md:w-8 text-red-400 hover:text-red-300 flex items-center justify-center"
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
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                {editingBannerId ? "Modify Banner Card" : "Configure Banner Campaign"}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Position</label>
                  <select
                    value={formState.position}
                    onChange={(e) => setFormState((p) => ({ ...p, position: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  >
                    <option value="HERO">Hero Slideshow (Carousel)</option>
                    <option value="PROMO_STRIP">Strip Campaign Banner</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subtitle / Caption</label>
                <input
                  type="text"
                  value={formState.subtitle}
                  onChange={(e) => setFormState((p) => ({ ...p, subtitle: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Redirect Link URL (Optional)</label>
                  <input
                    type="text"
                    value={formState.linkUrl}
                    onChange={(e) => setFormState((p) => ({ ...p, linkUrl: e.target.value }))}
                    placeholder="https://luxstore.com/shop?category=timepieces"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Weight</label>
                  <input
                    type="number"
                    value={formState.order}
                    onChange={(e) => setFormState((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Activation Date (Optional)</label>
                  <input
                    type="date"
                    value={formState.startDate || ""}
                    onChange={(e) => setFormState((p) => ({ ...p, startDate: e.target.value || null }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deactivation Date (Optional)</label>
                  <input
                    type="date"
                    value={formState.endDate || ""}
                    onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value || null }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Banner Image Asset</label>
                <div className="flex items-center gap-4">
                  {formState.imageUrl ? (
                    <div className="relative h-20 w-40 border border-border rounded-lg overflow-hidden bg-background">
                      <img src={formState.imageUrl} alt="Upload preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-1 right-1 bg-red-600/85 hover:bg-red-700 text-white rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-20 w-40 border border-dashed border-border hover:border-accent rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin text-accent" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground/80 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/80">Upload Graphic</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                  <span className="text-[10px] text-muted-foreground/80 max-w-[200px]">Hero dimensions: 1920x800 webp format. Strip dimensions: 1200x200 webp format.</span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(e) => setFormState((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-border bg-background text-accent focus:ring-0"
                />
                <span className="text-xs text-muted-foreground">Set Active Status</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={closeModal} className="text-xs border-border">
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
                  {editingBannerId ? "Save Changes" : "Create Campaign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
