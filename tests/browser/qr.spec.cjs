const { test, expect } = require('@playwright/test');
test('QR login is the default and phone login remains available', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Log in to Telegram by QR Code' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('qr-default.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Log in by phone number', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Telegram', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log in by QR code', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
});
test('QR tokens refresh without restarting the screen', async ({ page }) => {
  await page.goto('/?qr=refresh');
  const image = page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' });
  await expect(image).toBeVisible();
  const first = await image.getAttribute('src');
  await expect(image).not.toHaveAttribute('src', first);
});
test('a QR scan confirms the account without a phone code', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  await page.evaluate(() => window.previewScanQr());
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeEnabled();
  await page.screenshot({ path: info.outputPath('qr-account.png'), fullPage: true, animations: 'disabled' });
});
test('QR login supports two-step verification', async ({ page }) => {
  await page.goto('/?qr=password');
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  await page.evaluate(() => window.previewScanQr());
  await expect(page.getByRole('heading', { name: 'Two-step verification' })).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('preview-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
});
test('QR login fits a narrow screen', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('qr-mobile.png'), fullPage: true, animations: 'disabled' });
});

test('styled QR remains decodable with its center logo', async ({ page }) => {
  const jsQR = require('jsqr');
  await page.goto('/');
  const qr = page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' });
  await expect(qr).toBeVisible();
  const pixels = await qr.evaluate(async image => {
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 560;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, 560, 560);
    const logo = document.querySelector('.qr-logo');
    await logo.decode();
    context.fillStyle = 'white';
    context.beginPath(); context.arc(280, 280, 61.6, 0, 2 * Math.PI); context.fill();
    context.drawImage(logo, 228.4, 228.4, 103.2, 103.2);
    return Array.from(context.getImageData(0, 0, 560, 560).data);
  });
  expect(jsQR(new Uint8ClampedArray(pixels), 560, 560)?.data).toBe('tg://login?token=sample-preview-not-a-real-login');
});
test('theme switch and tiny viewport stay usable', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Log in by phone number', exact: true }).click();
  await expect(page.getByLabel('Phone number', { exact: true })).toBeVisible();
  await page.getByLabel('Country', { exact: true }).selectOption('GB');
  await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue('+44 ');
  await expect(page.getByLabel('Country', { exact: true })).toHaveValue('GB');
  await page.getByLabel('Phone number', { exact: true }).fill('+49123456789');
  await expect(page.getByLabel('Country', { exact: true })).toHaveValue('DE');
  await page.screenshot({ path: info.outputPath('phone-light-small.png'), fullPage: true, animations: 'disabled' });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
});

test('login review captures both themes on desktop and mobile', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.screenshot({ path: info.outputPath('qr-light.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath('qr-mobile-light.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Log in by phone number', exact: true }).click();
  await page.getByLabel('Country', { exact: true }).selectOption('GB');
  await page.screenshot({ path: info.outputPath('phone-mobile-light.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: info.outputPath('phone-light.png'), fullPage: true, animations: 'disabled' });
});
