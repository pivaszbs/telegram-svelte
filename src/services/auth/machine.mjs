export function validCredentials(config) {
  return Number.isSafeInteger(Number(config?.apiId)) && Number(config.apiId) > 0 && Number(config.apiId) <= 2147483647 && /^[a-f\d]{32}$/i.test(config?.apiHash || '');
}
export function rpcName(error) {
  return error?.text || error?.errorMessage || error?.type || error?.message || '';
}
export function errorMessage(error) {
  const name = rpcName(error);
  const wait = Number(error?.seconds || name.match(/FLOOD_WAIT_(\d+)/)?.[1]);
  if (/FLOOD|PHONE_NUMBER_FLOOD/.test(name)) return wait ? `Telegram asked you to wait ${wait} seconds. Try again after that.` : 'Too many attempts. Please wait before trying again.';
  const messages = {
    PHONE_NUMBER_INVALID: 'Enter a valid phone number with its country code.',
    PHONE_NUMBER_BANNED: 'This phone number is banned by Telegram.',
    PHONE_CODE_INVALID: 'That code is incorrect. Check it and try again.',
    PHONE_CODE_EMPTY: 'Enter the code Telegram sent you.',
    PHONE_CODE_EXPIRED: 'That code has expired. Request a new code when available.',
    PASSWORD_HASH_INVALID: 'That password is incorrect. Try again.',
    API_ID_INVALID: 'Telegram rejected the API credentials. Check your API ID and hash.',
    API_ID_PUBLISHED_FLOOD: 'These API credentials cannot be used. Create your own Telegram application.',
    PHONE_NUMBER_UNOCCUPIED: 'Create your account in an official Telegram app first, then sign in here.',
    SESSION_REVOKED: 'Your saved session was revoked. Sign in again.',
    AUTH_KEY_UNREGISTERED: 'Your saved session has expired. Sign in again.',
    AUTH_RESTART: 'Telegram restarted this login attempt. Go back and request a new code.',
    SESSION_EXPIRED: 'Your session has expired. Sign in again.',
    AUTH_KEY_DUPLICATED: 'Telegram invalidated this session. Sign in again.',
  };
  if (messages[name]) return messages[name];
  if (/Signup|Sign up/.test(name)) return messages.PHONE_NUMBER_UNOCCUPIED;
  if (/EMAIL|CAPTCHA|PAYMENT|Payment|Firebase|FIREBASE/.test(name)) return 'Telegram requires an additional verification step. Sign in with an official Telegram app, then try again here.';
  return 'Could not connect to Telegram. Check your connection and try again.';
}

