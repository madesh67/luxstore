# Features Layer

The `features/` directory promotes a modular, domain-driven organization. Large vertical domains (like Checkout, Cart, or ProductCatalog) house their specific components, hooks, schemas, and state slices here instead of scattering them globally.

## Folder Structure

```
features/
└── checkout/
    ├── components/
    │   ├── checkout-summary.tsx
    │   └── shipping-form.tsx
    ├── hooks/
    │   └── use-checkout-state.ts
    ├── schemas/
    │   └── checkout-validation.ts
    └── index.ts # Clean public interface export
```

## Guideline

If a component or utility is used *only* within a single feature boundary, place it inside that feature. If it is shared across multiple domains, promote it to `components/shared/` or `hooks/`.
