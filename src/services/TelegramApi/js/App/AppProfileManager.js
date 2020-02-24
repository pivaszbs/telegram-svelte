import AppsChatsManagerModule from './AppChatsManager';
import AppUsersManagerModule from './AppUsersManager';
import { dT } from '../lib/utils';
import MtpApiManagerModule from '../Mtp/MtpApiManager';

export default class AppProfileManagerModule {

	MtpApiManager = MtpApiManagerModule();
	options = { dcID: 2, createNetworker: true };

	/**
     * @function sendCode
     * @description Send code by phone number
     * @param {String} phone_number - Phone number
     * @example <%example:sendCode.js%>
     */
	sendCode = async phone => {
		const result = await this.MtpApiManager.invokeApi('sendCode', 'auth.sendCode', {
			phone_number: phone,
			// sms_type: 5,
			api_id: Config.App.id,
			api_hash: Config.App.hash,
			lang_code: navigator.language || 'en',
			settings: {
				_: 'codeSettings',
			},
		}, this.options);
		this.phone_code_hash = result.phone_code_hash;
		this.next_code_type = result.next_type;
		return {
			phone_hash: this.phone_code_hash,
			next_code_type: this.next_code_type
		};
	}
}
