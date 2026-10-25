// Fake-server backed transport for preview and Playwright E2E tests via SvelteKit /api/fake-telegram.
import { callFakeTelegram } from '../../src/services/fake-rpc.mjs';

export async function createTransport() {
  return {
    prepare: () => callFakeTelegram('prepare'),
    signInQr: ({ signal, onUrlUpdated, onScanned }) => new Promise((resolve, reject) => {
      const scenario = new URLSearchParams(location.search).get('qr') || '';
      let timer = null;
      callFakeTelegram('qrStart', { scenario })
        .then(data => {
          if (signal.aborted) return;
          onUrlUpdated(data.tokenUrl, new Date(data.expiresAt));
          if (data.refreshedUrl) {
            timer = setTimeout(() => {
              if (!signal.aborted) {
                onUrlUpdated(data.refreshedUrl, new Date(Date.now() + 60000));
              }
            }, 1200);
          }
        })
        .catch(reject);

      const finish = async () => {
        onScanned();
        try {
          const user = await callFakeTelegram('qrScan', { scenario });
          resolve(user);
        } catch (error) {
          reject(error);
        }
      };
      // Only the preview exposes a simulated scan, never the production bundle.
      window.previewScanQr = finish;
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        if (window.previewScanQr === finish) delete window.previewScanQr;
        reject(new DOMException('Canceled', 'AbortError'));
      }, { once: true });
    }),
    sendCode: phone => callFakeTelegram('sendCode', { phone }),
    resendCode: (phone, phoneCodeHash) => callFakeTelegram('resendCode', { phone, phoneCodeHash }),
    signIn: (phone, phoneCodeHash, code) => callFakeTelegram('signIn', { phone, phoneCodeHash, code }),
    checkPassword: password => callFakeTelegram('checkPassword', { password }),
    getPasswordHint: () => callFakeTelegram('getPasswordHint'),
    getMe: () => callFakeTelegram('getMe'),
    importSession: value => callFakeTelegram('importSession', { session: value }),
    exportSession: () => callFakeTelegram('exportSession'),
    logOut: () => callFakeTelegram('logOut'),
    close: async () => {},
    getCachedBootstrap: () => callFakeTelegram('getCachedBootstrap'),
    getBootstrap: () => callFakeTelegram('getBootstrap'),
    loadMoreDialogs: payload => callFakeTelegram('loadMoreDialogs', payload),
    downloadAvatar: payload => callFakeTelegram('downloadAvatar', payload),
    openChat: payload => callFakeTelegram('openChat', payload),
    loadMoreHistory: payload => callFakeTelegram('loadMoreHistory', payload),
    sendMessage: payload => callFakeTelegram('sendMessage', payload),
    saveFolder: payload => callFakeTelegram('saveFolder', payload),
    createInviteLink: payload => callFakeTelegram('createInviteLink', payload),
    toggleStickerPack: payload => callFakeTelegram('toggleStickerPack', payload),
  };
}
