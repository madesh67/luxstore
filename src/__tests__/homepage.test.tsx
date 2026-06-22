import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Homepage Navigation Logic (Static Audit)", () => {
  it("should verify that all key CTA links and collection cards point to correct destinations", () => {
    const filePath = path.resolve(__dirname, "../app/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Assert main Hero CTA Link
    expect(content).toContain('href="/shop"');
    expect(content).toContain('Shop Collection');

    // Assert Curated Collections links
    expect(content).toContain('href: "/shop?category=timepieces"');
    expect(content).toContain('href: "/shop?category=leather"');
    expect(content).toContain('href: "/shop?category=eyewear"');
  });
});
