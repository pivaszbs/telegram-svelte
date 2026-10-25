const { test, expect } = require('@playwright/test');

async function signInToWorkspace(page) {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Scan this QR code with Telegram on your phone' })).toBeVisible();
  await page.evaluate(() => window.previewScanQr());
  await expect(page.getByRole('navigation', { name: 'Chat folders' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Chat list' })).toBeVisible();
}

test('Contest R1 folders filter chats and support all three icon styles', async ({ page }, info) => {
  await signInToWorkspace(page);

  await expect(page.getByRole('button', { name: /Jessica Flowers/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Patrick Rose/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Digital Nomads/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Saved Messages/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Gaming/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Emma Richards/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Doge memes/ })).toBeVisible();
  await page.screenshot({ path: info.outputPath('folders-standard.png'), fullPage: true, animations: 'disabled' });

  await page.getByRole('button', { name: 'Main menu' }).click();
  await page.getByRole('menuitem', { name: 'Rich Emoji Icons' }).click();
  await expect(page.getByRole('tab', { name: 'Work folder' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'NFT folder' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Crypto folder' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('folders-emoji.png'), fullPage: true, animations: 'disabled' });

  await page.getByRole('button', { name: 'Main menu' }).click();
  await page.getByRole('menuitem', { name: 'Custom Monochrome Icons' }).click();
  await expect(page.getByRole('tab', { name: 'Games folder' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('folders-minimal.png'), fullPage: true, animations: 'disabled' });

  await page.getByRole('tab', { name: 'Work folder' }).click();
  await expect(page.getByRole('button', { name: /Jessica Flowers/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Digital Nomads/ })).toHaveCount(0);

  await page.getByRole('tab', { name: 'All Chats folder' }).click();
  await expect(page.getByRole('button', { name: /Digital Nomads/ })).toBeVisible();
});

test('Contest R1 Edit Folder drawer supports folder emoji picker and invite links', async ({ page }, info) => {
  await signInToWorkspace(page);

  await page.getByRole('button', { name: 'Main menu' }).click();
  await page.getByRole('menuitem', { name: 'Light theme' }).click();

  await page.getByRole('tab', { name: 'Other folder' }).click();
  await page.getByRole('button', { name: 'Edit current folder' }).click();

  const editor = page.getByRole('region', { name: 'Edit Folder' });
  await expect(editor).toBeVisible();
  await expect(page.getByLabel('Folder Name')).toHaveValue('Other');

  await page.getByRole('button', { name: 'Choose folder icon' }).click();
  const picker = page.getByRole('dialog', { name: 'Folder icon and emoji picker' });
  await expect(picker).toBeVisible();
  await page.screenshot({ path: info.outputPath('edit-folder-emoji.png'), fullPage: true, animations: 'disabled' });

  await picker.getByRole('button', { name: 'Select 😀' }).click();
  await expect(picker).toBeHidden();

  await page.getByRole('button', { name: /Create an Invite Link/ }).click();
  await expect(editor.getByText(/https:\/\/t\.me\/addlist\/other-2/)).toBeVisible();

  await page.getByLabel('Folder Name').fill('Design');
  await page.getByRole('button', { name: 'Save folder' }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Design folder' })).toBeVisible();
});

test('Conversations preserve drafts, send messages, and exercise Contest R2 emoji, sticker and GIF panels', async ({ page }, info) => {
  await signInToWorkspace(page);

  await page.getByRole('button', { name: /Jessica Flowers/ }).click();
  await expect(page.getByRole('heading', { name: 'Jessica Flowers' })).toBeVisible();

  const composer = page.getByRole('textbox', { name: 'Message' });
  await composer.fill('Draft for Jessica');

  await page.getByRole('button', { name: /Patrick Rose/ }).click();
  await expect(composer).toHaveValue('');

  await page.getByRole('button', { name: /Jessica Flowers/ }).click();
  await expect(composer).toHaveValue('Draft for Jessica');

  await page.getByRole('button', { name: 'Open emoji, stickers and GIFs' }).click();
  const panel = page.getByRole('region', { name: 'Emoji, stickers and GIFs panel' });
  await expect(panel).toBeVisible();
  await page.screenshot({ path: info.outputPath('r2-emoji-1.png'), fullPage: true, animations: 'disabled' });

  await panel.getByRole('button', { name: 'Party filter' }).click();
  await expect(panel.getByRole('button', { name: 'Clear reaction filter' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('r2-emoji-2.png'), fullPage: true, animations: 'disabled' });
  await panel.getByRole('button', { name: 'Clear reaction filter' }).click();

  await panel.getByRole('button', { name: 'Expand standard emoji categories' }).click();
  await expect(panel.getByRole('group', { name: 'Standard emoji categories' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('r2-standard-emoji.png'), fullPage: true, animations: 'disabled' });

  await panel.getByRole('button', { name: 'Insert 😀' }).first().click();
  await expect(composer).toHaveValue('Draft for Jessica😀');
  await composer.press('Enter');
  await expect(composer).toHaveValue('');
  await expect(page.locator('.message-bubble.outgoing').filter({ hasText: 'Draft for Jessica😀' })).toBeVisible();

  await page.getByRole('button', { name: 'Open emoji, stickers and GIFs' }).click();
  await panel.getByRole('tab', { name: 'Stickers tab' }).click();
  await expect(panel.getByText('Hot Cherry')).toBeVisible();
  await page.screenshot({ path: info.outputPath('r2-stickers.png'), fullPage: true, animations: 'disabled' });

  await panel.getByRole('searchbox', { name: 'Search Stickers' }).click();
  await expect(panel.getByText('Peach')).toBeVisible();
  await expect(panel.getByText('Chilled Cat')).toBeVisible();
  await expect(panel.getByText('Little Flame')).toBeVisible();
  await page.screenshot({ path: info.outputPath('r2-stickers-catalog.png'), fullPage: true, animations: 'disabled' });

  const addPeach = panel.getByRole('button', { name: 'Add Peach sticker pack' });
  await addPeach.click();
  await expect(panel.getByRole('button', { name: 'Remove Peach sticker pack' })).toHaveText('ADDED');

  await panel.getByRole('button', { name: 'Send sticker Happy Peach' }).click();
  await expect(page.locator('.message-sticker').filter({ hasText: 'Happy Peach' })).toBeVisible();

  await page.getByRole('button', { name: 'Open emoji, stickers and GIFs' }).click();
  await panel.getByRole('tab', { name: 'GIFs tab' }).click();
  await expect(panel.getByRole('searchbox', { name: 'Search GIFs' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('r2-gifs.png'), fullPage: true, animations: 'disabled' });

  await panel.getByRole('button', { name: 'Send GIF Nyan Cat Rainbow' }).click();
  await expect(page.locator('.message-gif').filter({ hasText: 'Nyan Cat Rainbow' })).toBeVisible();

  // Reload to verify the SvelteKit fake server persisted the session and sent messages.
  await page.reload();
  await page.getByRole('button', { name: /Jessica Flowers/ }).click();
  await expect(page.locator('.message-gif').filter({ hasText: 'Nyan Cat Rainbow' })).toBeVisible();
});

test('mobile chat navigation opens and returns to the list without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInToWorkspace(page);

  await page.getByRole('button', { name: /Jessica Flowers/ }).click();
  await expect(page.getByRole('heading', { name: 'Jessica Flowers' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search conversations' })).toBeVisible();
});
