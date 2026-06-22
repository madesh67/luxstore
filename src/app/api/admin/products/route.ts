import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { ProductService } from "@/services/product.service";
import { adminProductCreateSchema } from "@/schemas/catalog";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const brandId = searchParams.get("brandId") || undefined;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {

      deletedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          brand: true,
          images: { orderBy: { displayOrder: "asc" } },
          inventory: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify administrator access level
    await verifyAdmin(request);

    // 2. Parse and validate parameters
    const body = await request.json();
    const validatedData = adminProductCreateSchema.parse(body);

    // 3. Create the product
    const product = await ProductService.createProduct(validatedData);

    return successResponse({
      message: "Product created successfully",
      product,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

