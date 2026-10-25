import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleFakeTelegramRpc, resetInstance } from '../../src/lib/server/fake-telegram.mjs';

test('fake server isolates state per instance and supports auth lifecycle', async () => {
  const id = 'unit-auth-instance';
  resetInstance(id);

  await assert.rejects(() => handleFakeTelegramRpc('getMe', {}, id), /AUTH_KEY_UNREGISTERED/);

  const sent = await handleFakeTelegramRpc('sendCode', { phone: '+447700900123' }, id);
  assert.equal(sent.type, 'app');
  assert.equal(sent.phoneCodeHash, 'sample-code-hash');

  await assert.rejects(() => handleFakeTelegramRpc('signIn', { code: '11111' }, id), /PHONE_CODE_INVALID/);
  await assert.rejects(() => handleFakeTelegramRpc('signIn', { code: '12345' }, id), /SESSION_PASSWORD_NEEDED/);

  const me = await handleFakeTelegramRpc('checkPassword', { password: 'preview-password' }, id);
  assert.equal(me.displayName, 'Alex Morgan');

  const verified = await handleFakeTelegramRpc('getMe', {}, id);
  assert.equal(verified.username, 'alex_demo');

  await handleFakeTelegramRpc('logOut', {}, id);
  await assert.rejects(() => handleFakeTelegramRpc('getMe', {}, id), /AUTH_KEY_UNREGISTERED/);
});

test('fake server handles folders, chat messages, stickers and invite links', async () => {
  const id = 'unit-chat-instance';
  resetInstance(id);

  const boot = await handleFakeTelegramRpc('getBootstrap', {}, id);
  assert.equal(boot.folders.length, 6);
  assert.equal(boot.chats[0].title, 'Jessica Flowers');
  assert.equal(boot.chats[0].unreadCount, 2);

  const opened = await handleFakeTelegramRpc('openChat', { chatId: '1' }, id);
  assert.equal(opened.chat.unreadCount, 0);
  assert.equal(opened.messages.length, 3);

  const sent = await handleFakeTelegramRpc('sendMessage', { chatId: '1', text: 'Hello from SvelteKit fake server' }, id);
  assert.equal(sent.message.text, 'Hello from SvelteKit fake server');
  assert.equal(sent.chat.text, 'Hello from SvelteKit fake server');
  assert.equal(sent.chat.out, true);

  const folderResult = await handleFakeTelegramRpc('saveFolder', {
    folder: {
      id: 'other',
      title: 'Design Reviews',
      icon: 'custom',
      customEmoji: '🤩',
      includedIds: ['1', '4'],
      excludedIds: [],
      inviteLinks: ['https://t.me/addlist/other-chats'],
    },
  }, id);
  const updatedOther = folderResult.folders.find(item => item.id === 'other');
  assert.equal(updatedOther.title, 'Design Reviews');
  assert.equal(updatedOther.customEmoji, '🤩');

  const invite = await handleFakeTelegramRpc('createInviteLink', { folderId: 'other' }, id);
  assert.match(invite.link, /^https:\/\/t\.me\/addlist\/other-/);

  const toggled = await handleFakeTelegramRpc('toggleStickerPack', { packId: 'peach' }, id);
  assert.equal(toggled.pack.added, true);
});
