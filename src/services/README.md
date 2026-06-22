# Services Layer

The `services/` directory is responsible for orchestrating business rules and coordinating between multiple repositories, external APIs (Stripe, Resend, Cloudinary), and caches (Redis).

## Core Principles

1. **Isolation**: Services do not know about HTTP requests or responses; they accept raw data parameters and return typed results.
2. **Third-Party Clients**: All client initializations (like Resend or Stripe) reside here or are imported here to execute specialized business workflows.

## Pattern Example

```typescript
import { ProductRepository } from "@/repositories";
import { AppError } from "@/lib/error-handler";

export const CatalogService = {
  async adjustStock(productId: string, quantity: number) {
    const product = await ProductRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    
    // Complex business rules evaluation here
  }
};
```
