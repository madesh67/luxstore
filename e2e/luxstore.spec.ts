import { test, expect } from "@playwright/test";

test.describe("LuxStore E2E Test Suite", () => {
  // 1. User Registration, Login & Logout
  test("User Auth Lifecycle (Register -> Login -> Logout)", async ({ page }) => {
    // Go to registration page
    await page.goto("/auth/register");
    await expect(page).toHaveTitle(/Register | LuxStore/i);

    // Fill registration form
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "SecureP@ss123!");
    await page.click('button[type="submit"]');

    // Upon register redirect to login or check register confirmation
    await page.waitForURL("**/auth/login");
    await expect(page).toHaveTitle(/Login | LuxStore/i);

    // Login
    await page.fill('input[name="email"]', "admin@luxstore.com"); // Using existing admin credentials for subsequent checks
    await page.fill('input[name="password"]', "AdminSecurePass123!");
    await page.click('button[type="submit"]');

    // Confirm redirected to account page
    await page.waitForURL("**/account");
    await expect(page.locator("h1")).toContainText(/My Account/i);

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL("**/auth/login");
  });

  // 2. Catalog Browsing, Search, and Filtering
  test("Catalog Browsing, Search, and Filtering", async ({ page }) => {
    // Navigate to Shop
    await page.goto("/shop");
    await expect(page.locator("h1")).toContainText(/Shop Catalog/i);

    // Search query
    await page.fill('input[placeholder*="Search"]', "Classic");
    await page.press('input[placeholder*="Search"]', "Enter");

    // Wait for filtered results
    await expect(page.locator(".product-grid")).toBeVisible();

    // Select category filters
    await page.click("button:has-text('Watches')");
    // Verify query parameters updated
    await expect(page).toHaveURL(/category=watches/);
  });

  // 3. Wishlist Management
  test("Wishlist Operations", async ({ page }) => {
    // Land on details page
    await page.goto("/products/watch-classic");

    // Add to wishlist
    const wishlistButton = page.locator("button:has-text('Add to Wishlist')");
    await wishlistButton.click();

    // Verify redirected or notification displayed
    await page.goto("/wishlist");
    await expect(page.locator(".wishlist-grid")).toContainText(/Watch Classic/i);

    // Remove from wishlist
    await page.click("button:has-text('Remove')");
    await expect(page.locator(".wishlist-grid")).not.toContainText(/Watch Classic/i);
  });

  // 4. Cart Operations & Coupon Usage
  test("Cart Operations & Coupon Usage", async ({ page }) => {
    // Add product to cart
    await page.goto("/products/watch-classic");
    await page.click("button:has-text('Add to Cart')");

    // Open Cart Drawer / Page
    await page.goto("/cart");
    await expect(page.locator(".cart-summary")).toContainText(/Subtotal/i);

    // Apply Coupon
    await page.fill('input[placeholder*="Coupon"]', "WELCOME10");
    await page.click("button:has-text('Apply')");
    
    // Verify coupon feedback
    await expect(page.locator(".coupon-discount")).toBeVisible();

    // Update quantities
    await page.fill('input[type="number"]', "2");
    await expect(page.locator(".cart-summary")).toContainText(/₹/i);
  });

  // 5. Checkout & Order Creation
  test("Checkout Process & Stripe Simulation", async ({ page }) => {
    // Setup login session
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@luxstore.com");
    await page.fill('input[name="password"]', "AdminSecurePass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/account");

    // Add item to cart and initiate checkout
    await page.goto("/products/watch-classic");
    await page.click("button:has-text('Add to Cart')");
    await page.goto("/checkout");

    // Fill Shipping Information
    await page.fill('input[name="fullName"]', "Jane Doe");
    await page.fill('input[name="phoneNumber"]', "9876543210");
    await page.fill('input[name="addressLine1"]', "123 luxury lane");
    await page.fill('input[name="city"]', "Mumbai");
    await page.fill('input[name="postalCode"]', "400001");
    await page.fill('input[name="state"]', "Maharashtra");

    await page.click("button:has-text('Proceed to Payment')");

    // Wait for Stripe elements form placeholder
    await expect(page.locator(".stripe-card-element")).toBeVisible();
  });

  // 6. Admin Panel: Catalog Management, Inventory, and Returns
  test("Admin Actions (Product Create -> Stock Adjust -> Returns Moderate)", async ({ page }) => {
    // Login as Admin
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@luxstore.com");
    await page.fill('input[name="password"]', "AdminSecurePass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/account");

    // Access Admin Dashboard
    await page.goto("/admin");
    await expect(page.locator("h2")).toContainText(/Admin Operations Dashboard/i);

    // Create Product Catalog Item
    await page.goto("/admin/products");
    await page.click("button:has-text('Add Product')");
    await page.fill('input[label*="Name"]', "E2E Premium Ring");
    await page.fill('input[label*="SKU"]', `SKU-RING-${Date.now()}`);
    await page.fill('input[label*="Price"]', "15000");
    await page.fill('textarea[label*="Description"]', "Handcrafted premium diamond ring.");
    await page.click("button:has-text('Create Product')");

    // Adjust Stock Levels
    await page.goto("/admin/inventory");
    await expect(page.locator("table")).toContainText(/E2E Premium Ring/i);
    await page.click("button:has-text('Adjust Stock')");
    await page.fill('input[type="number"]', "10");
    await page.click("button:has-text('Save Adjustment')");

    // Moderate Returns
    await page.goto("/admin/reviews");
    await expect(page.locator("h2")).toContainText(/Review Moderation/i);
  });
});
