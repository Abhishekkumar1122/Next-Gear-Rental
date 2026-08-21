import { Page, expect } from "@playwright/test";

export const MASTER_ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@next-gear.app",
  password: process.env.ADMIN_PASSWORD || "Admin@NextGear2026",
};

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  
  // Fill email/password if inputs exist on the page
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  if (await emailInput.isVisible({ timeout: 4000 }).catch(() => false)) {
    await emailInput.fill(MASTER_ADMIN.email);
    await passwordInput.fill(MASTER_ADMIN.password);
    
    // Submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")').first();
    await submitBtn.click();
  }
}

export async function directAdminLoginApi(page: Page, baseURL?: string) {
  const response = await page.request.post(`${baseURL || ""}/api/auth/login`, {
    data: {
      email: MASTER_ADMIN.email,
      password: MASTER_ADMIN.password,
    },
  });
  expect(response.ok()).toBeTruthy();
}
