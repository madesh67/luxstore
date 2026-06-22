import { prisma } from "@/lib/prisma";

export interface UploadOptions {
  folder?: string;
  allowedFormats?: string[];
  maxSizeInBytes?: number;
  width?: number;
  height?: number;
  crop?: string;
}

export const CloudinaryService = {
  /**
   * Mock upload function that simulates upload to Cloudinary.
   * Performs basic validation and returns a simulated optimized CDN URL.
   */
  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<{ url: string; secureUrl: string; publicId: string; bytes: number; format: string }> {
    const {
      folder = "luxstore",
      allowedFormats = ["jpg", "jpeg", "png", "webp"],
      maxSizeInBytes = 5 * 1024 * 1024, // 5MB default
    } = options;

    // Validate size
    const fileBytes = fileBuffer.length;
    if (fileBytes > maxSizeInBytes) {
      throw new Error(`File size exceeds limit of ${maxSizeInBytes / (1024 * 1024)}MB`);
    }

    // Validate format
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    if (!allowedFormats.includes(extension)) {
      throw new Error(`File format .${extension} is not supported. Allowed formats: ${allowedFormats.join(", ")}`);
    }

    // Generate simulated public ID and URL
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const publicId = `${folder}/${cleanFileName}-${uniqueSuffix}`;
    
    // Simulate optimizations: resize / format transformations applied
    let transformations = "";
    if (options.width || options.height) {
      transformations = `/w_${options.width || "auto"},h_${options.height || "auto"},c_${options.crop || "limit"}`;
    }

    const secureUrl = `https://res.cloudinary.com/luxstore/image/upload${transformations}/${publicId}.webp`;

    return {
      url: secureUrl,
      secureUrl,
      publicId,
      bytes: fileBytes,
      format: "webp", // Always convert/optimize to webp in simulation
    };
  },

  /**
   * Log an audit trail or system alert for upload activity.
   */
  async logUploadActivity(userId: string, action: string, details: string) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  },
};
