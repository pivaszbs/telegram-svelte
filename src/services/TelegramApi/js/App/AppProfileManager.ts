import { dT } from '../lib/utils';
import MtpApiManagerModule from '../Mtp/MtpApiManager';
import { Config } from '../lib/config';
import MtpPasswordManagerModule from '../Mtp/MtpPasswordManager';

interface UserInfo {
	id: number,
	first_name: string,
	second_name: string | undefined,
	username: string,
	phone: string,
	photo: object,
	status: string | undefined
}

interface UserEmpty {
}

export default class AppProfileManagerModule {
	MtpApiManager = MtpApiManagerModule();
	MtpPasswordManager = new MtpPasswordManagerModule();

	options = { dcID: 2, createNetworker: true };

	phone: string;
	phone_code: string;
	phone_code_hash: string;
	next_code_type: string;

	user: UserInfo;

	getProfile = () : UserInfo | UserEmpty => {
		if (this.user) {
			return this.user;
		}
		return {}
	}

	getProfileId = () : number => {
		return this.user ? this.user.id : -1;
	}

	setUser (user : UserInfo) {
		this.MtpApiManager.setUserAuth(this.options.dcID, {
			id: user.id,
		});

		this.user = {
			...user
		}
	}

	sendCode = async (phone: string) => {
		const result = await this.MtpApiManager.invokeApi(
			'auth.sendCode',
			{
				phone_number: phone,
				// sms_type: 5,
				api_id: Config.App.id,
				api_hash: Config.App.hash,
				lang_code: navigator.language || 'en',
				settings: {
					_: 'codeSettings',
				},
			},
			this.options
		);
		this.phone_code_hash = result.phone_code_hash;
		this.next_code_type = result.next_type;
		this.phone = phone;
		return {
			phone_hash: this.phone_code_hash,
			next_code_type: this.next_code_type,
		};
	};

	signIn = async (code: string) => {
		const result = await this.MtpApiManager.invokeApi(
			'auth.signIn',
			{
				phone_number: this.phone,
				phone_code_hash: this.phone_code_hash,
				phone_code: code,
			},
			this.options
		);
		if (result._ === 'auth.authorizationSignUpRequired') {
			throw 'PHONE_NUMBER_UNOCCUPIED';
		}

		this.setUser(result.user);
		return this.user;
	}

	signUp = async (first_name: string, last_name?: string) => {
		const result = await this.MtpApiManager.invokeApi(
			'auth.signUp',
			{
				phone_number: this.phone,
				phone_code_hash: this.phone_code_hash,
				phone_code: this.phone_code,
				first_name: first_name || '',
				last_name: last_name || '',
			},
			this.options
		);

		this.setUser(result.user);

		return this.user;
	}

	signIn2FA = async (password : string) => {
		const currentState = await this.MtpPasswordManager.getState();
		const result = await this.MtpPasswordManager.check(currentState, password, this.options);
		
		this.setUser(result.user);
		
		return this.user;
	}

	logOut = () => {
		this.MtpApiManager.logOut();
		this.user = null;
	}

}
