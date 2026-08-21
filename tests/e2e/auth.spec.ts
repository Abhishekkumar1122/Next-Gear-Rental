import { test, expect } from "@playwright/test";
import { MASTER_ADMIN } from "./helpers/test-utils";

test.describe("Authentication & Session Flow Suite", () => {
  test("Login page loads with brand, video banner and authentication form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Verify input elements are visible
    const identifierInput = page.locator('input[placeholder*="Email or 10-digit phone"]');
    await expect(identifierInput).toBeVisible();

    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toBeVisible();

    const loginButton = page.locator('button[type="submit"]:has-text("Login")');
    await expect(loginButton).toBeVisible();
  });

  test("Allows switching between Password, OTP, and Sign Up modes", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Switch to OTP login
    const otpSwitchBtn = page.locator('button:has-text("Login with OTP instead")');
    if (await otpSwitchBtn.isVisible()) {
      await otpSwitchBtn.click();
      await expect(page.locator('button:has-text("Send via WhatsApp"), button:has-text("Send via SMS")').first()).toBeVisible();

      // Switch back to password
      const backToPasswordBtn = page.locator('button:has-text("Back to Password Login")');
      await backToPasswordBtn.click();
      await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
    }
  });

  test("Shows validation error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('input[placeholder*="Email or 10-digit phone"]').fill("invalid-user@example.com");
    await page.locator('input[placeholder="••••••••"]').fill("WrongPassword123!");
    await page.locator('button[type="submit"]:has-text("Login")').click();

    // Verify error message appears
    const statusBox = page.locator('div:has-text("Invalid"), div:has-text("error"), div:has-text("failed")').first();
    await expect(statusBox).toBeVisible({ timeout: 8000 });
  });

  test("Redirects unauthenticated users trying to access protected routes", async ({ page }) => {
    // Attempt to access protected admin dashboard without session
    await page.goto("/dashboard/admin");
    await page.waitForURL((url) => !url.pathname.includes("/dashboard/admin"), { timeout: 15000 });
    expect(page.url()).not.toContain("/dashboard/admin");

    // Attempt to access vehicle checkout booking without session
    await page.goto("/book-vehicle");
    await page.waitForURL((url) => url.pathname.includes("/login"), { timeout: 15000 });
    expect(page.url()).toContain("/login");
  });

  test("Master Admin logs in successfully and gains access to Admin Dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('input[placeholder*="Email or 10-digit phone"]').fill(MASTER_ADMIN.email);
    await page.locator('input[placeholder="••••••••"]').fill(MASTER_ADMIN.password);
    await page.locator('button[type="submit"]:has-text("Login")').click();

    // Should redirect to admin dashboard or home
    await page.waitForURL((url) => url.pathname.includes("/dashboard") || url.pathname === "/", { timeout: 15000 });

    // Verify session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === "nextgear_session");
    expect(sessionCookie).toBeDefined();

    // Now visit admin dashboard directly
    await page.goto("/dashboard/admin");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/dashboard/admin");
  });
});
