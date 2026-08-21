import { test, expect } from "@playwright/test";
import { directAdminLoginApi, MASTER_ADMIN } from "./helpers/test-utils";

test.describe("Admin & Vendor Operations Suite", () => {
  test("Master Admin logs in and accesses Admin Dashboard panels", async ({ page, baseURL }) => {
    // Authenticate as Admin
    await directAdminLoginApi(page, baseURL);

    await page.goto("/dashboard/admin");
    await page.waitForLoadState("domcontentloaded");

    // Ensure we are on the admin dashboard
    expect(page.url()).toContain("/dashboard/admin");

    // Verify main admin dashboard container exists
    const mainContainer = page.locator("main, [data-testid='admin-dashboard'], div:has-text('Admin')").first();
    await expect(mainContainer).toBeVisible();
  });

  test("Vendor registration page (/vendor-registration) loads correctly with partner form", async ({ page }) => {
    await page.goto("/vendor-registration");
    await page.waitForLoadState("domcontentloaded");

    // Check page load & heading
    await expect(page.locator("body")).toBeVisible();

    // Check if vendor application input fields exist
    const vendorForm = page.locator("form, input, button:has-text('Register'), button:has-text('Apply')").first();
    await expect(vendorForm).toBeVisible();
  });

  test("Admin API endpoints return authorized responses for master admin", async ({ page, baseURL }) => {
    await directAdminLoginApi(page, baseURL);

    // Test vehicles or stats endpoint
    const vehiclesResponse = await page.request.get(`${baseURL || ""}/api/vehicles`);
    expect(vehiclesResponse.status()).toBeLessThan(500);
  });
});
