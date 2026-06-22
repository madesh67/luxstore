import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales"; // sales, customers, products, inventory, coupons
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const format = searchParams.get("format") || "json"; // json, csv

    const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDateStr ? new Date(endDateStr) : new Date();

    let data: string[][] = [];
    let headers: string[] = [];


    if (type === "sales" || type === "revenue") {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          orderNumber: true,
          createdAt: true,
          email: true,
          status: true,
          subtotal: true,
          discount: true,
          shippingCost: true,
          taxCost: true,
          total: true,
        },
        orderBy: { createdAt: "desc" },
      });

      headers = ["Order Number", "Date", "Customer Email", "Status", "Subtotal", "Discount", "Shipping Cost", "Tax Cost", "Total"];
      data = orders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.email,
        o.status,
        o.subtotal.toString(),
        o.discount.toString(),
        o.shippingCost.toString(),
        o.taxCost.toString(),
        o.total.toString(),
      ]);
    } else if (type === "customers") {
      const customers = await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: start, lte: end },
        },
        include: {
          orders: {
            where: {
              status: {
                in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
              },
            },
            select: {
              total: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      headers = ["Customer ID", "First Name", "Last Name", "Email", "Sign Up Date", "Orders Placed", "Total Spend"];
      data = customers.map((c) => {
        const orderCount = c.orders.length;
        const totalSpend = c.orders.reduce((sum, o) => sum + Number(o.total.toString()), 0);
        return [
          c.id,
          c.firstName,
          c.lastName,
          c.email,
          c.createdAt.toISOString(),
          orderCount.toString(),
          totalSpend.toFixed(2),
        ];
      });
    } else if (type === "products") {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          category: true,
          brand: true,
          inventory: true,
          orderItems: {
            where: {
              order: {
                status: {
                  in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
                },
                createdAt: { gte: start, lte: end },
              },
            },
            select: {
              quantity: true,
              price: true,
            },
          },
        },
      });

      headers = ["Product SKU", "Product Name", "Category", "Brand", "Price", "Current Stock", "Units Sold", "Revenue Contribution"];
      data = products.map((p) => {
        const unitsSold = p.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const revenue = p.orderItems.reduce((sum, item) => sum + item.quantity * Number(item.price.toString()), 0);
        return [
          p.sku,
          p.name,
          p.category?.name || "None",
          p.brand?.name || "None",
          p.price.toString(),
          p.inventory?.quantity.toString() || "0",
          unitsSold.toString(),
          revenue.toFixed(2),
        ];
      });
    } else if (type === "inventory") {
      const inventory = await prisma.inventory.findMany({
        include: {
          product: {
            select: {
              sku: true,
              name: true,
            },
          },
        },
      });

      headers = ["Inventory ID", "SKU", "Product Name", "Current Stock", "Reserved", "Available", "Incoming", "Low Threshold", "Status"];
      data = inventory.map((i) => {
        let status = "IN_STOCK";
        if (i.quantity <= 0) {
          status = "OUT_OF_STOCK";
        } else if (i.quantity <= i.lowStockThreshold) {
          status = "LOW_STOCK";
        }

        return [
          i.id,
          i.product.sku,
          i.product.name,
          i.quantity.toString(),
          i.reserved.toString(),
          i.available.toString(),
          i.incoming.toString(),
          i.lowStockThreshold.toString(),
          status,
        ];
      });
    } else if (type === "coupons") {
      const coupons = await prisma.coupon.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          usages: {
            where: {
              createdAt: { gte: start, lte: end },
            },
          },
        },
      });

      headers = ["Coupon Code", "Discount Type", "Value", "Usage Count", "Active", "Start Date", "End Date", "Min Order Value"];
      data = coupons.map((c) => [
        c.code,
        c.discountType,
        c.value.toString(),
        c.usageCount.toString(),
        c.isActive ? "Yes" : "No",
        c.startDate.toISOString(),
        c.endDate.toISOString(),
        c.minOrderValue ? c.minOrderValue.toString() : "None",
      ]);
    }

    if (format === "csv") {
      const csvContent = [
        headers.join(","),
        ...data.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${type}_report_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.csv`,
        },
      });
    }

    // Default returns JSON
    return new NextResponse(
      JSON.stringify({
        success: true,
        reportType: type,
        dateRange: { start, end },
        headers,
        rows: data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
