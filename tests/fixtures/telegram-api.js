// Test-only transport. Exercise the real screens without contacting Telegram.
export const telegramApi = {
  getUserInfo: async () => ({}),
  profileManager: {
    sendCode: async () => {},
    signIn: async () => { throw { type: 'SESSION_PASSWORD_NEEDED' }; },
    signIn2FA: async () => {},
  },
};
export default telegramApi;
