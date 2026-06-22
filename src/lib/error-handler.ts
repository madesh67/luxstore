import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { errorResponse } from "./api-response";
import { logger } from "./logger";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleApiError(error: unknown) {
  // 1. Determine error severity and log accordingly
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(`API Server Error (${error.statusCode}): ${error.message}`, error);
    } else {
      // 4xx errors are client errors (unauthenticated, bad request) - log as warnings or info
      logger.warn(`API Client Warning (${error.statusCode}): ${error.message}`);
    }
    return errorResponse(error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    logger.warn(`API Validation Warning: ${error.message}`);
    return errorResponse(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": { // Unique constraint failed
        const fields = (error.meta?.target as string[]) || [];
        logger.warn(`API Database Warning (P2002): Unique constraint failed on field(s): ${fields.join(", ")}`);
        return errorResponse(
          `Unique constraint failed on field(s): ${fields.join(", ")}`,
          409,
          "CONFLICT_ERROR",
          { fields }
        );
      }
      case "P2025": { // Record not found
        const cause = (error.meta?.cause as string) || "Record not found";
        logger.warn(`API Database Warning (P2025): ${cause}`);
        return errorResponse(
          cause,
          404,
          "NOT_FOUND_ERROR"
        );
      }
      default:
        logger.error(`API Database Error (${error.code}): Database operation failed`, error as Error);
        return errorResponse(
          "Database operation failed",
          500,
          "DATABASE_ERROR",
          process.env.NODE_ENV === "development" ? error.meta : undefined
        );
    }
  }

  // General fallback for unhandled 500 server errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  logger.error(`Unhandled API Server Error: ${message}`, error instanceof Error ? error : undefined);

  return errorResponse(
    message,
    500,
    "INTERNAL_SERVER_ERROR",
    process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
  );
}
