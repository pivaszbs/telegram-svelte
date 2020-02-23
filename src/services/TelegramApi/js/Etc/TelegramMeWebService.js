import StorageModule from './Storage';
import { tsNow } from '../lib/utils';

export default class TelegramMeWebServiceModule {
	disabled = location.protocol != 'http:' && location.protocol != 'https:';

	Storage = StorageModule();

	setAuthorized(canRedirect) {
		if (this.disabled) {
			return false;
		}

		this.Storage.get('tgme_sync').then(curValue => {
			const ts = tsNow(true);
			if (canRedirect && curValue && curValue.canRedirect == canRedirect && curValue.ts + 86400 > ts) {
				return false;
			}

			this.Storage.set({ tgme_sync: { canRedirect: canRedirect, ts: ts } });

			const script = document.createElement('script');
			script.addEventListener('load error', () => {
				script.remove();
			});
			script.setAttribute('src', '//telegram.me/_websync_?authed=' + (canRedirect ? '1' : '0'));

			document.body.appendChild(script);
		});
	}
}
