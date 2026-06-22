import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Homepage Navigation Logic (Static Audit)", () => {
  it("should verify that the Shop Collection CTA points to the /shop route", () => {
    const filePath = path.resolve(__dirname, "../app/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Validate that the CTA has a Link wrapper referencing '/shop'
    expect(content).toContain('href="/shop"');
    expect(content).toContain('Shop Collection');
  });
});
