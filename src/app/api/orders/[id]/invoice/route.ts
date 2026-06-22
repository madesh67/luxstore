import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { OrderService } from "@/services/order.service";
import { InvoiceService } from "@/services/invoice.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to download invoice", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const order = await OrderService.getCustomerOrderDetails(id, user.userId);
    
    const html = InvoiceService.generateInvoiceHtml(order);
    const filename = InvoiceService.getInvoiceFilename(order.orderNumber);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
