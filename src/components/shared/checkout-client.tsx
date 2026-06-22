"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useUser } from "@/hooks/use-auth";
import { useAddresses } from "@/hooks/use-addresses";
import {
  useCreateCheckoutSession,
  useUpdateCheckoutStep,
  useShippingMethods,
  CheckoutSessionType,
} from "@/hooks/use-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "./container";
import { Loader2, CheckCircle2, ChevronRight, CreditCard, MapPin, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getStripe } from "@/lib/stripe-client";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "./stripe-payment-form";

type CheckoutStep = "address" | "shipping" | "review";

export function CheckoutClient() {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: cartData, isLoading: isCartLoading } = useCart();
  const { data: addressesData } = useAddresses();
  const { data: shippingMethodsData } = useShippingMethods();

  const createSessionMutation = useCreateCheckoutSession();
  const updateStepMutation = useUpdateCheckoutStep();

  const [step, setStep] = React.useState<CheckoutStep>("address");
  const [session, setSession] = React.useState<CheckoutSessionType | null>(null);
  
  // Stripe configuration
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [paymentTotal, setPaymentTotal] = React.useState<number>(0);

  // Address Step form state
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>("");
  const [showManualAddressForm, setShowManualAddressForm] = React.useState(true);
  const [addressForm, setAddressForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    addressType: "HOME" as "HOME" | "WORK" | "OTHER",
  });

  // Shipping selection state
  const [selectedShippingMethodId, setSelectedShippingMethodId] = React.useState<string>("");

  // Populate address form if user is logged in
  React.useEffect(() => {
    if (user) {
      setAddressForm((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Sync saved addresses and select default
  React.useEffect(() => {
    if (addressesData?.addresses && addressesData.addresses.length > 0) {
      const defaultAddr = addressesData.addresses.find((a) => a.isDefault);
      const selected = defaultAddr || addressesData.addresses[0];
      setSelectedAddressId(selected.id);
      setShowManualAddressForm(false);
    } else {
      setShowManualAddressForm(true);
    }
  }, [addressesData]);

  interface CartSnapshotItem {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    sku: string;
    imageUrl: string | null;
  }

  // A. Initialize Checkout Session on page mount
  React.useEffect(() => {
    if (!isCartLoading) {
      if (!cartData?.cart || cartData.cart.items.length === 0) {
        router.push("/cart");
        return;
      }

      createSessionMutation.mutate(
        { email: user?.email },
        {
          onSuccess: (data) => {
            setSession(data.session);
          },
          onError: () => {
            router.push("/cart");
          },
        }
      );
    }
  }, [cartData, isCartLoading, createSessionMutation, router, user?.email]);

  // If loading checkout setup or session
  const isLoadingSetup = isCartLoading || createSessionMutation.isPending || !session;

  if (isLoadingSetup) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Setting up checkout session...</span>
      </div>
    );
  }

  const items = session.cartSnapshot as unknown as CartSnapshotItem[];

  // B. Handle address submit
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetAddress: typeof addressForm;

    if (!showManualAddressForm && user && addressesData?.addresses) {
      const savedAddress = addressesData.addresses.find((a) => a.id === selectedAddressId);
      if (!savedAddress) return;

      const nameParts = savedAddress.fullName.split(" ");
      targetAddress = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "Guest",
        email: user.email,
        phoneNumber: savedAddress.phoneNumber,
        addressLine1: savedAddress.addressLine1,
        addressLine2: savedAddress.addressLine2 || "",
        city: savedAddress.city,
        state: savedAddress.state,
        postalCode: savedAddress.postalCode,
        country: savedAddress.country,
        addressType: (savedAddress.title as "HOME" | "WORK" | "OTHER") || "HOME",
      };
    } else {
      // Basic manual validations
      if (
        !addressForm.firstName ||
        !addressForm.lastName ||
        !addressForm.email ||
        !addressForm.phoneNumber ||
        !addressForm.addressLine1 ||
        !addressForm.city ||
        !addressForm.state ||
        !addressForm.postalCode
      ) {
        alert("Please fill in all required shipping address fields.");
        return;
      }
      targetAddress = addressForm;
    }

    updateStepMutation.mutate(
      {
        sessionId: session.id,
        step: "address",
        address: targetAddress,
      },
      {
        onSuccess: (data) => {
          if (data.session) {
            setSession(data.session);
            setStep("shipping");
          }
        },
        onError: (err) => {
          alert(err.message || "Failed to save address details");
        },
      }
    );
  };

  // C. Handle shipping submit
  const handleShippingSubmit = async () => {
    if (!selectedShippingMethodId) {
      alert("Please select a shipping carrier option.");
      return;
    }

    updateStepMutation.mutate(
      {
        sessionId: session.id,
        step: "shipping",
        shippingMethodId: selectedShippingMethodId,
      },
      {
        onSuccess: (data) => {
          if (data.session) {
            setSession(data.session);
            // Pre-fetch Stripe Payment intent right before review render
            triggerStripeIntent(data.session.id);
          }
        },
        onError: (err) => {
          alert(err.message || "Failed to set shipping option");
        },
      }
    );
  };

  // D. Create Stripe Intent
  const triggerStripeIntent = (sessId: string) => {
    updateStepMutation.mutate(
      {
        sessionId: sessId,
        step: "payment",
      },
      {
        onSuccess: (data) => {
          if (data.clientSecret && data.total) {
            setClientSecret(data.clientSecret);
            setPaymentTotal(data.total);
            setStep("review");
          }
        },
        onError: (err) => {
          alert(err.message || "Stripe gateway handshake failed");
        },
      }
    );
  };

  // E. Handle stripe order completion redirection
  const handlePaymentSuccess = (paymentIntentId: string) => {
    router.push(`/checkout/success?paymentIntentId=${paymentIntentId}`);
  };

  interface AddressSnapshotType {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: "HOME" | "WORK" | "OTHER";
  }

  const formattedAddress = session.addressSnapshot as unknown as AddressSnapshotType;

  return (
    <Container className="py-12 space-y-10 max-w-6xl animate-fade-in">
      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-4 max-w-md mx-auto border-b border-border/30 pb-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === "address" ? "bg-accent text-white" : "bg-primary/10 text-primary"}`}>1</span>
          <span className={step === "address" ? "text-accent" : "text-muted-foreground"}>Address</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === "shipping" ? "bg-accent text-white" : "bg-primary/10 text-primary"}`}>2</span>
          <span className={step === "shipping" ? "text-accent" : "text-muted-foreground"}>Shipping</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === "review" ? "bg-accent text-white" : "bg-primary/10 text-primary"}`}>3</span>
          <span className={step === "review" ? "text-accent" : "text-muted-foreground"}>Payment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Step Panels Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: ADDRESS */}
          {step === "address" && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] font-semibold text-accent uppercase flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Step 1 of 3
                </span>
                <h2 className="text-2xl font-display font-light uppercase tracking-wider text-foreground mt-1">
                  Shipping Address
                </h2>
              </div>

              {user && addressesData?.addresses && addressesData.addresses.length > 0 && (
                <div className="space-y-4 p-4 border border-border/40 bg-secondary/15 rounded-sm">
                  <Label className="text-[10px] uppercase tracking-widest font-bold">Choose a Saved Address</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {addressesData.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setShowManualAddressForm(false);
                        }}
                        className={`p-4 border rounded-sm cursor-pointer transition-all flex justify-between items-center ${selectedAddressId === addr.id ? "border-accent bg-accent/5" : "border-border/40 bg-card hover:border-accent/40"}`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase">{addr.fullName} <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded ml-2 font-semibold tracking-wider">{addr.title || "HOME"}</span></p>
                          <p className="text-xs text-muted-foreground font-light">{addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}{addr.city}, {addr.state} - {addr.postalCode}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{addr.phoneNumber}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <CheckCircle2 className="h-4.5 w-4.5 text-accent" />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualAddressForm(true)}
                    className="text-xs text-accent hover:underline font-semibold uppercase tracking-wider pt-2"
                  >
                    + Ship to a different address
                  </button>
                </div>
              )}

              {showManualAddressForm && (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  {user && addressesData?.addresses && addressesData.addresses.length > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">New Shipping Address</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualAddressForm(false);
                          const first = addressesData.addresses[0];
                          if (first) setSelectedAddressId(first.id);
                        }}
                        className="text-xs text-accent hover:underline uppercase tracking-wider"
                      >
                        Use Saved Address
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        required
                        value={addressForm.firstName}
                        onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        required
                        value={addressForm.lastName}
                        onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={addressForm.email}
                        onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={addressForm.phoneNumber}
                        onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      required
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={addressForm.addressLine2}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        required
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        readOnly
                        value={addressForm.country}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="addressType">Location Label</Label>
                      <select
                        id="addressType"
                        value={addressForm.addressType}
                        onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value as "HOME" | "WORK" | "OTHER" })}
                        className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateStepMutation.isPending}
                    variant="gold"
                    className="w-full h-12 uppercase tracking-widest text-xs font-bold"
                  >
                    {updateStepMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Continue to Shipping Methods"
                    )}
                  </Button>
                </form>
              )}

              {!showManualAddressForm && (
                <Button
                  onClick={handleAddressSubmit}
                  disabled={updateStepMutation.isPending}
                  variant="gold"
                  className="w-full h-12 uppercase tracking-widest text-xs font-bold"
                >
                  {updateStepMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Continue to Shipping Methods"
                  )}
                </Button>
              )}
            </div>
          )}

          {/* STEP 2: SHIPPING METHODS */}
          {step === "shipping" && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] font-semibold text-accent uppercase flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Step 2 of 3
                </span>
                <h2 className="text-2xl font-display font-light uppercase tracking-wider text-foreground mt-1">
                  Shipping Methods
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {shippingMethodsData?.methods.map((method) => {
                  const calculatedSurcharge = method.slug === "standard" && session.subtotal >= 10000 ? 0 : method.baseCost;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedShippingMethodId(method.id)}
                      className={`p-5 border rounded-sm cursor-pointer transition-all flex justify-between items-center ${selectedShippingMethodId === method.id ? "border-accent bg-accent/5" : "border-border/40 bg-card hover:border-accent/40"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-wider">{method.name}</p>
                        <p className="text-xs text-muted-foreground font-light">Estimated Delivery: {method.estimatedDays}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-foreground">
                          {calculatedSurcharge === 0 ? "FREE" : formatPrice(Number(calculatedSurcharge))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/30">
                <Button
                  onClick={() => setStep("address")}
                  variant="outline"
                  className="w-1/3 h-12 uppercase tracking-widest text-[10px] font-bold"
                >
                  Back to Address
                </Button>
                <Button
                  onClick={handleShippingSubmit}
                  disabled={updateStepMutation.isPending || !selectedShippingMethodId}
                  variant="gold"
                  className="w-2/3 h-12 uppercase tracking-widest text-xs font-bold"
                >
                  {updateStepMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & PAY */}
          {step === "review" && clientSecret && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] font-semibold text-accent uppercase flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Step 3 of 3
                </span>
                <h2 className="text-2xl font-display font-light uppercase tracking-wider text-foreground mt-1">
                  Authorize Payment
                </h2>
              </div>

              {/* Immutable snapshotted details summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-border/40 bg-secondary/15 rounded-sm text-xs">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Shipping Address</p>
                  <p className="font-semibold text-foreground uppercase">
                    {formattedAddress.firstName} {formattedAddress.lastName}
                  </p>
                  <p className="text-muted-foreground font-light">
                    {formattedAddress.addressLine1}, {formattedAddress.addressLine2 && `${formattedAddress.addressLine2}, `}
                    {formattedAddress.city}, {formattedAddress.state} - {formattedAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground font-light">Contact: {formattedAddress.phoneNumber}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Selected Carrier</p>
                  <p className="font-semibold text-foreground uppercase">
                    {session.shippingMethod?.name || "Standard Shipping"}
                  </p>
                  <p className="text-muted-foreground font-light">
                    Cost: {Number(session.shippingCost) === 0 ? "FREE" : formatPrice(Number(session.shippingCost))}
                  </p>
                  <p className="text-[10px] text-accent font-semibold uppercase tracking-wider cursor-pointer" onClick={() => setStep("shipping")}>
                    Edit Shipping Method
                  </p>
                </div>
              </div>

              {/* Stripe Credit Card Form wrapper */}
              <Elements stripe={getStripe()}>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  total={paymentTotal}
                  email={session.email || "guest@luxstore.in"}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>

              <button
                onClick={() => setStep("shipping")}
                className="text-xs uppercase tracking-widest font-semibold hover:text-accent flex items-center gap-1 mx-auto mt-4 text-muted-foreground"
              >
                Go back to Shipping Choice
              </button>
            </div>
          )}
        </div>

        {/* Pricing Summary Sidepanel */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="border border-border/40 p-6 rounded-sm bg-card space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-4 border-b border-border/30">
              Selection Summary
            </h3>

            {/* List mini products */}
            <div className="divide-y divide-border/20 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0 text-xs">
                  <div className="h-12 w-12 bg-secondary/20 border border-border/30 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=100"} alt={item.name} className="object-cover h-full w-full" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-display font-medium text-foreground uppercase truncate">{item.name}</h4>
                    <p className="text-muted-foreground/60 text-[10px] uppercase font-semibold">SKU: {item.sku}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Quantity: {item.quantity}</p>
                  </div>
                  <div className="font-mono text-foreground font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals table */}
            <div className="border-t border-border/30 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground font-light">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(Number(session.subtotal))}</span>
              </div>
              
              {step !== "address" && (
                <>
                  <div className="flex justify-between text-muted-foreground font-light">
                    <span>Shipping</span>
                    <span className="font-mono">
                      {Number(session.shippingCost) === 0 ? "FREE" : formatPrice(Number(session.shippingCost || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-light">
                    <span>Estimated Tax</span>
                    <span className="font-mono">{formatPrice(Number(session.taxCost || 0))}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm font-semibold pt-3 border-t border-border/20 text-foreground">
                <span>Total Selection</span>
                <span className="font-mono text-accent text-base">
                  {step === "address" ? formatPrice(Number(session.subtotal)) : formatPrice(Number(session.total))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
