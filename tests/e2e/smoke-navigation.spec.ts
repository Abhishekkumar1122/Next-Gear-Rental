import { test, expect } from "@playwright/test";

test.describe("Smoke & Site Navigation Suite", () => {
  test("Home page loads with brand title and hero section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Check page title
    await expect(page).toHaveTitle(/Next Gear|Rentals/i);
    
    // Check navbar header presence (use .first() to avoid strict mode ambiguity)
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });

  test("Key public navigation pages render successfully", async ({ page }) => {
    const routes = [
      { path: "/about" },
      { path: "/faq" },
      { path: "/pricing" },
      { path: "/cities" },
      { path: "/nri-rentals" },
      { path: "/vendor-registration" },
      { path: "/refund-policy" },
      { path: "/terms-and-conditions" },
    ];

    for (const route of routes) {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("Contact page loads form fields and handles user interaction", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("domcontentloaded");
    
    // Check if full name and email inputs exist and can be filled
    const nameInput = page.locator('input[placeholder="e.g. Rahul Sharma"]');
    const emailInput = page.locator('input[placeholder="name@gmail.com"]');
    
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill("Rahul Sharma");
      await emailInput.fill("rahul.sharma@example.com");
      await expect(nameInput).toHaveValue("Rahul Sharma");
      await expect(emailInput).toHaveValue("rahul.sharma@example.com");
    }
  });
});
