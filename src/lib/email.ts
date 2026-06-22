import { logger } from "./logger";

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

/**
 * Low-level utility to send email via Resend API using standard fetch.
 */
async function sendEmail(payload: ResendEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === "re_...") {
    logger.warn("Resend API key is mock or missing. Simulating email dispatch to:", payload.to.join(", "));
    logger.info("Email content preview:");
    logger.info(`  Subject: ${payload.subject}`);
    logger.info(`  Link info extraction from html: ${payload.html.match(/href="([^"]+)"/)?.[1] || "No link found"}`);
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error("Failed to dispatch email via Resend API:", errorData);
      return false;
    }

    logger.info("Successfully dispatched email to:", payload.to.join(", "));
    return true;
  } catch (error) {
    logger.error("Exception thrown during email dispatch:", error as Error);
    return false;
  }
}

/**
 * Dispatch verification token to user's email.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/auth/verify?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Thank you for registering at LuxStore. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #9e7f3d; color: white; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 3px; text-transform: uppercase; letter-spacing: 1px;">Verify Email Address</a>
      </div>
      <p style="font-size: 14px; color: #666; line-height: 1.6;">This link is valid for the next 24 hours. If the button above does not work, copy and paste the following link into your web browser:</p>
      <p style="font-size: 12px; color: #9e7f3d; word-break: break-all;"><a href="${verifyUrl}" style="color: #9e7f3d;">${verifyUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">If you did not create a LuxStore account, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <onboarding@resend.dev>", // Replace with verified domain sender in production
    to: [email],
    subject: "Verify your LuxStore Account",
    html,
  });
}

/**
 * Dispatch password reset token to user's email.
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">We received a request to reset the password for your LuxStore account. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #9e7f3d; color: white; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 3px; text-transform: uppercase; letter-spacing: 1px;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666; line-height: 1.6;">This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.</p>
      <p style="font-size: 14px; color: #666; line-height: 1.6;">If the button above does not work, copy and paste the following link into your web browser:</p>
      <p style="font-size: 12px; color: #9e7f3d; word-break: break-all;"><a href="${resetUrl}" style="color: #9e7f3d;">${resetUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">This is an automated system email. Please do not reply directly.</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <onboarding@resend.dev>",
    to: [email],
    subject: "Reset your LuxStore Password",
    html,
  });
}

/**
 * Dispatch order confirmation notification.
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  totals: { subtotal: number; shippingCost: number; taxCost: number; total: number },
  items: { productName: string; quantity: number; price: number }[]
): Promise<boolean> {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; font-size: 14px; color: #333;">
        ${item.productName} (x${item.quantity})
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; font-size: 14px; color: #333; text-align: right; font-family: monospace;">
        ₹${item.price.toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Thank you for your purchase. Your order has been placed and is currently being processed. Here are your order details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">Order Number: <strong>${orderNumber}</strong></p>
      </div>

      <h3 style="font-size: 16px; color: #171513; text-transform: uppercase; letter-spacing: 1px; margin-top: 30px;">Curated Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="padding: 10px 0; border-bottom: 2px solid #171513; text-align: left; font-size: 12px; text-transform: uppercase; color: #666;">Item</th>
            <th style="padding: 10px 0; border-bottom: 2px solid #171513; text-align: right; font-size: 12px; text-transform: uppercase; color: #666;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table style="width: 100%; font-size: 14px; color: #333; line-height: 1.8; margin-top: 20px;">
        <tr>
          <td style="color: #666;">Subtotal:</td>
          <td style="text-align: right; font-family: monospace;">₹${totals.subtotal.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="color: #666;">Shipping:</td>
          <td style="text-align: right; font-family: monospace;">₹${totals.shippingCost.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="color: #666;">Tax:</td>
          <td style="text-align: right; font-family: monospace;">₹${totals.taxCost.toLocaleString("en-IN")}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 16px; border-top: 1px solid #171513;">
          <td style="padding-top: 10px; color: #171513;">Grand Total:</td>
          <td style="padding-top: 10px; text-align: right; font-family: monospace; color: #9e7f3d;">₹${totals.total.toLocaleString("en-IN")}</td>
        </tr>
      </table>

      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Thank you for choosing LuxStore. If you have any questions, please contact our support team.</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <orders@resend.dev>",
    to: [email],
    subject: `Order Confirmation — ${orderNumber}`,
    html,
  });
}

/**
 * Dispatch order shipped email.
 */
