const { test, expect } = require('@playwright/test');
let runtimeErrors;
test.beforeEach(async ({ page }) => {
  runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in to Telegram' })).toBeVisible();
});
test.afterEach(() => expect(runtimeErrors).toEqual([]));

test('mounts the existing login screen with styles and checkbox interaction', async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('login-desktop.png'), fullPage: true });
  const checkbox = page.getByRole('checkbox');
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await expect(page.locator('.logo')).toBeVisible();
  expect(await page.locator('main').evaluate(element => getComputedStyle(element).display)).toBe('flex');
});

test('store bindings, legacy button events and dynamic routes still work', async ({ page }, testInfo) => {
  await page.locator('input[type="phone"]').fill('+447700900123');
  const next = page.getByRole('button', { name: 'NEXT' });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.getByText('We have sent you an SMS with code')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('login-code.png'), fullPage: true });
});

test('country popup opens and click-outside events close it', async ({ page }) => {
  await page.locator('input[type="country"]').focus();
  await expect(page.locator('.popup')).toBeVisible();
  await page.getByRole('heading', { name: 'Sign in to Telegram' }).click();
  await expect(page.locator('.popup')).toHaveCount(0);
});
