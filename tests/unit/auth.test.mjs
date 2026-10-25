import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, validCredentials, errorMessage } from '../../src/services/auth/machine.mjs';
import { createVault } from '../../src/services/auth/vault.mjs';
const config = { apiId: 123456, apiHash: '0123456789abcdef0123456789abcdef' };
const rpc = text => Object.assign(new Error(text), { text });
const me = { id: '123', displayName: 'Sample User' };
const sent = { type: 'app', phoneCodeHash: 'first-hash', nextType: 'sms', timeout: 10, length: 5 };
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
async function fixture(overrides = {}, options = {}) {
  const local = storage(), tab = storage();
  const vault = createVault(local, tab);
  const calls = [];
  const transport = { sendCode: async phone => { calls.push(['sendCode', phone]); return sent; }, signIn: async (...args) => { calls.push(['signIn', ...args]); return me; }, checkPassword: async () => me, getPasswordHint: async () => 'sample hint', exportSession: async () => 'sample-session', importSession: async () => {}, getMe: async () => me, logOut: async () => {}, close: async () => {}, resendCode: async () => ({ ...sent, phoneCodeHash: 'second-hash', type: 'sms' }), ...overrides };
  const auth = createAuth({ createTransport: async () => transport, vault, now: options.now || Date.now });
  let state;
  auth.subscribe(value => { state = value; });
  await auth.initialize(config);
  auth.usePhone();
  return { auth, vault, local, tab, calls, get state() { return state; } };
}
test('app credentials are validated without network activity', () => {
  assert.equal(validCredentials(config), true);
  assert.equal(validCredentials({ ...config, apiId: 0 }), false);
  assert.equal(validCredentials({ ...config, apiHash: 'bad' }), false);
});
test('phone/code login passes the exact challenge and saves only after authorization', async () => {
  const f = await fixture();
  await f.auth.sendCode('+44 (7700) 900123', true);
  assert.equal(f.state.step, 'code');
  assert.equal(f.vault.read(config.apiId), '');
  await f.auth.verifyCode('12345');
  assert.deepEqual(f.calls[1], ['signIn', '+447700900123', 'first-hash', '12345']);
  assert.equal(f.state.step, 'account');
  assert.equal(f.vault.read(config.apiId), 'sample-session');
});
test('bad code stays recoverable and never persists a session', async () => {
  const f = await fixture({ signIn: async () => { throw rpc('PHONE_CODE_INVALID'); } });
  await f.auth.sendCode('+447700900123', true);
  await f.auth.verifyCode('11111');
  assert.equal(f.state.step, 'code');
  assert.equal(f.state.busy, false);
  assert.match(f.state.error, /incorrect/);
  assert.equal(f.vault.read(config.apiId), '');
});
test('two-step verification advances only after a valid password', async () => {
  const f = await fixture({ signIn: async () => { throw rpc('SESSION_PASSWORD_NEEDED'); }, checkPassword: async value => { if (value !== 'correct') throw rpc('PASSWORD_HASH_INVALID'); return me; } });
  await f.auth.sendCode('+447700900123', true);
  await f.auth.verifyCode('12345');
  assert.equal(f.state.step, 'password');
  await f.auth.verifyPassword('wrong');
  assert.equal(f.state.step, 'password');
  assert.match(f.state.error, /incorrect/);
  await f.auth.verifyPassword('correct');
  assert.equal(f.state.step, 'account');
  assert.equal(JSON.stringify(f.state).includes('correct'), false);
});
test('rapid submissions cannot send duplicate codes', async () => {
  let done;
  let calls = 0;
  const f = await fixture({ sendCode: () => { calls++; return new Promise(resolve => { done = resolve; }); } });
  const pending = f.auth.sendCode('+447700900123', true);
  await new Promise(resolve => setImmediate(resolve));
  await f.auth.sendCode('+447700900123', true);
  assert.equal(calls, 1);
  done(sent);
  await pending;
});
test('resend respects Telegram timeout and updates the code hash', async () => {
  let time = 1000;
  const f = await fixture({}, { now: () => time });
  await f.auth.sendCode('+447700900123', true);
  await f.auth.resend();
  assert.equal(f.state.delivery, 'app');
  time += 10001;
  await f.auth.resend();
  assert.equal(f.state.delivery, 'sms');
  await f.auth.verifyCode('54321');
  assert.equal(f.calls.at(-1)[2], 'second-hash');
});
test('flood wait prevents another request until Telegram cooldown expires', async () => {
  let calls = 0, time = 1000;
  const f = await fixture({ sendCode: async () => { calls++; throw Object.assign(rpc('FLOOD_WAIT_%d'), { seconds: 30 }); } }, { now: () => time });
  await f.auth.sendCode('+447700900123', true);
  assert.match(f.state.error, /30 seconds/);
  await f.auth.sendCode('+447700900123', true);
  assert.equal(calls, 1);
  time += 30001;
  await f.auth.sendCode('+447700900123', true);
  assert.equal(calls, 2);
});
test('persistent and per-tab sessions are mutually exclusive and logout clears both', async () => {
  const f = await fixture();
  f.vault.save(config.apiId, 'old-session', true);
  await f.auth.sendCode('+447700900123', false);
  await f.auth.verifyCode('12345');
  assert.equal(f.local.getItem('telegram-svelte:session:123456'), null);
  assert.equal(f.tab.getItem('telegram-svelte:session:123456'), 'sample-session');
  await f.auth.logout();
  assert.equal(f.vault.read(config.apiId), '');
  assert.equal(f.state.user, null);
});
test('offline restore preserves a stored session; revoked restore clears it', async () => {
  let fail = rpc('NETWORK_ERROR');
  const f = await fixture({ getMe: async () => { throw fail; } });
  f.vault.save(config.apiId, 'saved', true);
  await f.auth.restore();
  assert.equal(f.state.step, 'restore');
  assert.equal(f.vault.read(config.apiId), 'saved');
  fail = rpc('SESSION_REVOKED');
  await f.auth.restore();
  assert.equal(f.state.step, 'qr');
  assert.equal(f.vault.read(config.apiId), '');
});
test('failed server logout does not silently discard the session', async () => {
  const f = await fixture({ logOut: async () => { throw rpc('NETWORK_ERROR'); } });
  await f.auth.sendCode('+447700900123', true);
  await f.auth.verifyCode('12345');
  await f.auth.logout();
  assert.equal(f.state.step, 'account');
  assert.equal(f.vault.read(config.apiId), 'sample-session');
});
test('unsupported verification has a clear message rather than a broken code screen', async () => {
  const f = await fixture({ sendCode: async () => ({ ...sent, type: 'email_required' }) });
  await f.auth.sendCode('+447700900123', true);
  assert.equal(f.state.step, 'phone');
  assert.match(f.state.error, /additional verification/);
  assert.equal(errorMessage(new Error('unexpected SECRET')), 'Could not connect to Telegram. Check your connection and try again.');
});

