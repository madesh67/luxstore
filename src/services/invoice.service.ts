interface InvoiceAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
}

interface InvoiceItem {
  productName: string;
  productSku: string;
  quantity: number;
  price: unknown;
}

interface InvoiceOrder {
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  total: unknown;
  subtotal: unknown;
  shippingCost: unknown;
  taxCost: unknown;
  paymentIntentId: string | null;
  shippingAddressSnapshot: unknown;
  items: InvoiceItem[];
  email: string;
}

export const InvoiceService = {
  /**
   * Get download filename for the invoice.
   */
  getInvoiceFilename(orderNumber: string): string {
    return `invoice-${orderNumber}.html`;
  },

  /**
   * Generates a beautifully formatted, print-optimized HTML invoice.
   */
  generateInvoiceHtml(order: InvoiceOrder): string {
    const address = ((typeof order.shippingAddressSnapshot === "string"
      ? JSON.parse(order.shippingAddressSnapshot)
      : order.shippingAddressSnapshot) as InvoiceAddress) || {};

    const itemsHtml = order.items
      .map(
        (item: InvoiceItem) => `
        <tr class="item-row">
          <td>
            <div class="product-name">${item.productName}</div>
            <div class="product-sku">SKU: ${item.productSku}</div>
          </td>
          <td class="text-right font-mono">${item.quantity}</td>
          <td class="text-right font-mono">₹${Number(item.price as string | number).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-right font-mono">₹${(Number(item.price as string | number) * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join("");

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subtotal = Number(order.subtotal as string | number);
    const shippingCost = Number(order.shippingCost as string | number);
    const taxCost = Number(order.taxCost as string | number);
    const total = Number(order.total as string | number);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif, sans-serif;
            color: #171513;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-size: 14px;
            line-height: 1.5;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #e0dcd3;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
            border-radius: 4px;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #171513;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: 300;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #9e7f3d;
            text-align: right;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .info-table td {
            vertical-align: top;
            width: 50%;
          }
          .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #8a8475;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .details-text {
            color: #3d3a35;
            font-size: 13px;
            line-height: 1.6;
          }
          .details-text strong {
            color: #171513;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .items-table th {
            border-bottom: 2px solid #171513;
            padding: 12px 6px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #171513;
            font-weight: bold;
          }
          .items-table td {
            padding: 12px 6px;
            border-bottom: 1px solid #eae6df;
            vertical-align: top;
          }
          .item-row:hover {
            background-color: #fcfbfa;
          }
          .product-name {
            font-weight: bold;
            color: #171513;
            font-size: 14px;
          }
          .product-sku {
            font-size: 11px;
            color: #8a8475;
            margin-top: 4px;
          }
          .text-right {
            text-align: right;
          }
          .font-mono {
            font-family: Courier, monospace;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .totals-table td {
            padding: 8px 6px;
            font-size: 13px;
          }
          .totals-table tr.grand-total td {
            border-top: 1px solid #171513;
            border-bottom: 2px double #171513;
            font-size: 16px;
            font-weight: bold;
            color: #9e7f3d;
            padding: 12px 6px;
          }
          .footer {
            border-top: 1px solid #eae6df;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #8a8475;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          @media print {
            body {
              padding: 0;
            }
            .invoice-box {
              border: none;
              box-shadow: none;
              padding: 0;
            }
            @page {
              margin: 1.5cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td class="logo">LUXSTORE</td>
              <td class="invoice-title">Invoice</td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td>
                <div class="section-title">Invoice To</div>
                <div class="details-text">
                  <strong>${address.fullName || order.email}</strong><br />
                  ${address.addressLine1 || ""}<br />
                  ${address.addressLine2 ? address.addressLine2 + "<br />" : ""}
                  ${address.city || ""}, ${address.state || ""} ${address.postalCode || ""}<br />
                  ${address.country || "India"}<br />
                  Phone: ${address.phoneNumber || "N/A"}<br />
                  Email: ${order.email}
                </div>
              </td>
              <td style="text-align: right;">
                <div class="section-title">Order Details</div>
                <div class="details-text">
                  Invoice Number: <strong>INV-${order.orderNumber}</strong><br />
                  Order Number: <strong>${order.orderNumber}</strong><br />
                  Date: <strong>${orderDate}</strong><br />
                  Payment Status: <strong>${order.status}</strong><br />
                  Payment Intent ID: <span class="font-mono" style="font-size: 11px;">${order.paymentIntentId || "N/A"}</span>
                </div>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>Curation Details</th>
                <th class="text-right" style="width: 80px;">Qty</th>
                <th class="text-right" style="width: 120px;">Unit Price</th>
                <th class="text-right" style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td class="text-right font-mono">₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Shipping Cost</td>
              <td class="text-right font-mono">₹${shippingCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Tax (GST)</td>
              <td class="text-right font-mono">₹${taxCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="grand-total">
              <td>Grand Total</td>
              <td class="text-right font-mono">₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>

          <div class="footer">
            Thank you for your patronage. Curation is a form of art.
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
