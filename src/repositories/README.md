# Repositories Layer

The `repositories/` directory houses data access logical wrappers. It decouples the raw database ORM (Prisma) operations from the service layer, keeping queries localized and testable.

## Pattern Example

Each domain entity repository coordinates core CRUD operations:

```typescript
import { prisma } from "@/lib/prisma";

export const ProductRepository = {
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: { images: true, inventory: true }
    });
  },
  
  async deleteSoft(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
};
```
