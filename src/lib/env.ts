import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  ENABLE_PAYMENTS: z.preprocess((val) => val === "true" || val === true || val === "1", z.boolean()).default(false),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis URL").optional(),
}).superRefine((data, ctx) => {
  if (data.ENABLE_PAYMENTS) {
    if (!data.STRIPE_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "STRIPE_SECRET_KEY is required when ENABLE_PAYMENTS is true",
        path: ["STRIPE_SECRET_KEY"],
      });
    }
    if (!data.STRIPE_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "STRIPE_WEBHOOK_SECRET is required when ENABLE_PAYMENTS is true",
        path: ["STRIPE_WEBHOOK_SECRET"],
      });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

try {
  // Parse environment variables
  env = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    ENABLE_PAYMENTS: process.env.ENABLE_PAYMENTS,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    REDIS_URL: process.env.REDIS_URL,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    logger.error("Environment Validation Failed:\n" + issues);

    // Crash the startup in production to prevent misconfigured instances
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Production environment validation failed:\n${issues}`);
    } else {
      logger.warn("Development mode bypass: ignoring failed environment validation.");
      // Fallback object to prevent crashing during build/development/tests
      env = {
        NODE_ENV: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://mock",
        JWT_SECRET: process.env.JWT_SECRET || "mock-secret-at-least-32-chars-long",
        ENABLE_PAYMENTS: process.env.ENABLE_PAYMENTS === "true",
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "mock-stripe-secret",
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "mock-webhook-secret",
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "mock-cloud",
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "mock-key",
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "mock-secret",
        REDIS_URL: process.env.REDIS_URL,
      };
    }
  } else {
    throw error;
  }
}

export { env };
