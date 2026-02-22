import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests.");

  await page.goto("/api/auth/signin");
  await page.getByLabel("Email").fill(email as string);
  await page.getByLabel("Password").fill(password as string);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/settings/);
}

test("should allow navigating all settings pages and show expected headings", async ({ page }) => {
  await signIn(page);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

  await page.goto("/settings/security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();

  await page.goto("/settings/sessions");
  await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

  await page.goto("/settings/preferences");
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();

  await page.goto("/settings/activity");
  await expect(page.getByRole("heading", { name: "Activity Log" })).toBeVisible();
});
