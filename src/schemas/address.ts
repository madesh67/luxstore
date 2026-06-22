import { z } from "zod";

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  addressLine1: z.string().min(1, "Address Line 1 is required").max(100),
  addressLine2: z.string().max(100).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(50),
  state: z.string().min(1, "State is required").max(50),
  postalCode: z.string().min(4, "Postal code must be at least 4 characters").max(10),
  country: z.string().min(1, "Country is required").default("India"),
  addressType: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
