/**
 * Analytics Foundation Event Tracker
 */
export type AnalyticsAction =
  | "AddToCart"
  | "RemoveFromCart"
  | "UpdateQuantity"
  | "AddToWishlist"
  | "RemoveFromWishlist";

export async function trackAnalyticsEvent(action: AnalyticsAction, details: Record<string, unknown>) {
  // 1. Log to console for development verification
  if (process.env.NODE_ENV === "development") {
    console.info(`📊 [Analytics Event] Action: ${action}`, details);
  }

  // 2. Dispatch event to the backend API to store in the DB for future reporting
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        details,
      }),
    });
  } catch (error) {
    console.error("⚠️ Failed to persist analytics event:", error);
  }
}