export async function sendOrderShippedEmail(
  email: string,
  orderNumber: string,
  carrier: string,
  trackingNumber: string,
  trackingUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Great news! Your order has been shipped and is on its way to you.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">Order Number: <strong>${orderNumber}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Carrier: <strong>${carrier}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Tracking Number: <strong>${trackingNumber}</strong></p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${trackingUrl}" style="background-color: #9e7f3d; color: white; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 3px; text-transform: uppercase; letter-spacing: 1px;">Track Your Package</a>
      </div>

      <p style="font-size: 14px; color: #666; line-height: 1.6;">If the button above does not work, copy and paste the following link into your browser:</p>
      <p style="font-size: 12px; color: #9e7f3d; word-break: break-all;"><a href="${trackingUrl}" style="color: #9e7f3d;">${trackingUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Thank you for choosing LuxStore. Please contact support if you need further assistance.</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <orders@resend.dev>",
    to: [email],
    subject: `Order Shipped — ${orderNumber}`,
    html,
  });
}

/**
 * Dispatch order delivered email.
 */
export async function sendOrderDeliveredEmail(
  email: string,
  orderNumber: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Your order has been marked as delivered. We hope you love your curated luxury items!</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">Order Number: <strong>${orderNumber}</strong></p>
      </div>

      <p style="font-size: 14px; color: #666; line-height: 1.6;">If you have not received your package, please reach out to our customer care team immediately.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Thank you for shopping at LuxStore.</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <orders@resend.dev>",
    to: [email],
    subject: `Order Delivered — ${orderNumber}`,
    html,
  });
}

/**
 * Dispatch order cancelled email.
 */
export async function sendOrderCancelledEmail(
  email: string,
  orderNumber: string,
  reason?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Your order has been cancelled.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">Order Number: <strong>${orderNumber}</strong></p>
        ${reason ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Reason: ${reason}</p>` : ""}
      </div>

      <p style="font-size: 14px; color: #666; line-height: 1.6;">If you have any questions or believe this was an error, please reach out to our team.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">LuxStore Customer Service</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <orders@resend.dev>",
    to: [email],
    subject: `Order Cancelled — ${orderNumber}`,
    html,
  });
}

/**
 * Dispatch return requested email.
 */
export async function sendReturnRequestedEmail(
  email: string,
  orderNumber: string,
  reason: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">We have received your return request for the following order.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">Order Number: <strong>${orderNumber}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Reason: <strong>${reason}</strong></p>
      </div>

      <p style="font-size: 14px; color: #666; line-height: 1.6;">Our team will review your request shortly and provide updates or shipping labels as appropriate.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">LuxStore Returns Department</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <returns@resend.dev>",
    to: [email],
    subject: `Return Request Received — ${orderNumber}`,
    html,
  });
}

/**
 * Dispatch return approved email.
 */
export async function sendReturnApprovedEmail(
  email: string,
  orderNumber: string,
  instructions?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Your return request for order <strong>${orderNumber}</strong> has been approved!</p>
      
      ${instructions ? `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #171513;">Next Steps & Instructions:</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.5;">${instructions}</p>
      </div>
      ` : ""}

      <p style="font-size: 14px; color: #666; line-height: 1.6;">Once we receive and inspect the returned item(s), your refund will be processed.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">LuxStore Returns Department</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <returns@resend.dev>",
    to: [email],
    subject: `Return Request Approved — ${orderNumber}`,
    html,
  });
}

/**
 * Dispatch return rejected email.
 */
export async function sendReturnRejectedEmail(
  email: string,
  orderNumber: string,
  reason?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #171513; text-align: center; text-transform: uppercase; letter-spacing: 2px;">LUXSTORE</h2>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello,</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">Your return request for order <strong>${orderNumber}</strong> was not approved.</p>
      
      ${reason ? `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">Reason: ${reason}</p>
      </div>
      ` : ""}

      <p style="font-size: 14px; color: #666; line-height: 1.6;">Please contact our support team if you would like to discuss this decision.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">LuxStore Returns Department</p>
    </div>
  `;

  return sendEmail({
    from: "LuxStore <returns@resend.dev>",
    to: [email],
    subject: `Return Request Updates — ${orderNumber}`,
    html,
  });
}
