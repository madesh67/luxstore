"use client";

import * as React from "react";
import { useCreateReturnRequest, ReturnRequestType } from "@/hooks/use-orders";
import { ReturnStatus } from "@prisma/client";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Loader2, ShieldAlert, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ReturnRequestFormProps {
  orderId: string;
  orderNumber: string;
  returnRequest: ReturnRequestType | null | undefined;
  isReturnEligible: boolean;
}

const returnReasons = [
  { value: "DEFECTIVE", label: "Defective/Damaged product" },
  { value: "WRONG_ITEM", label: "Incorrect item received" },
  { value: "NOT_AS_DESCRIBED", label: "Item not as described" },
  { value: "OTHER", label: "Other reason" },
];

export function ReturnRequestForm({
  orderId,
  orderNumber,
  returnRequest,
  isReturnEligible,
}: ReturnRequestFormProps) {
  const createReturnMutation = useCreateReturnRequest();
  const [reason, setReason] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // If a return request already exists, render its current status
  if (returnRequest) {
    const isPending = returnRequest.status === ReturnStatus.PENDING;
    const isApproved = returnRequest.status === ReturnStatus.APPROVED;
    const isRejected = returnRequest.status === ReturnStatus.REJECTED;

    return (
      <div className="border border-border bg-card rounded-sm p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" /> Return Request Status
        </h3>

        <div className="flex items-center gap-2 py-2 border-b border-border/40">
          {isPending && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 px-2.5 py-1 rounded-sm uppercase">
              <AlertCircle className="h-3 w-3" /> Under Review
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-200/50 px-2.5 py-1 rounded-sm uppercase">
              <CheckCircle className="h-3 w-3" /> Return Approved
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200/50 px-2.5 py-1 rounded-sm uppercase">
              <XCircle className="h-3 w-3" /> Return Declined
            </span>
          )}
          <span className="text-[10px] text-muted-foreground font-light ml-auto">
            Requested on {new Date(returnRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        <div className="space-y-3 text-xs font-light">
          <div>
            <span className="font-semibold text-foreground uppercase tracking-widest text-[9px] block mb-1">Reason:</span>
            <p className="text-muted-foreground">{returnReasons.find(r => r.value === returnRequest.reason)?.label || returnRequest.reason}</p>
          </div>

          {returnRequest.customerNotes && (
            <div>
              <span className="font-semibold text-foreground uppercase tracking-widest text-[9px] block mb-1">Your notes:</span>
              <p className="text-muted-foreground p-3 bg-neutral-50 dark:bg-neutral-900 border border-border/50 rounded-sm italic">
                &ldquo;{returnRequest.customerNotes}&rdquo;
              </p>
            </div>
          )}

          {returnRequest.adminNotes && (
            <div className="pt-2 border-t border-dashed border-border/60">
              <span className="font-semibold text-accent uppercase tracking-widest text-[9px] block mb-1">Curation Team Response:</span>
              <p className="text-foreground p-3 bg-accent/5 border border-accent/20 rounded-sm font-normal">
                {returnRequest.adminNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If return request does not exist, but order is not eligible
  if (!isReturnEligible) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reason) {
      setErrorMsg("Please select a reason for the return.");
      return;
    }

    createReturnMutation.mutate(
      {
        orderId,
        reason,
        customerNotes: customerNotes || undefined,
      },
      {
        onError: (err) => {
          setErrorMsg(err.message || "Failed to submit return request");
        },
      }
    );
  };

  return (
    <div className="border border-border bg-card rounded-sm p-6 space-y-4">
      <div>
        <h3 className="text-xs uppercase tracking-widest text-foreground font-semibold">
          Request Return
        </h3>
        <p className="text-[11px] font-light text-muted-foreground mt-1 leading-relaxed">
          Order {orderNumber} is eligible for return under our 30-day return policy. Items must be unworn, undamaged, and complete with curation seals intact.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200/50 rounded-sm">
          {errorMsg}
        </div>
      )}

      {createReturnMutation.isSuccess && (
        <div className="p-3 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-200/50 rounded-sm">
          Return request submitted successfully. Our curation agents will review details.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-[10px] uppercase tracking-widest text-muted-foreground">Select Return Reason</Label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={createReturnMutation.isPending}
            className="w-full h-11 px-3 border border-input bg-background rounded-sm text-xs focus:ring-1 focus:ring-accent focus:border-accent outline-none appearance-none cursor-pointer"
          >
            <option value="">-- Select reason &mdash; click to expand --</option>
            {returnReasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerNotes" className="text-[10px] uppercase tracking-widest text-muted-foreground">Additional details & customer notes</Label>
          <textarea
            id="customerNotes"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            disabled={createReturnMutation.isPending}
            placeholder="Please specify any defects, size details, or remarks..."
            className="flex w-full rounded-sm border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 text-xs h-24 min-h-[90px] resize-none"
          />
        </div>

        <Button
          type="submit"
          variant="gold"
          className="w-full h-11 text-xs uppercase tracking-widest"
          disabled={createReturnMutation.isPending || createReturnMutation.isSuccess}
        >
          {createReturnMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "SUBMIT RETURN REQUEST"
          )}
        </Button>
      </form>
    </div>
  );
}