test('QR is the default for a configured client', async () => {
  const f = await fixture();
  await f.auth.initialize(config);
  assert.equal(f.state.step, 'qr');
});
test('rotated QR tokens replace the old token and success persists the verified session', async () => {
  let callbacks, done;
  const f = await fixture({ signInQr: params => { callbacks = params; return new Promise(resolve => { done = resolve; }); } });
  f.auth.useQr();
  const pending = f.auth.startQr();
  await new Promise(resolve => setImmediate(resolve));
  callbacks.onUrlUpdated('tg://login?token=first', new Date(1000));
  callbacks.onUrlUpdated('tg://login?token=second', new Date(2000));
  assert.equal(f.state.qrUrl, 'tg://login?token=second');
  assert.equal(f.state.qrExpires, 2000);
  callbacks.onScanned();
  assert.equal(f.state.qrUrl, '');
  done(me);
  await pending;
  assert.equal(f.state.step, 'account');
  assert.equal(f.vault.read(config.apiId), 'sample-session');
});
test('switching to phone aborts QR and ignores late tokens and late success', async () => {
  let callbacks, done;
  const f = await fixture({ signInQr: params => { callbacks = params; return new Promise(resolve => { done = resolve; }); } });
  f.auth.useQr();
  const pending = f.auth.startQr();
  await new Promise(resolve => setImmediate(resolve));
  f.auth.usePhone();
  assert.equal(callbacks.signal.aborted, true);
  callbacks.onUrlUpdated('tg://login?token=late', new Date());
  done(me);
  await pending;
  assert.equal(f.state.step, 'phone');
  assert.equal(f.state.qrUrl, '');
  assert.equal(f.vault.read(config.apiId), '');
});
test('QR password challenges use the existing password step', async () => {
  const f = await fixture({ signInQr: async () => { throw rpc('SESSION_PASSWORD_NEEDED'); } });
  f.auth.useQr();
  await f.auth.startQr();
  assert.equal(f.state.step, 'password');
  await f.auth.verifyPassword('sample-password');
  assert.equal(f.state.step, 'account');
});
test('failed QR generation is retryable and does not persist a session', async () => {
  const f = await fixture({ signInQr: async () => { throw rpc('NETWORK_ERROR'); } });
  f.auth.useQr();
  await f.auth.startQr();
  assert.equal(f.state.qrStatus, 'error');
  assert.equal(f.state.busy, false);
  assert.equal(f.vault.read(config.apiId), '');
});
