"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { TimelineType } from "@/hooks/use-orders";

interface OrderTimelineProps {
  timeline: TimelineType[] | undefined;
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-6 text-sm font-light text-muted-foreground">
        Timeline details are not yet available for this order.
      </div>
    );
  }

  // Sort timeline chronologically descending
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="relative border-l border-border pl-6 ml-3 space-y-8 py-2">
      {sortedTimeline.map((event, idx) => {
        const isLatest = idx === 0;
        const eventDate = new Date(event.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={event.id} className="relative group">
            {/* Timeline Dot */}
            <span className={`absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border bg-background transition-colors duration-300 ${
              isLatest
                ? "border-accent text-accent scale-110 shadow-sm"
                : "border-border text-muted-foreground"
            }`}>
              {isLatest ? (
                <CheckCircle2 className="h-3 w-3 fill-accent/10" />
              ) : (
                <Clock className="h-2.5 w-2.5" />
              )}
            </span>

            {/* Content Card */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm uppercase border ${
                  isLatest
                    ? "text-accent bg-accent/5 border-accent/20"
                    : "text-muted-foreground bg-muted border-border"
                }`}>
                  {event.status.replace("_", " ")}
                </span>
                <span className="text-[10px] font-light text-muted-foreground">
                  {eventDate}
                </span>
              </div>
              <p className={`text-xs leading-relaxed font-light ${
                isLatest ? "text-foreground font-normal" : "text-muted-foreground"
              }`}>
                {event.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
