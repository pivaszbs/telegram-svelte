import { createAuth } from './machine.mjs';
import { createVault } from './vault.mjs';
import { createTransport } from './telegram-transport.js';
export const isPreview = __UI_PREVIEW__;
// Access storage lazily: browsers can throw when reading the storage property.
const local = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value), removeItem: key => localStorage.removeItem(key) };
const tab = { getItem: key => sessionStorage.getItem(key), setItem: (key, value) => sessionStorage.setItem(key, value), removeItem: key => sessionStorage.removeItem(key) };
const vault = createVault(local, tab);
const initial = __TELEGRAM_API_ID__ && __TELEGRAM_API_HASH__ ? { apiId: Number(__TELEGRAM_API_ID__), apiHash: __TELEGRAM_API_HASH__ } : vault.config();
export const auth = createAuth({ createTransport, vault });
export const initializeAuth = () => auth.initialize(initial);
