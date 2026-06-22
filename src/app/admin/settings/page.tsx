"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const SETTINGS_TABS = [
  { id: "general", label: "General Store" },
  { id: "payments", label: "Payments Flow" },
  { id: "shipping", label: "Shipping Calculations" },
  { id: "taxes", label: "Tax Policies" },
  { id: "emails", label: "Email Triggers" },
  { id: "seo", label: "SEO Defaults" },
  { id: "branding", label: "Visual Branding" },
  { id: "security", label: "Console Security" },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("general");
  const [settingsState, setSettingsState] = React.useState<Record<string, string>>({});

  // Queries
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings-map"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch store configurations");
      const data = await res.json();
      return data.data; // key-value mapping
    },
  });

  React.useEffect(() => {
    if (settingsData) {
      setSettingsState(settingsData);
    }
  }, [settingsData]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, { value: string; group: string }>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings modifications");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings-map"] });
      alert("Settings saved successfully.");
    },
  });

  const handleChange = (key: string, value: string) => {
    setSettingsState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Map state to payload with appropriate groups
    const payload: Record<string, { value: string; group: string }> = {};

    const groupMapping: Record<string, string> = {
      // General
      STORE_NAME: "GENERAL",
      STORE_EMAIL: "GENERAL",
      STORE_PHONE: "GENERAL",
      STORE_CURRENCY: "GENERAL",
      // Payments
      STRIPE_PUBLISHABLE_KEY: "PAYMENTS",
      STRIPE_SECRET_KEY: "PAYMENTS",
      PAYMENT_FLOW_MODE: "PAYMENTS",
      // Shipping
      FREE_SHIPPING_THRESHOLD: "SHIPPING",
      DEFAULT_SHIPPING_COST: "SHIPPING",
      // Taxes
      DEFAULT_TAX_RATE: "TAXES",
      TAX_CALCULATION_MODE: "TAXES",
      // Emails
      SMTP_HOST: "EMAILS",
      SMTP_PORT: "EMAILS",
      SYSTEM_EMAIL_SENDER: "EMAILS",
      // SEO
      DEFAULT_SEO_TITLE: "SEO",
      DEFAULT_SEO_DESC: "SEO",
      GOOGLE_ANALYTICS_ID: "SEO",
      // Branding
      BRAND_ACCENT_COLOR: "BRANDING",
      BRAND_LOGO_URL: "BRANDING",
      // Security
      RATE_LIMIT_MAX: "SECURITY",
      SESSION_TIMEOUT: "SECURITY",
    };

    Object.entries(settingsState).forEach(([key, val]) => {
      const group = groupMapping[key] || "GENERAL";
      payload[key] = { value: val, group };
    });

    updateMutation.mutate(payload);
  };

  const getVal = (key: string, fallback = "") => {
    return settingsState[key] !== undefined ? settingsState[key] : fallback;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-7 w-7 animate-spin text-accent" />
          <p className="text-xs uppercase tracking-widest text-[#a8a6a3]">Loading Store Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider text-white">Store Configuration</h2>
          <p className="text-xs text-[#a8a6a3] mt-1">Configure global store rules, payments setup, taxes, and branding.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 flex flex-col gap-1.5 bg-[#12100f] border border-[#26221f] rounded-xl p-3">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-left text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow shadow-accent/15"
                  : "text-[#a8a6a3] hover:bg-[#1a1715] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panel Body */}
        <div className="lg:col-span-3 border border-[#26221f] bg-[#12100f] rounded-xl overflow-hidden flex flex-col min-h-[50vh]">
          {/* Tab Header title */}
          <div className="h-14 border-b border-[#26221f] px-6 flex items-center justify-between bg-[#171513]/40">
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              {SETTINGS_TABS.find((t) => t.id === activeTab)?.label} Settings Section
            </span>
          </div>

          {/* Form Body */}
          <div className="p-6 flex-1 space-y-6">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Store Name</label>
                    <input
                      type="text"
                      value={getVal("STORE_NAME", "LuxStore")}
                      onChange={(e) => handleChange("STORE_NAME", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Contact Support Email</label>
                    <input
                      type="email"
                      value={getVal("STORE_EMAIL", "support@luxstore.com")}
                      onChange={(e) => handleChange("STORE_EMAIL", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Store Telephone</label>
                    <input
                      type="text"
                      value={getVal("STORE_PHONE", "+91 98765 43210")}
                      onChange={(e) => handleChange("STORE_PHONE", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Store Currency Code</label>
                    <input
                      type="text"
                      value={getVal("STORE_CURRENCY", "INR")}
                      onChange={(e) => handleChange("STORE_CURRENCY", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Stripe Publishable Key</label>
                  <input
                    type="text"
                    value={getVal("STRIPE_PUBLISHABLE_KEY", "")}
                    onChange={(e) => handleChange("STRIPE_PUBLISHABLE_KEY", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Stripe Secret API Key</label>
                  <input
                    type="password"
                    value={getVal("STRIPE_SECRET_KEY", "")}
                    onChange={(e) => handleChange("STRIPE_SECRET_KEY", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Payment Flow Mode</label>
                  <select
                    value={getVal("PAYMENT_FLOW_MODE", "TEST")}
                    onChange={(e) => handleChange("PAYMENT_FLOW_MODE", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                  >
                    <option value="TEST">Sandbox Test mode</option>
                    <option value="LIVE">Production Live mode</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Free Shipping Threshold (INR)</label>
                    <input
                      type="number"
                      value={getVal("FREE_SHIPPING_THRESHOLD", "10000")}
                      onChange={(e) => handleChange("FREE_SHIPPING_THRESHOLD", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Base Shipping Cost (INR)</label>
                    <input
                      type="number"
                      value={getVal("DEFAULT_SHIPPING_COST", "350")}
                      onChange={(e) => handleChange("DEFAULT_SHIPPING_COST", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "taxes" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={getVal("DEFAULT_TAX_RATE", "18.00")}
                      onChange={(e) => handleChange("DEFAULT_TAX_RATE", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Tax Application Mode</label>
                    <select
                      value={getVal("TAX_CALCULATION_MODE", "EXCLUSIVE")}
                      onChange={(e) => handleChange("TAX_CALCULATION_MODE", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    >
                      <option value="EXCLUSIVE">Exclusive Tax (Added at checkout)</option>
                      <option value="INCLUSIVE">Inclusive Tax (Prices already contain tax)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "emails" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">SMTP Host Name</label>
                    <input
                      type="text"
                      value={getVal("SMTP_HOST", "smtp.resend.com")}
                      onChange={(e) => handleChange("SMTP_HOST", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">SMTP Host Port</label>
                    <input
                      type="number"
                      value={getVal("SMTP_PORT", "465")}
                      onChange={(e) => handleChange("SMTP_PORT", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">System Sender Email address</label>
                  <input
                    type="email"
                    value={getVal("SYSTEM_EMAIL_SENDER", "notifications@luxstore.com")}
                    onChange={(e) => handleChange("SYSTEM_EMAIL_SENDER", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Default Title Tag</label>
                  <input
                    type="text"
                    value={getVal("DEFAULT_SEO_TITLE", "LuxStore | Premium Timeless Accessories")}
                    onChange={(e) => handleChange("DEFAULT_SEO_TITLE", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Default Meta Description</label>
                  <textarea
                    rows={3}
                    value={getVal("DEFAULT_SEO_DESC", "Premium timeless bags, glasses and accessories crafted under atelier care.")}
                    onChange={(e) => handleChange("DEFAULT_SEO_DESC", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Google Analytics ID (GTAG)</label>
                  <input
                    type="text"
                    value={getVal("GOOGLE_ANALYTICS_ID", "G-XXXXXXXXXX")}
                    onChange={(e) => handleChange("GOOGLE_ANALYTICS_ID", e.target.value)}
                    className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Accent Theme Color (Hex)</label>
                    <input
                      type="text"
                      value={getVal("BRAND_ACCENT_COLOR", "#d4af37")}
                      onChange={(e) => handleChange("BRAND_ACCENT_COLOR", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Store Logo CDN URL</label>
                    <input
                      type="text"
                      value={getVal("BRAND_LOGO_URL", "")}
                      onChange={(e) => handleChange("BRAND_LOGO_URL", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Rate Limit Max Requests (per minute)</label>
                    <input
                      type="number"
                      value={getVal("RATE_LIMIT_MAX", "100")}
                      onChange={(e) => handleChange("RATE_LIMIT_MAX", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#a8a6a3]">Session Timeout Limit (minutes)</label>
                    <input
                      type="number"
                      value={getVal("SESSION_TIMEOUT", "60")}
                      onChange={(e) => handleChange("SESSION_TIMEOUT", e.target.value)}
                      className="w-full bg-[#1c1a17] border border-[#26221f] rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-900/30 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <p className="text-[11px] text-emerald-300">All administrative operations log full trace audits automatically to satisfy HIPAA and SOC2 logging standards.</p>
                </div>
              </div>
            )}
          </div>

          {/* Tab Footer actions */}
          <div className="h-16 border-t border-[#26221f] px-6 flex items-center justify-end gap-3 bg-[#171513]/25">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-widest uppercase gap-2 py-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Configurations
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
