"use client";

import { Truck, ExternalLink, Calendar, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { ShipmentType } from "@/hooks/use-orders";

interface TrackingCardProps {
  shipment: ShipmentType | null | undefined;
}

export function TrackingCard({ shipment }: TrackingCardProps) {
  if (!shipment) {
    return (
      <div className="border border-border/80 rounded-sm p-6 text-center bg-card text-muted-foreground font-light text-xs py-8">
        Your shipment is currently being prepared. Curation & quality vetting are in progress. Tracking link will appear shortly.
      </div>
    );
  }

  const sortedEvents = [...shipment.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="border border-border bg-card rounded-sm overflow-hidden">
      <div className="p-6 border-b border-border/60 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-accent/10 text-accent rounded-sm flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-light">Carrier Information</h3>
            <p className="text-sm font-semibold text-foreground">
              {shipment.carrier || "Standard Delivery"} &mdash; {shipment.trackingNumber || "Preparing Dispatch"}
            </p>
          </div>
        </div>

        {shipment.trackingUrl && (
          <Button asChild variant="outline" size="sm" className="uppercase tracking-widest text-[9px] font-semibold h-9">
            <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              Track Package <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>

      <div className="p-6">
        <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-light mb-6">Delivery History</h4>

        {sortedEvents.length === 0 ? (
          <p className="text-xs font-light text-muted-foreground">Shipment details generated. Package awaiting carrier scan.</p>
        ) : (
          <div className="relative border-l border-border pl-5 ml-2 space-y-6">
            {sortedEvents.map((event, idx) => {
              const isLatest = idx === 0;
              const eventDate = new Date(event.timestamp).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={event.id} className="relative">
                  {/* Event Marker */}
                  <span className={`absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full border bg-background ${
                    isLatest ? "border-accent scale-110 shadow-sm" : "border-border"
                  }`}>
                    {isLatest && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />}
                  </span>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${isLatest ? "text-accent" : "text-muted-foreground"}`}>
                        {event.status}
                      </span>
                      <span className="text-[9px] font-light text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" /> {eventDate}
                      </span>
                    </div>
                    <p className={`text-xs font-light ${isLatest ? "text-foreground font-normal" : "text-muted-foreground"}`}>
                      {event.description}
                    </p>
                    {event.location && (
                      <p className="text-[10px] text-muted-foreground font-light flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5 text-accent" /> {event.location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