export function createAuth({ createTransport, vault, now = Date.now }) {
  let state = { step: 'setup', busy: false, error: '', notice: '', phone: '', delivery: '', codeLength: 0, nextType: 'none', resendAt: 0, hint: '', user: null, remember: true, retryAt: 0, qrStatus: 'idle', qrUrl: '', qrExpires: 0 };
  let config;
  let transport;
  let transportPromise;
  let transportRevision = 0;
  let challenge;
  let disposed = false;
  let qrAbort;
  let qrRevision = 0;
  const listeners = new Set();
  const set = delta => { state = { ...state, ...delta }; if (!disposed) listeners.forEach(fn => fn(state)); };
  function cancelQr(discardClient = false) {
    const wasActive = Boolean(qrAbort);
    qrRevision++;
    qrAbort?.abort();
    qrAbort = null;
    if (discardClient && wasActive) {
      const oldClient = transportPromise;
      transportRevision++; transport = null; transportPromise = null;
      oldClient?.then(value => value.close()).catch(() => {});
    }
    set({ qrUrl: '', qrExpires: 0, qrStatus: 'idle' });
  }
  function fail(error) {
    const seconds = Number(error?.seconds || rpcName(error).match(/FLOOD_WAIT_(\d+)/)?.[1]);
    set({ error: errorMessage(error), retryAt: /FLOOD/.test(rpcName(error)) && seconds ? now() + seconds * 1000 : 0 });
  }
  async function client() {
    if (!transportPromise) {
      const generation = transportRevision;
      transportPromise = createTransport(config).then(async value => {
        if (disposed || generation !== transportRevision) { await value.close(); throw new Error('Disposed'); }
        transport = value;
        return value;
      }).catch(error => { if (generation === transportRevision) transportPromise = null; throw error; });
    }
    return transportPromise;
  }
  async function run(action) {
    if (state.busy || disposed || now() < state.retryAt) return;
    set({ busy: true, error: '', notice: '' });
    try { await action(); }
    catch (error) { fail(error); }
    finally { set({ busy: false }); }
  }
  async function finish(user) {
    // Authorization is confirmed by Telegram, not inferred from a code submission.
    const c = await client();
    const me = user || await c.getMe();
    let notice = '';
    try { vault.save(config.apiId, await c.exportSession(), state.remember); }
    catch { notice = 'Signed in, but your browser could not save the session. You may need to sign in again after closing this page.'; }
    challenge = null;
    set({ step: 'account', user: me, phone: '', hint: '', delivery: '', qrUrl: '', qrExpires: 0, qrStatus: 'idle', notice });
  }
  function received(result) {
    if (result.user) return finish(result.user);
    if (!['app', 'sms', 'call', 'email', 'fragment', 'sms_word', 'sms_phrase', 'flash_call', 'missed_call'].includes(result.type)) throw new Error('EMAIL_OR_FIREBASE_VERIFICATION_REQUIRED');
    challenge = result;
    set({ step: 'code', delivery: result.type, codeLength: result.length || 0, nextType: result.nextType || 'none', resendAt: now() + Math.max(0, result.timeout || 0) * 1000 });
  }
  async function passwordStep() {
    set({ step: 'password' });
    // A missing hint must not discard a valid password challenge.
    try { const hint = await (await client()).getPasswordHint() || ''; if (state.step === 'password') set({ hint }); } catch { /* optional */ }
  }
  const api = {
    subscribe(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); },
    async initialize(initialConfig) {
      if (!validCredentials(initialConfig)) { set({ step: 'setup' }); return; }
      config = { apiId: Number(initialConfig.apiId), apiHash: initialConfig.apiHash };
      let saved;
      try { saved = vault.read(config.apiId); } catch { set({ step: 'qr', notice: 'Browser storage is unavailable. Sessions will not survive a reload.' }); return; }
      if (!saved) { set({ step: 'qr', qrStatus: 'idle' }); return; }
      await api.restore();
    },
    configure(value, remember) {
      if (!validCredentials(value) || state.busy) { set({ error: 'Enter a positive API ID and the 32-character API hash from my.telegram.org.' }); return; }
      config = { apiId: Number(value.apiId), apiHash: value.apiHash.trim() };
      let notice = '';
      try { vault.configure(config, remember); } catch { notice = 'Your browser could not save the app settings.'; }
      set({ step: 'qr', qrStatus: 'idle', remember, error: '', notice });
    },
    restore: () => run(async () => {
      set({ step: 'restore' });
      try {
        const saved = vault.read(config.apiId);
        const c = await client();
        await c.importSession(saved);
        const me = await c.getMe();
        set({ step: 'account', user: me });
      } catch (error) {
        if (['SESSION_REVOKED', 'AUTH_KEY_UNREGISTERED', 'SESSION_EXPIRED', 'AUTH_KEY_DUPLICATED', 'INVALID_SESSION'].includes(rpcName(error))) {
          try { vault.clear(config.apiId); } catch { /* already unusable */ }
          await transport?.close(); transport = null; transportPromise = null;
          set({ step: 'qr', qrStatus: 'idle', error: errorMessage(error) });
        } else throw error; // Preserve a valid stored session when the connection is offline.
      }
    }),
    sendCode: (phone, remember) => run(async () => {
      cancelQr();
      const normalized = phone.replace(/[\s()-]/g, '');
      if (!/^\+[1-9]\d{6,14}$/.test(normalized)) throw new Error('PHONE_NUMBER_INVALID');
      set({ phone: normalized, remember });
      try { await received(await (await client()).sendCode(normalized)); }
      catch (error) { if (rpcName(error) === 'SESSION_PASSWORD_NEEDED') await passwordStep(); else throw error; }
    }),
    verifyCode: code => run(async () => {
      if (state.step !== 'code' || !challenge) return;
      if (!code.trim()) throw new Error('PHONE_CODE_EMPTY');
      try { await finish(await (await client()).signIn(state.phone, challenge.phoneCodeHash, code.trim())); }
      catch (error) { if (rpcName(error) === 'SESSION_PASSWORD_NEEDED') await passwordStep(); else throw error; }
    }),
    verifyPassword: password => run(async () => {
      if (state.step !== 'password') return;
      if (!password) throw new Error('PASSWORD_HASH_INVALID');
      await finish(await (await client()).checkPassword(password));
    }),
    resend: () => run(async () => {
      if (!challenge || state.nextType === 'none' || now() < state.resendAt) return;
      await received(await (await client()).resendCode(state.phone, challenge.phoneCodeHash));
    }),
    changeApp: () => run(async () => {
      cancelQr(true);
      await transport?.close(); transport = null; transportPromise = null; config = null;
      challenge = null;
      set({ step: 'setup', phone: '', user: null, hint: '', error: '' });
    }),
    setRemember(value) { if (!state.busy) set({ remember: value }); },
    usePhone() {
      if (state.busy) return;
      cancelQr(true); challenge = null;
      set({ step: 'phone', error: '', hint: '', delivery: '' });
    },
    useQr(remember = state.remember) {
      if (state.busy) return;
      cancelQr(); challenge = null;
      set({ step: 'qr', qrStatus: now() < state.retryAt ? 'error' : 'idle', remember, error: now() < state.retryAt ? state.error : '', hint: '', delivery: '' });
    },
    back() { api.usePhone(); },
    async startQr(remember = state.remember) {
      if (state.busy || disposed || now() < state.retryAt || state.step !== 'qr' || qrAbort) return;
      const retry = state.qrStatus === 'error';
      cancelQr();
      const request = qrRevision;
      const abort = new AbortController();
      qrAbort = abort;
      set({ step: 'qr', qrStatus: 'connecting', remember, error: retry ? '' : state.error });
      const current = () => !disposed && request === qrRevision && !abort.signal.aborted;
      try {
        const c = await client();
        if (!current()) return;
        const me = await c.signInQr({
          signal: abort.signal,
          onUrlUpdated(url, expires) {
            if (current()) set({ qrUrl: url, qrExpires: Number(expires), qrStatus: 'ready', busy: false });
          },
          onScanned() { if (current()) set({ qrUrl: '', qrStatus: 'scanned', busy: true }); },
        });
        if (!current()) return;
        set({ busy: true, qrUrl: '', qrStatus: 'scanned' });
        await finish(me);
      } catch (error) {
        if (!current()) return;
        set({ qrUrl: '', qrStatus: 'error' });
        if (rpcName(error) === 'SESSION_PASSWORD_NEEDED') {
          set({ busy: true });
          await passwordStep();
        } else fail(error);
      } finally {
        if (request === qrRevision) { qrAbort = null; set({ busy: false }); }
      }
    },
    logout: () => run(async () => {
      // Keep the session if server revocation fails so the user can retry.
      await (await client()).logOut();
      let notice = '';
      try { vault.clear(config.apiId); } catch { notice = 'Signed out on Telegram. Your browser could not clear its saved session.'; }
      await transport?.close(); transport = null; transportPromise = null;
      set({ step: 'qr', qrStatus: 'idle', user: null, phone: '', notice });
    }),
    forget: () => run(async () => {
      vault.clear(config.apiId);
      await transport?.close(); transport = null; transportPromise = null;
      set({ step: 'qr', qrStatus: 'idle', user: null, notice: 'Removed the saved session from this browser. You can revoke it in Telegram Settings → Devices.' });
    }),
    async callChat(action, payload = {}) {
      const c = await client();
      if (typeof c[action] === 'function') return c[action](payload);
      throw new Error(`Unsupported chat action: ${action}`);
    },
    async destroy() { disposed = true; cancelQr(); listeners.clear(); await transport?.close(); },
  };
  return api;
}
