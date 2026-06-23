"use client";

import { Button } from "../ui/button";
import { FileDown, Loader2 } from "lucide-react";
import * as React from "react";

interface InvoiceDownloadButtonProps {
  orderId: string;
}

export function InvoiceDownloadButton({ orderId }: InvoiceDownloadButtonProps) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Let the browser handle the raw attachment stream
      window.location.href = `/api/orders/${orderId}/invoice`;
      
      // Delay disabling loading indicator briefly to match the download invocation
      setTimeout(() => setDownloading(false), 2000);
    } catch {
      setDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      disabled={downloading}
      className="uppercase tracking-widest text-[10px] font-semibold flex items-center gap-1.5 h-11 md:h-9 px-4 md:px-3"
    >
      {downloading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Downloading...
        </>
      ) : (
        <>
          <FileDown className="h-3.5 w-3.5 text-accent" /> Invoice
        </>
      )}
    </Button>
  );
}
