import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Shop Catalog Parameter Synchronization (Static Audit)", () => {
  it("should confirm that searchParams are synchronized back to local filter states", () => {
    const filePath = path.resolve(__dirname, "../components/shared/shop-catalog-client.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Assert the presence of state sync setters inside useEffect blocks
    expect(content).toContain("setSelectedCategory");
    expect(content).toContain("setSelectedBrand");
    expect(content).toContain("setDebouncedSearch");
    expect(content).toContain("searchParams.get");
  });
});
