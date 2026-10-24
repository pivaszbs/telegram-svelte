// Deterministic sample data. This module is only substituted in the preview/test build.
const rpc = text => Object.assign(new Error(text), { text });
export async function createTransport() {
  let signedIn = false;
  const me = { id: '123456789', displayName: 'Alex Morgan', username: 'alex_demo' };
  const sent = { type: 'app', phoneCodeHash: 'sample-code-hash', nextType: 'sms', timeout: 1, length: 5 };
  return {
    prepare: async () => {},
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
