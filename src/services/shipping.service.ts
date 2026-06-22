import { prisma } from "@/lib/prisma";

export const ShippingService = {
  async seedShippingMethods() {
    const count = await prisma.shippingMethod.count();
    if (count === 0) {
      await prisma.shippingMethod.createMany({
        data: [
          { name: "Standard Shipping", slug: "standard", baseCost: 150.00, estimatedDays: "3-5 business days", isActive: true },
          { name: "Express Shipping", slug: "express", baseCost: 350.00, estimatedDays: "1-2 business days", isActive: true },
          { name: "Priority Shipping", slug: "priority", baseCost: 750.00, estimatedDays: "Next business day", isActive: true },
        ],
      });
    }
  },

  async getActiveMethods() {
    await this.seedShippingMethods();
    return prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { baseCost: "asc" },
    });
  },

  async getMethodById(id: string) {
    await this.seedShippingMethods();
    return prisma.shippingMethod.findUnique({
      where: { id },
    });
  },

  async calculateCost(subtotal: number, methodSlug: string, destinationState: string, destinationCountry: string) {
    const methods = await this.getActiveMethods();
    const method = methods.find(m => m.slug === methodSlug);
    if (!method) {
      throw new Error(`Shipping method ${methodSlug} is invalid or inactive`);
    }

    let cost = Number(method.baseCost);

    // Free standard shipping on orders over ₹10,000
    if (methodSlug === "standard" && subtotal >= 10000) {
      return 0;
    }

    const upperCountry = destinationCountry.toUpperCase();
    const upperState = destinationState.toUpperCase();

    if (upperCountry !== "INDIA") {
      // International shipping premium
      cost += 1500.00;
    } else {
      // Remote regions in India (surcharge)
      const remoteStates = [
        "ANDAMAN AND NICOBAR ISLANDS", 
        "LAKSHADWEEP", 
        "JAMMU AND KASHMIR", 
        "ASSAM", 
        "MEGHALAYA", 
        "MANIPUR", 
        "MIZORAM", 
        "NAGALAND", 
        "TRIPURA", 
        "ARUNACHAL PRADESH", 
        "SIKKIM"
      ];
      if (remoteStates.includes(upperState)) {
        cost += 200.00;
      }
    }

    return cost;
  }
};
