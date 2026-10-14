import { test, expect } from '@playwright/test';

test('example.com has title', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
