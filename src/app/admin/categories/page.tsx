/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";


import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, X, Upload, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  image: string | null;
  active: boolean;
  parentId: string | null;
}

const initialFormState: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  image: null,
  active: true,
  parentId: null,
};

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState<CategoryFormState>(initialFormState);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Queries
  const { data: categories, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const payload = await res.json();
      return payload.data.categories;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error?.message || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error?.message || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
    },
  });

  const openCreateModal = () => {
    setEditingCategoryId(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingCategoryId(category.id);
    setFormState({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || null,
      active: category.active,
      parentId: category.parentId || null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategoryId(null);
    setFormState(initialFormState);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormState((prev) => ({
      ...prev,
      name,
      slug: prev.slug === slugify(prev.name) || prev.slug === "" ? slugify(name) : prev.slug,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "categories");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      setFormState((prev) => ({
        ...prev,
        image: data.data.secureUrl,
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

    const payload = {
      ...formState,
      parentId: formState.parentId || null,
    };

    if (editingCategoryId) {
      updateMutation.mutate({ id: editingCategoryId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to deactivate and soft-delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-white">Categories Management</h2>
          <p className="text-xs text-[#a8a6a3] mt-1">Structure your product catalog hierarchy with parent-child connections.</p>
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
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="border border-[#26221f] rounded-xl bg-[#12100f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#26221f] text-[10px] uppercase tracking-widest text-[#7d7a77] font-bold">
                <th className="p-4">Image</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Parent Category</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221f]/50 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#a8a6a3]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                    Fetching Categories...
                  </td>
                </tr>
              ) : !categories || categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#7d7a77] uppercase tracking-widest">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#1a1715]/40 transition-colors">
                    <td className="p-4">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-10 w-10 object-cover rounded-lg border border-[#26221f]"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-[#1c1a17] border border-[#26221f] rounded-lg flex items-center justify-center text-[10px] text-[#7d7a77] font-bold uppercase">
                          Null
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-white">{c.name}</td>
                    <td className="p-4 font-mono text-[11px] text-[#a8a6a3]">{c.slug}</td>
                    <td className="p-4 text-[#a8a6a3]">{c.parent?.name || "None (Root)"}</td>
                    <td className="p-4 text-[#7d7a77] max-w-[200px] truncate">{c.description || "-"}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.active
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                          : "bg-red-950/40 text-red-400 border border-red-900/30"
                      }`}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openEditModal(c)}
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 md:h-8 md:w-8 text-[#a8a6a3] hover:text-white flex items-center justify-center"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(c.id)}
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 md:h-8 md:w-8 text-red-400 hover:text-red-300 flex items-center justify-center"
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
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12100f] border border-[#26221f] w-full max-w-lg rounded-xl shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#26221f]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {editingCategoryId ? "Modify Category" : "Add New Category"}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="text-[#a8a6a3] hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Category Name</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={handleNameChange}
                  className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Slug</label>
                <input
                  type="text"
                  required
                  value={formState.slug}
                  onChange={(e) => setFormState((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Parent Category</label>
                <select
                  value={formState.parentId || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, parentId: e.target.value || null }))}
                  className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                >
                  <option value="">Root Category (None)</option>
                  {categories
                    ?.filter((cat: any) => cat.id !== editingCategoryId) // prevent self-referencing hierarchy
                    .map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Description</label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3] block">Category Image</label>
                <div className="flex items-center gap-4">
                  {formState.image ? (
                    <div className="relative h-16 w-16 border border-[#26221f] rounded-lg overflow-hidden">
                      <img src={formState.image} alt="Upload preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, image: null }))}
                        className="absolute top-1 right-1 bg-red-600/85 hover:bg-red-700 text-white rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-16 w-16 border border-dashed border-[#26221f] hover:border-accent rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin text-accent" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-[#7d7a77] mb-0.5" />
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#7d7a77]">Upload</span>
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
                  <span className="text-[10px] text-[#7d7a77]">Recommended resolution: square webp (800x800)</span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formState.active}
                  onChange={(e) => setFormState((p) => ({ ...p, active: e.target.checked }))}
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
                  {editingCategoryId ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
