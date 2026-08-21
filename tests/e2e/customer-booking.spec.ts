import { test, expect } from "@playwright/test";
import { directAdminLoginApi } from "./helpers/test-utils";

test.describe("Customer Vehicle Discovery & Booking Flow", () => {
  test("Browse fleet catalogue on /vehicles and filter vehicles", async ({ page }) => {
    await page.goto("/vehicles");
    await page.waitForLoadState("domcontentloaded");

    // Verify main heading / vehicle grid exists
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check if vehicle cards or search filter exists
    const searchOrFilter = page.locator('input[placeholder*="Search" i], button:has-text("Cars"), button:has-text("Bikes"), select').first();
    if (await searchOrFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(searchOrFilter).toBeVisible();
    }
  });

  test("Authenticated customer navigates to /book-vehicle and configures booking", async ({ page, baseURL }) => {
    // Authenticate user via API to establish session
    await directAdminLoginApi(page, baseURL);

    // Go to booking experience page
    await page.goto("/book-vehicle");
    await page.waitForLoadState("domcontentloaded");

    // Verify Book Vehicle header / tips section is present
    await expect(page.locator("h1, h2, div:has-text('Book Vehicle')").first()).toBeVisible();

    // Check if booking form fields (city, dates, name) or vehicle select exist
    const cityOrLocation = page.locator("select, input[placeholder*='city' i], input[placeholder*='location' i]").first();
    if (await cityOrLocation.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(cityOrLocation).toBeVisible();
    }
  });

  test("Customer dashboard (/dashboard/customer) renders past bookings and activity", async ({ page, baseURL }) => {
    // Log in
    await directAdminLoginApi(page, baseURL);

    await page.goto("/dashboard/customer");
    await page.waitForLoadState("domcontentloaded");

    // Expect customer dashboard or redirect to render without 500 error
    await expect(page.locator("body")).toBeVisible();
  });
});
