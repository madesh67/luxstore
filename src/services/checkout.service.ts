import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CartService } from "./cart.service";
import { ShippingService } from "./shipping.service";
import { TaxService } from "./tax.service";
import { AppError } from "@/lib/error-handler";
import { addressSchema } from "@/schemas/address";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getStripeClient } from "@/lib/stripe";
import Stripe from "stripe";

const stripe = {
  get paymentIntents() {
    return getStripeClient().paymentIntents;
  }
} as unknown as Stripe;
const SESSION_EXPIRATION_MINUTES = 60;

export const CheckoutService = {
  /**
   * Helper to fetch checkout session and validate existence/expiration.
   */
  async getAndValidateSession(sessionId: string, userId: string | null, guestToken: string | null) {
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { shippingMethod: true },
    });

    if (!session) {
      throw new AppError("Checkout session not found", 404, "SESSION_NOT_FOUND");
    }

    // Validate ownership
    if (userId && session.userId !== userId) {
      throw new AppError("Unauthorized checkout session access", 403, "FORBIDDEN");
    }
    if (!userId && guestToken && session.guestToken !== guestToken) {
      throw new AppError("Unauthorized checkout session access", 403, "FORBIDDEN");
    }

    // Check expiration
    if (new Date() > new Date(session.expiresAt)) {
      throw new AppError("Checkout session has expired", 400, "SESSION_EXPIRED");
    }

    if (session.paymentStatus === "PAID") {
      throw new AppError("This checkout session has already been completed and paid", 400, "SESSION_ALREADY_PAID");
    }

    return session;
  },

  /**
   * 1. Initialize Checkout Session
   */
  async createSession(userId: string | null, guestToken: string | null, email?: string) {
    // A. Fetch current cart
    const cart = await CartService.getCart(userId, guestToken);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Your shopping bag is empty", 400, "EMPTY_CART");
    }

    // B. Validate inventory of all items
    for (const item of cart.items) {
      await CartService.validateProductAvailability(item.productId, item.quantity);
    }

    // C. Formulate items snapshot
    const cartSnapshot = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.product.price),
      name: item.product.name,
      sku: item.product.sku,
      imageUrl: item.product.images?.[0]?.imageUrl || null,
    }));

    const subtotal = cart.subtotal;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MINUTES * 60 * 1000);

    // Delete any active uncompleted sessions for this user/guest to prevent state pollution
    await prisma.checkoutSession.deleteMany({
      where: {
        OR: [
          { userId: userId || undefined },
          { guestToken: guestToken || undefined },
        ],
        paymentStatus: "PENDING",
      },
    });

    // D. Create new session
    return prisma.checkoutSession.create({
      data: {
        userId,
        guestToken,
        email: email || null,
        cartSnapshot,
        subtotal,
        total: subtotal, // Shipping and tax added dynamically in later steps
        expiresAt,
      },
    });
  },

  /**
   * 2. Set Shipping Address on Checkout Session
   */
  async updateAddress(
    sessionId: string,
    userId: string | null,
    guestToken: string | null,
    addressInput: {
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
  ) {
    const session = await this.getAndValidateSession(sessionId, userId, guestToken);
    
    // Parse using validator
    const validatedAddress = addressSchema.parse(addressInput);

    return prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        addressSnapshot: validatedAddress,
        email: validatedAddress.email || session.email || null,
      },
    });
  },

  /**
   * 3. Set Shipping Option
   */
  async updateShippingMethod(
    sessionId: string,
    userId: string | null,
    guestToken: string | null,
    shippingMethodId: string
  ) {
    const session = await this.getAndValidateSession(sessionId, userId, guestToken);

    if (!session.addressSnapshot) {
      throw new AppError("Shipping address must be entered before selecting shipping options", 400, "MISSING_ADDRESS");
    }

    const shippingMethod = await ShippingService.getMethodById(shippingMethodId);
    if (!shippingMethod || !shippingMethod.isActive) {
      throw new AppError("Invalid or inactive shipping option selected", 400, "INVALID_SHIPPING_METHOD");
    }

    const address = session.addressSnapshot as { state: string; country: string };
    const subtotal = Number(session.subtotal);

    // Calculate shipping & tax dynamically on the server
    const shippingCost = await ShippingService.calculateCost(
      subtotal,
      shippingMethod.slug,
      address.state,
      address.country
    );

    const taxCost = await TaxService.calculateTax(
      subtotal,
      address.state,
      address.country
    );

    const total = subtotal + shippingCost + taxCost;

    return prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        shippingMethodId,
        shippingCost,
        taxCost,
        total,
      },
      include: {
        shippingMethod: true,
      },
    });
  },

  /**
   * 4. Initialize Stripe Payment Intent
   */
  async createPaymentIntent(sessionId: string, userId: string | null, guestToken: string | null) {
    const session = await this.getAndValidateSession(sessionId, userId, guestToken);

    if (!session.addressSnapshot) {
      throw new AppError("Shipping address is missing", 400, "MISSING_ADDRESS");
    }

    if (!session.shippingMethodId) {
      throw new AppError("Shipping method is missing", 400, "MISSING_SHIPPING_METHOD");
    }

    // A. Verify inventory availability of all items one last time before payment
    const cartSnapshot = session.cartSnapshot as { productId: string; quantity: number; name: string; sku: string; price: number; imageUrl: string | null }[];
    for (const item of cartSnapshot) {
      await CartService.validateProductAvailability(item.productId, item.quantity);
    }

    // B. Re-calculate totals to ensure absolutely no tampering
    const subtotal = Number(session.subtotal);
    const shippingCost = Number(session.shippingCost);
    const taxCost = Number(session.taxCost);
    const total = subtotal + shippingCost + taxCost;

    // C. Initialize or retrieve PaymentIntent
    if (session.stripePaymentIntentId) {
      try {
        // If Payment Intent exists, update its amount to capture any selection changes
        const paymentIntent = await stripe.paymentIntents.update(session.stripePaymentIntentId, {
          amount: Math.round(total * 100), // convert to paise/cents
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          total,
        };
      } catch {
        // Fallback to creating a new one if error occurs
      }
    }

    // Create new Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "inr",
      metadata: {
        checkoutSessionId: session.id,
        userId: userId || "guest",
        guestToken: guestToken || "none",
        email: session.email || "unknown",
      },
    });

    // Update database
    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        total,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      total,
    };
  },

  /**
   * 5. Handle Payment Success & Create Order (Idempotent Webhook Target)
   */
  async handlePaymentSuccess(paymentIntentId: string) {
    // Idempotency: check if Order already exists for this paymentIntentId
    const existingOrder = await prisma.order.findFirst({
      where: { paymentIntentId },
      include: { items: true },
    });

    if (existingOrder) {
      return existingOrder;
    }

    // Execute order creation in a strict transaction
    return prisma.$transaction(async (tx) => {
      // 1. Locate checkout session
      const session = await tx.checkoutSession.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!session) {
        throw new Error(`Checkout session matching PaymentIntent ${paymentIntentId} not found`);
      }

      if (session.paymentStatus === "PAID") {
        throw new Error(`Checkout session ${session.id} is already marked as paid`);
      }

      const cartSnapshot = session.cartSnapshot as { productId: string; quantity: number; name: string; sku: string; price: number; imageUrl: string | null }[];

      // 2. Reduce inventory and double-check stock bounds
      for (const item of cartSnapshot) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`Stock runout for product: ${item.name}. Order cannot be processed.`);
        }

        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Create Order
      const orderNumber = `LUX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const order = await tx.order.create({
        data: {
          userId: session.userId || null,
          orderNumber,
          status: "PAID",
          email: session.email || "guest@luxstore.in",
          shippingAddressSnapshot: session.addressSnapshot as Prisma.InputJsonValue,
          shippingMethodId: session.shippingMethodId,
          subtotal: session.subtotal,
          shippingCost: session.shippingCost || 0.00,
          taxCost: session.taxCost || 0.00,
          total: session.total,
          paymentIntentId,
        },
      });

      // 4. Create OrderItems from snapshot
      for (const item of cartSnapshot) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.name,
            productSku: item.sku,
            productImage: item.imageUrl,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      // 5. Create PaymentTransaction log
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          stripePaymentIntentId: paymentIntentId,
          amount: session.total,
          currency: "INR",
          status: "SUCCESS",
        },
      });

      // 6. Update Checkout Session status
      await tx.checkoutSession.update({
        where: { id: session.id },
        data: { paymentStatus: "PAID" },
      });

      // 7. Clear User/Guest Cart
      const cart = session.userId 
        ? await tx.cart.findUnique({ where: { userId: session.userId } })
        : session.guestToken 
          ? await tx.cart.findUnique({ where: { guestToken: session.guestToken } })
          : null;

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      // 8. Log audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId || null,
          action: "ORDER_CREATED",
          details: `Order ${orderNumber} created via successful checkout payment. Total: ₹${session.total}`,
        },
      });

      // 9. Dispatch confirmation email using Resend
      const emailItems = cartSnapshot.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      try {
        await sendOrderConfirmationEmail(
          session.email || "guest@luxstore.in",
          orderNumber,
          {
            subtotal: Number(session.subtotal),
            shippingCost: Number(session.shippingCost),
            taxCost: Number(session.taxCost),
            total: Number(session.total),
          },
          emailItems
        );
      } catch (emailError) {
        console.error("⚠️ Failed to send order confirmation email:", emailError);
      }

      return order;
    });
  },

  /**
   * 6. Handle Payment Failure
   */
  async handlePaymentFailure(paymentIntentId: string, errorMessage: string) {
    const session = await prisma.checkoutSession.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!session) return null;

    // Update payment status
    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: { paymentStatus: "FAILED" },
    });

    // Check if order exists (failed order tracker)
    const existingOrder = await prisma.order.findFirst({
      where: { paymentIntentId },
    });

    if (existingOrder) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: { status: "CANCELLED" },
      });

      await prisma.paymentTransaction.create({
        data: {
          orderId: existingOrder.id,
          stripePaymentIntentId: paymentIntentId,
          amount: session.total,
          currency: "INR",
          status: "FAILED",
          errorMessage,
        },
      });
    }

    return session;
  },
};
