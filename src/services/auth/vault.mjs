const APP_KEY = 'telegram-svelte:app';
export function createVault(local, tab) {
  const key = id => `telegram-svelte:session:${id}`;
  return {
    config() {
      try { return JSON.parse(tab.getItem(APP_KEY) || local.getItem(APP_KEY) || 'null'); }
      catch { return null; }
    },
    configure(config, remember) {
      local.removeItem(APP_KEY); tab.removeItem(APP_KEY);
      (remember ? local : tab).setItem(APP_KEY, JSON.stringify(config));
    },
    read(id) { return tab.getItem(key(id)) || local.getItem(key(id)) || ''; },
    save(id, value, remember) {
      local.removeItem(key(id)); tab.removeItem(key(id));
      (remember ? local : tab).setItem(key(id), value);
    },
    clear(id) { local.removeItem(key(id)); tab.removeItem(key(id)); },
  };
}
