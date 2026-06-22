import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  newCustomers: number;
  activeCustomers: number;
  lowStockProducts: number;
  pendingOrders: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  total: unknown;
  status: OrderStatus;
  email: string;
  createdAt: Date;
}

export interface TopProduct {
  productId: string | null;
  name: string;
  salesCount: number;
}

export interface RecentCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface InventoryAlert {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
}

export const AdminDashboardService = {
  /**
   * Aggregate all metrics for the Admin dashboard summary.
   */
  async getDashboardSummary(): Promise<{
    kpis: DashboardMetrics;
    recentOrders: RecentOrder[];
    topProducts: TopProduct[];
    recentCustomers: RecentCustomer[];
    inventoryAlerts: InventoryAlert[];
  }> {

    const successStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.PACKED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // 1. Total Revenue
    const revenueAgg = await prisma.order.aggregate({
      where: {
        status: { in: successStatuses },
      },
      _sum: {
        total: true,
      },
    });
    const totalRevenue = Number(revenueAgg._sum.total?.toString() || "0");

    // 2. Total Orders
    const totalOrders = await prisma.order.count();

    // 3. Average Order Value
    const successfulOrdersCount = await prisma.order.count({
      where: { status: { in: successStatuses } },
    });
    const averageOrderValue = successfulOrdersCount > 0 ? totalRevenue / successfulOrdersCount : 0;

    // 4. Conversion Rate (PAID checkout sessions / Total checkout sessions)
    const totalSessions = await prisma.checkoutSession.count();
    const paidSessions = await prisma.checkoutSession.count({
      where: { paymentStatus: "PAID" },
    });
    const conversionRate = totalSessions > 0 ? (paidSessions / totalSessions) * 100 : 0;

    // 5. New Customers (Users signed up in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        role: "CUSTOMER",
      },
    });

    // 6. Active Customers (Users with at least one order placement)
    const activeCustomersAgg = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null },
      },
    });
    const activeCustomers = activeCustomersAgg ? activeCustomersAgg.length : 0;

    // 7. Low Stock Products
    const lowStockProducts = await prisma.inventory.count({
      where: {
        quantity: {
          lte: prisma.inventory.fields.lowStockThreshold,
        },
      },
    });

    // 8. Pending Orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: { in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
      },
    });

    // Recent Orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        email: true,
        createdAt: true,
      },
    });

    // Top Products (by quantity ordered)
    const orderItemsAgg = await prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        order: {
          status: { in: successStatuses },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topProducts = (orderItemsAgg || []).map((item) => ({
      productId: item.productId,
      name: item.productName,
      salesCount: item._sum.quantity || 0,
    }));

    // Recent Customers
    const recentCustomers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Inventory Alerts
    const inventoryAlerts = await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.lowStockThreshold,
        },
      },
      take: 5,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    return {
      kpis: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        newCustomers,
        activeCustomers,
        lowStockProducts,
        pendingOrders,
      },
      recentOrders: recentOrders || [],
      topProducts,
      recentCustomers: recentCustomers || [],
      inventoryAlerts: (inventoryAlerts || []).map((item) => ({
        id: item.id,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        threshold: item.lowStockThreshold,
      })),
    };
  },

  /**
   * Detailed business reports and analytics trend lines.
   */
  async getAnalyticsData(dateRange?: { start: Date; end: Date }): Promise<{
    revenueTrends: { date: string; revenue: number; orders: number }[];
    customerGrowth: { date: string; count: number }[];
    categoryShares: { category: string; value: number }[];
    brandShares: { brand: string; value: number }[];
  }> {
    const start = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = dateRange?.end || new Date();

    const successStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.PACKED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // Query orders in range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: successStatuses },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group orders and revenue by date string (YYYY-MM-DD)
    const trendsMap: Record<string, { revenue: number; orders: number }> = {};
    const iter = new Date(start);
    while (iter <= end) {
      const dStr = iter.toISOString().split("T")[0];
      trendsMap[dStr] = { revenue: 0, orders: 0 };
      iter.setDate(iter.getDate() + 1);
    }

    orders.forEach((o) => {
      const dStr = o.createdAt.toISOString().split("T")[0];
      if (trendsMap[dStr]) {
        trendsMap[dStr].revenue += Number(o.total.toString());
        trendsMap[dStr].orders += 1;
      }
    });

    const revenueTrends = Object.entries(trendsMap).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      orders: val.orders,
    }));

    // Customer Growth
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        role: "CUSTOMER",
      },
      select: { createdAt: true },
    });

    const growthMap: Record<string, number> = {};
    const iter2 = new Date(start);
    while (iter2 <= end) {
      const dStr = iter2.toISOString().split("T")[0];
      growthMap[dStr] = 0;
      iter2.setDate(iter2.getDate() + 1);
    }

    users.forEach((u) => {
      const dStr = u.createdAt.toISOString().split("T")[0];
      if (growthMap[dStr] !== undefined) {
        growthMap[dStr] += 1;
      }
    });

    const customerGrowth = Object.entries(growthMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Top Categories shares
    const categorySharesData = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: { in: successStatuses },
          createdAt: { gte: start, lte: end },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Fetch details to map back categories
    const categoriesMap: Record<string, number> = {};
    for (const c of categorySharesData) {
      if (c.productId) {
        const prod = await prisma.product.findUnique({
          where: { id: c.productId },
          include: { category: true },
        });
        if (prod?.category) {
          categoriesMap[prod.category.name] = (categoriesMap[prod.category.name] || 0) + (c._sum.quantity || 0);
        }
      }
    }

    const categoryShares = Object.entries(categoriesMap).map(([category, value]) => ({
      category,
      value,
    }));

    // Top Brands shares
    const brandMap: Record<string, number> = {};
    for (const c of categorySharesData) {
      if (c.productId) {
        const prod = await prisma.product.findUnique({
          where: { id: c.productId },
          include: { brand: true },
        });
        if (prod?.brand) {
          brandMap[prod.brand.name] = (brandMap[prod.brand.name] || 0) + (c._sum.quantity || 0);
        }
      }
    }

    const brandShares = Object.entries(brandMap).map(([brand, value]) => ({
      brand,
      value,
    }));

    return {
      revenueTrends,
      customerGrowth,
      categoryShares,
      brandShares,
    };
  },
};
