const { test, expect } = require('@playwright/test');
async function openPhone(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log in by phone number', exact: true }).click();
}
test('country search supports names, calling codes, keyboard selection and dismissal', async ({ page }, info) => {
  await openPhone(page);
  const picker = page.getByRole('combobox', { name: 'Country', exact: true });
  await expect(picker).toHaveValue('');
  await picker.fill('united kingdom');
  await picker.press('ArrowDown');
  await picker.press('Enter');
  await expect(picker).toHaveValue('🇬🇧 United Kingdom');
  await expect(page.getByLabel('Your phone number', { exact: true })).toHaveValue('+44 ');
  await page.screenshot({ path: info.outputPath('phone-dark.png'), fullPage: true, animations: 'disabled' });
  await picker.click();
  await page.screenshot({ path: info.outputPath('countries-dark.png'), fullPage: true, animations: 'disabled' });
  await picker.fill('+49');
  await expect(page.getByRole('option', { name: 'Germany +49', exact: true })).toBeVisible();
  await picker.press('Enter');
  await expect(page.getByLabel('Your phone number', { exact: true })).toHaveValue('+49 ');
  await picker.fill('not a country');
  await expect(page.getByRole('status')).toContainText('No countries found');
  await picker.press('Escape');
  await expect(picker).toHaveValue('🇩🇪 Germany');
  await expect(page.getByRole('listbox', { name: 'Countries' })).toBeHidden();
  await picker.click();
  await page.getByRole('heading', { name: 'Telegram', exact: true }).click();
  await expect(page.getByRole('listbox', { name: 'Countries' })).toBeHidden();
});
test('shared calling codes preserve the selected country and never submit on selection', async ({ page }) => {
  await openPhone(page);
  const picker = page.getByRole('combobox', { name: 'Country', exact: true });
  await picker.fill('Canada');
  await page.getByRole('option', { name: 'Canada +1', exact: true }).click();
  await page.getByLabel('Your phone number', { exact: true }).fill('+14165550123');
  await expect(picker).toHaveValue('🇨🇦 Canada');
  await expect(page.getByRole('heading', { name: 'Telegram', exact: true })).toBeVisible();
});
test('country popup stays inside a small viewport in both themes', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPhone(page);
  const picker = page.getByRole('combobox', { name: 'Country', exact: true });
  await picker.fill('United Kingdom');
  await picker.press('Enter');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  const fallback = await page.getByRole('button', { name: 'Log in by QR code', exact: true }).boundingBox();
  expect(fallback.y + fallback.height).toBeLessThanOrEqual(568);
  await picker.click();
  const box = await page.getByRole('listbox', { name: 'Countries' }).boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(568);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('countries-mobile-light.png'), fullPage: true, animations: 'disabled' });
  await picker.press('Escape');
  await page.screenshot({ path: info.outputPath('phone-mobile-light.png'), fullPage: true, animations: 'disabled' });
});
