const { test, expect } = require('@playwright/test');
let runtimeErrors;
test.beforeEach(async ({ page }) => {
  runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in to Telegram' })).toBeVisible();
});
test.afterEach(() => expect(runtimeErrors).toEqual([]));
const phone = '+447700900123';
async function sendCode(page) {
  await page.getByLabel('Phone number', { exact: true }).fill(phone);
  await page.getByRole('button', { name: 'Send login code' }).click();
  await expect(page.getByRole('heading', { name: 'Check your Telegram' })).toBeVisible();
}
async function verify(page, code) {
  await page.getByLabel('5-character login code').fill(code);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
test('phone, code, password, account confirmation and logout', async ({ page }, info) => {
  await page.screenshot({ path: info.outputPath('phone.png'), fullPage: true, animations: 'disabled' });
  await sendCode(page);
  await expect(page.getByText(/code to your Telegram app/)).toBeVisible();
  await page.screenshot({ path: info.outputPath('code.png'), fullPage: true, animations: 'disabled' });
  await verify(page, '12345');
  await expect(page.getByRole('heading', { name: 'Two-step verification' })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeEnabled();
  await page.screenshot({ path: info.outputPath('password.png'), fullPage: true, animations: 'disabled' });
  await page.getByLabel('Password', { exact: true }).fill('preview-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alex Morgan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeEnabled();
  await page.screenshot({ path: info.outputPath('account.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to Telegram' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('telegram-svelte:session:123456'))).toBeNull();
});
test('bad code and bad password show recoverable errors', async ({ page }) => {
  await sendCode(page);
  await verify(page, '11111');
  await expect(page.getByRole('alert')).toContainText('code is incorrect');
  await verify(page, '12345');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('password is incorrect');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await page.getByLabel('Password', { exact: true }).fill('preview-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
});
test('code resend uses the next delivery method', async ({ page }) => {
  await sendCode(page);
  await page.getByRole('button', { name: 'Request another code', exact: true }).click();
  await expect(page.getByText('Telegram sent a code by SMS.')).toBeVisible();
});
test('remembered session restores on reload', async ({ page }) => {
  await sendCode(page);
  await verify(page, '22222');
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
});
test('remember unchecked keeps the session out of localStorage', async ({ page }) => {
  await page.getByRole('checkbox').uncheck();
  await sendCode(page);
  await verify(page, '22222');
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  const stored = await page.evaluate(() => ({ persistent: localStorage.getItem('telegram-svelte:session:123456'), tab: sessionStorage.getItem('telegram-svelte:session:123456') }));
  expect(stored).toEqual({ persistent: null, tab: 'sample-session' });
});
test('expired session is cleared without trapping login', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('telegram-svelte:session:123456', 'sample-expired-session'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in to Telegram' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('revoked');
});
test('phone login is usable on a narrow screen', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sendCode(page);
  await page.screenshot({ path: info.outputPath('mobile-code.png'), fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Use another phone number' }).click();
  await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue(phone);
});
test('real browser transport initializes WebCrypto and WASM without Telegram requests', async ({ page }) => {
  const sockets = [];
  page.on('websocket', socket => sockets.push(socket.url()));
  expect(await page.evaluate(() => window.prepareRealTransport())).toBe(true);
  expect(sockets).toEqual([]);
});
