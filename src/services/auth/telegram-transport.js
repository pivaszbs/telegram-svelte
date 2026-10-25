// This is the only module that knows the MTProto library. Loaded on first use.
export async function createTransport(config) {
  const { TelegramClient, MemoryStorage } = await import('@mtcute/web');
  const client = new TelegramClient({
    apiId: config.apiId, apiHash: config.apiHash,
    storage: new MemoryStorage(), updates: false,
    logLevel: 0,
    initConnectionOptions: { deviceModel: 'Web browser', appVersion: '0.2.0', systemVersion: navigator.platform || 'Web', langCode: navigator.language.split('-')[0] || 'en' },
  });
  const api = client.withParams({ timeout: 30000, floodSleepThreshold: 0, maxRetryCount: 1 });
  const user = value => ({ id: String(value.id), displayName: value.displayName, username: value.username || '' });
  const sent = value => value.phoneCodeHash ? { type: value.type, phoneCodeHash: value.phoneCodeHash, nextType: value.nextType, timeout: value.timeout, length: value.length } : { user: user(value) };
  return {
    prepare: () => client.prepare(),
    signInQr: async ({ signal, onUrlUpdated, onScanned }) => user(await api.signInQr({ abortSignal: signal, onUrlUpdated, onQrScanned: onScanned })),
    sendCode: async phone => sent(await api.sendCode({ phone })),
    resendCode: async (phone, phoneCodeHash) => sent(await api.resendCode({ phone, phoneCodeHash })),
    signIn: async (phone, phoneCodeHash, phoneCode) => user(await api.signIn({ phone, phoneCodeHash, phoneCode })),
    checkPassword: async password => user(await api.checkPassword(password)),
    getPasswordHint: () => api.getPasswordHint(),
    getMe: async () => user(await api.getMe()),
    importSession: async value => { await client.prepare(); try { await client.importSession(value); } catch { throw Object.assign(new Error('INVALID_SESSION'), { text: 'INVALID_SESSION' }); } },
    exportSession: () => client.exportSession(),
    logOut: () => api.logOut(),
    close: () => client.destroy(),
  };
}
