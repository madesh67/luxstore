import { z } from "zod";

// Phone validation pattern (simple, fits international format too)
export const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number cannot exceed 15 digits")
  .regex(phoneRegex, "Please enter a valid phone number (e.g. +919876543210)");

// Pin code/ZIP code validation
export const postalCodeSchema = z
  .string()
  .min(5, "Postal code must be at least 5 characters")
  .max(10, "Postal code cannot exceed 10 characters")
  .regex(/^[A-Z0-9 -]+$/i, "Please enter a valid postal code");

// Password policy schema for Phase 2
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Prisma cuid schema helper
export const cuidSchema = z.string().cuid("Invalid unique identifier");
