// Deterministic sample data. This module is only substituted in the preview/test build.
const rpc = text => Object.assign(new Error(text), { text });
export async function createTransport() {
  let signedIn = false;
  const me = { id: '123456789', displayName: 'Alex Morgan', username: 'alex_demo' };
  const sent = { type: 'app', phoneCodeHash: 'sample-code-hash', nextType: 'sms', timeout: 1, length: 5 };
  return {
    prepare: async () => {},
    signInQr: ({ signal, onUrlUpdated, onScanned }) => new Promise((resolve, reject) => {
      const scenario = new URLSearchParams(location.search).get('qr');
      const publish = token => onUrlUpdated(`tg://login?token=sample-preview-${token}`, new Date(Date.now() + 60000));
      publish('not-a-real-login');
      const timer = scenario === 'refresh' ? setTimeout(() => publish('refreshed-not-a-real-login'), 1200) : null;
      const finish = () => {
        onScanned();
        if (scenario === 'password') reject(rpc('SESSION_PASSWORD_NEEDED'));
        else { signedIn = true; resolve(me); }
      };
      // Only the preview exposes a simulated scan, never the production bundle.
      window.previewScanQr = finish;
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        if (window.previewScanQr === finish) delete window.previewScanQr;
        reject(new DOMException('Canceled', 'AbortError'));
      }, { once: true });
    }),
    async sendCode(phone) {
      if (phone === '+447700900000') throw rpc('PHONE_NUMBER_INVALID');
      if (phone === '+447700900001') throw Object.assign(rpc('FLOOD_WAIT_%d'), { seconds: 30 });
      return sent;
    },
    resendCode: async () => ({ ...sent, type: 'sms', phoneCodeHash: 'sample-resend-hash' }),
    async signIn(phone, hash, code) {
      if (code === '11111') throw rpc('PHONE_CODE_INVALID');
      if (code === '33333') throw rpc('PHONE_CODE_EXPIRED');
      if (code === '22222') { signedIn = true; return me; }
      throw rpc('SESSION_PASSWORD_NEEDED');
    },
    checkPassword: async password => { if (password !== 'preview-password') throw rpc('PASSWORD_HASH_INVALID'); signedIn = true; return me; },
    getPasswordHint: async () => 'Use preview-password in this sample flow',
    getMe: async () => { if (!signedIn) throw rpc('AUTH_KEY_UNREGISTERED'); return me; },
    importSession: async value => { if (value === 'sample-expired-session') throw rpc('SESSION_REVOKED'); signedIn = value === 'sample-session'; },
    exportSession: async () => 'sample-session',
    logOut: async () => { signedIn = false; },
    close: async () => {},
  };
}
