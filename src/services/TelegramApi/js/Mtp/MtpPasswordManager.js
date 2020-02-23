import MtpApiManagerModule from './MtpApiManager';
import { bufferConcat } from '../lib/bin_utils';
import CryptoWorkerModule from '../Etc/CryptoWorker';
import MtpSecureRandom from './MtpSecureRandom';
import { getParams } from '../lib/telegram_srp';
import { Config } from '../lib/config';

export default class MtpPasswordManagerModule {
	MtpApiManager = MtpApiManagerModule();
	CryptoWorker = new CryptoWorkerModule();

	getState = options =>
		this.MtpApiManager.invokeApi('account.getPassword', {}, options).then(result => {
			Config.Modes.debug && console.log(result);
			return result;
		});

	updateSettings = (state, settings) => {
		Config.Modes.debug && console.log(settings);

		let currentHashPromise;
		let newHashPromise;

		const params = {
			new_settings: {
				_: 'account.passwordInputSettings',
				flags: 0,
				hint: settings.hint || '',
			},
		};

		if (typeof settings.cur_password === 'string' && state.current_salt && settings.cur_password.length > 0) {
			currentHashPromise = this.makePasswordHash(state.current_salt, settings.cur_password);
		} else {
			currentHashPromise = Promise.resolve([]);
		}

		if (typeof settings.new_password === 'string' && settings.new_password.length > 0) {
			const saltRandom = new Array(8);
			const newSalt = bufferConcat(state.new_salt, saltRandom);
			MtpSecureRandom(saltRandom);
			newHashPromise = this.makePasswordHash(newSalt, settings.new_password);
			params.new_settings.new_salt = newSalt;
			params.new_settings.flags |= 1;
		} else {
			if (typeof settings.new_password === 'string') {
				params.new_settings.flags |= 1;
				params.new_settings.new_salt = [];
			}
			newHashPromise = Promise.resolve([]);
		}

		if (typeof settings.email === 'string') {
			params.new_settings.flags |= 2;
			params.new_settings.email = settings.email || '';
		}

		return Promise.all([currentHashPromise, newHashPromise]).then(hashes => {
			params.current_password_hash = hashes[0];
			params.new_settings.new_password_hash = hashes[1];

			return this.MtpApiManager.invokeApi('account.updatePasswordSettings', params);
		});
	};

	check = (state, password, options) =>
		this.makePasswordHash(password, state)
			.then(passwordHash => {
				return this.MtpApiManager.invokeApi(
					'auth.checkPassword',
					{
						password: {
							_: 'inputCheckPasswordSRP',
							srp_id: state.srp_id,
							...passwordHash,
						},
					},
					options
				);
			})
			.catch(err => {
				console.error('Some shit happened', err);
			});

	requestRecovery = (state, options) => this.MtpApiManager.invokeApi('auth.requestPasswordRecovery', {}, options);

	recover = (code, options) =>
		this.MtpApiManager.invokeApi(
			'auth.recoverPassword',
			{
				code: code,
			},
			options
		);

	makePasswordHash = async (t, e) => {
		if (!t.length) {
			return;
		}
		// this.checkPasswordBtn.setLoading(!0);
		return await getParams(
			t,
			e.current_algo.g,
			e.current_algo.p,
			e.current_algo.salt1,
			e.current_algo.salt2,
			e.srp_B
		);
	};
}
