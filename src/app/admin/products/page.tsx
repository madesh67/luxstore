/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";


interface ImageInput {
  imageUrl: string;
  altText: string;
  displayOrder: number;
}

interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  sku: string;
  categoryId: string | null;
  brandId: string | null;
  price: number;
  compareAtPrice: number | null;
  featured: boolean;
  active: boolean;
  images: ImageInput[];
}


interface ProductImage {
  id?: string;
  imageUrl: string;
  altText?: string | null;
  displayOrder: number;
}

interface ProductCategory {
  id: string;
  name: string;
}

interface ProductBrand {
  id: string;
  name: string;
}

interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  featured: boolean;
  active: boolean;
  categoryId: string | null;
  brandId: string | null;
  images: ProductImage[];
  category?: ProductCategory | null;
  brand?: ProductBrand | null;
  inventory?: ProductInventory | null;
}


const initialFormState: ProductFormState = {
  name: "",
  shortDescription: "",
  description: "",
  sku: "",
  categoryId: null,
  brandId: null,
  price: 0,
  compareAtPrice: null,
  featured: false,
  active: true,
  images: [],
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState<ProductFormState>(initialFormState);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Queries
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: async () => {
      const res = await fetch(`/api/admin/products?page=${page}&limit=10&search=${search}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const payload = await res.json();
      return payload.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const payload = await res.json();
      return payload.data.categories;
    },
  });

  const { data: brandsData } = useQuery({
    queryKey: ["admin-brands-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) throw new Error("Failed to fetch brands");
      const payload = await res.json();
      return payload.data.brands;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormState) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error?.message || "Failed to create product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormState }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error?.message || "Failed to update product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const openCreateModal = () => {
    setEditingProductId(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormState({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      sku: product.sku,
      categoryId: product.categoryId || "",
      brandId: product.brandId || "",
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      featured: product.featured,
      active: product.active,
      images: product.images.map((img: ProductImage) => ({
        imageUrl: img.imageUrl,
        altText: img.altText || "",
        displayOrder: img.displayOrder,
      })),
    });
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setFormState(initialFormState);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      setFormState((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            imageUrl: data.data.secureUrl,
            altText: file.name.split(".")[0],
            displayOrder: prev.images.length,
          },
        ],
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formState.images.length === 0) {
      alert("At least one product image is required.");
      return;
    }

    const payload = {
      ...formState,
      categoryId: formState.categoryId || null,
      brandId: formState.brandId || null,
    };

    if (editingProductId) {
      updateMutation.mutate({ id: editingProductId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to archive/delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-foreground">Product Catalog Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage, details modification, image optimization, and catalog updates.</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-2">
        <Search className="h-4.5 w-4.5 text-muted-foreground/80" />
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-transparent border-0 outline-none text-xs text-foreground placeholder-[#7d7a77] w-full"
        />
      </div>

      {/* Products Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">
                <th className="p-4">SKU</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {productsLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
                    Fetching Catalog Items...
                  </td>
                </tr>
              ) : !productsData?.products || productsData.products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground/80 uppercase tracking-widest">
                    No catalog items found
                  </td>
                </tr>
              ) : (
                productsData.products.map((p: Product) => (

                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">{p.sku}</td>
                    <td className="p-4 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] && (
                          <img
                            src={p.images[0].imageUrl}
                            alt={p.name}
                            className="h-10 w-10 object-cover rounded-lg border border-border"
                          />
                        )}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.category?.name || "-"}</td>
                    <td className="p-4 text-muted-foreground">{p.brand?.name || "-"}</td>
                    <td className="p-4 font-semibold text-foreground">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className="p-4 text-center">
                      {p.featured ? (
                        <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        p.active
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                          : "bg-red-950/40 text-red-400 border border-red-900/30"
                      }`}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openEditModal(p)}
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 md:h-8 md:w-8 text-muted-foreground hover:text-foreground flex items-center justify-center"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(p.id)}
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

        {/* Pagination */}
        {productsData && productsData.totalPages > 1 && (
          <div className="h-16 flex items-center justify-between px-6 border-t border-border">
            <span className="text-xs text-muted-foreground/80">
              Page {productsData.page} of {productsData.totalPages}
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
                onClick={() => setPage((p) => Math.min(productsData.totalPages, p + 1))}
                disabled={page === productsData.totalPages}
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                {editingProductId ? "Modify Product Details" : "Create New Product Catalog Entry"}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    required
                    value={formState.sku}
                    onChange={(e) => setFormState((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none font-mono"
                  />
                </div>
              </div>

              {/* Price fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retail Price (INR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={(e) => setFormState((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Compare At Price (INR - Optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.compareAtPrice || ""}
                    onChange={(e) => setFormState((p) => ({ ...p, compareAtPrice: parseFloat(e.target.value) || null }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>
              </div>

              {/* Category & Brand dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select
                    value={formState.categoryId ?? ""}
                    onChange={(e) => setFormState((p) => ({ ...p, categoryId: e.target.value || null }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  >
                    <option value="">Select Category</option>
                    {categoriesData?.map((c: ProductCategory) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Brand</label>
                  <select
                    value={formState.brandId ?? ""}
                    onChange={(e) => setFormState((p) => ({ ...p, brandId: e.target.value || null }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                  >
                    <option value="">Select Brand</option>
                    {brandsData?.map((b: ProductBrand) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>


              {/* Short Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Short Summary (Teaser)</label>
                <textarea
                  required
                  rows={2}
                  value={formState.shortDescription}
                  onChange={(e) => setFormState((p) => ({ ...p, shortDescription: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                />
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={formState.description}
                  onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-accent outline-none"
                />
              </div>

              {/* Status toggles */}
              <div className="flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.featured}
                    onChange={(e) => setFormState((p) => ({ ...p, featured: e.target.checked }))}
                    className="rounded border-border bg-background text-accent focus:ring-0"
                  />
                  <span className="text-xs text-muted-foreground">Promote as Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={(e) => setFormState((p) => ({ ...p, active: e.target.checked }))}
                    className="rounded border-border bg-background text-accent focus:ring-0"
                  />
                  <span className="text-xs text-muted-foreground">Set Active Status</span>
                </label>
              </div>

              {/* Image Manager */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Product Media</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formState.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square border border-border bg-background rounded-lg overflow-hidden group">
                      <img src={img.imageUrl} alt={img.altText} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 bg-red-600/85 hover:bg-red-700 text-white rounded-full p-1 shadow transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border border-dashed border-border hover:border-accent bg-background/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground/80 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Upload Image</span>
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
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {editingProductId ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
