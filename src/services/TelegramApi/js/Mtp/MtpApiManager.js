import MtpSingleInstanceServiceModule from './MtpSingleInstanceService';
import StorageModule from '../Etc/Storage';
import TelegramMeWebServiceModule from '../Etc/TelegramMeWebService';
import { extend, isObject } from '../Etc/Helper';
import qSyncModule from '../Etc/qSync';
import { bytesFromHex, bytesToHex } from '../lib/bin_utils';
import MtpNetworkerFactoryModule from './MtpNetworkerFactory';
import MtpAuthorizerModule from './MtpAuthorizer';
import { dT, tsNow } from '../lib/utils';
import { Config } from '../lib/config';

export default function MtpApiManagerModule() {
	const cachedNetworkers = {};
	const cachedUploadNetworkers = {};
	const cachedExportPromise = {};
	let baseDcID = false;

	let telegramMeNotified;

	let MtpSingleInstanceService = MtpSingleInstanceServiceModule();
	let MtpNetworkerFactory = MtpNetworkerFactoryModule();
	let MtpAuthorizer = new MtpAuthorizerModule();
	let Storage = StorageModule();
	let TelegramMeWebService = new TelegramMeWebServiceModule();
	let qSync = new qSyncModule();

	MtpSingleInstanceService.start();

	Storage.get('dc').then(dcID => {
		if (dcID) {
			baseDcID = dcID;
		}
	});

	const telegramMeNotify = newValue => {
		if (telegramMeNotified !== newValue) {
			telegramMeNotified = newValue;
			TelegramMeWebService.setAuthorized(telegramMeNotified);
		}
	};

	const mtpSetUserAuth = (dcID, userAuth) => {
		const fullUserAuth = extend({ dcID: dcID }, userAuth);
		Storage.set({
			dc: dcID,
			user_auth: fullUserAuth,
		});
		telegramMeNotify(true);

		baseDcID = dcID;
	};

	const mtpLogOut = () => {
		const storageKeys = [];
		for (let dcID = 1; dcID <= 5; dcID++) {
			storageKeys.push('dc' + dcID + '_auth_key');
		}

		return Storage.get.apply(Storage, storageKeys).then(storageResult => {
			const logoutPromises = [];
			for (let i = 0; i < storageResult.length; i++) {
				if (storageResult[i]) {
					logoutPromises.push(mtpInvokeApi('auth.logOut', {}, { dcID: i + 1 }));
				}
			}
			return Promise.all(logoutPromises).then(
				() => {
					Storage.remove('dc', 'user_auth');
					baseDcID = false;
					telegramMeNotify(false);
				},
				error => {
					Storage.remove.apply(storageKeys);
					Storage.remove('dc', 'user_auth');
					baseDcID = false;
					error.handled = true;
					telegramMeNotify(false);
				}
			);
		});
	};

	const mtpGetNetworker = (dcID, options) => {
		options = options || {};

		const cache = options.fileUpload || options.fileDownload ? cachedUploadNetworkers : cachedNetworkers;
		if (!dcID) {
			throw new Exception('get Networker without dcID');
		}

		if (cache[dcID] !== undefined) {
			return qSync.when(cache[dcID]);
		}

		const akk = 'dc' + dcID + '_auth_key',
			ssk = 'dc' + dcID + '_server_salt';

		return Storage.get(akk, ssk).then(result => {
			if (cache[dcID] !== undefined) {
				return cache[dcID];
			}

			var authKeyHex = result[0],
				serverSaltHex = result[1];
			// console.log('ass', dcID, authKeyHex, serverSaltHex);
			if (authKeyHex && authKeyHex.length == 512) {
				const authKey = bytesFromHex(authKeyHex);
				const serverSalt = bytesFromHex(serverSaltHex);

				return (cache[dcID] = MtpNetworkerFactory.getNetworker(dcID, authKey, serverSalt, options));
			}

			if (!options.createNetworker) {
				return Promise.reject({ type: 'AUTH_KEY_EMPTY', code: 401 });
			}

			return MtpAuthorizer.auth(dcID).then(
				auth => {
					const storeObj = {};
					storeObj[akk] = bytesToHex(auth.authKey);
					storeObj[ssk] = bytesToHex(auth.serverSalt);
					Storage.set(storeObj);

					Config.Modes.debug && console.log('AUTH', auth);

					return (cache[dcID] = MtpNetworkerFactory.getNetworker(
						dcID,
						auth.authKey,
						auth.serverSalt,
						options
					));
				},
				error => {
					Config.Modes.debug && ('Get networker error', error, error.stack);
					return Promise.reject(error);
				}
			);
		});
	};

	const mtpInvokeApi = (method, params, options) => {
		options = options || {};

		return new Promise((resolve, reject) => {
			const rejectPromise = error => {
				if (!error) {
					error = { type: 'ERROR_EMPTY' };
				} else if (!isObject(error)) {
					error = { message: error };
				}
				reject(error);

				if (!options.noErrorBox) {
					error.input = method;
					error.stack =
						(error.originalError && error.originalError.stack) || error.stack || new Error().stack;
					setTimeout(function() {
						if (!error.handled) {
							if (error.code == 401 && error.type !== 'SESSION_PASSWORD_NEEDED') {
								mtpLogOut();
								// console.error('THERE SHOULD BE LOG OUT!!!!!!!!!');
							}
							error.handled = true;
						}
					}, 100);
				}
			};

			let dcID, networkerPromise;

			let cachedNetworker;
			let stack = new Error().stack;
			if (!stack) {
				try {
					window.unexistingFunction();
				} catch (e) {
					stack = e.stack || '';
				}
			}

			const performRequest = networker => {
				return (cachedNetworker = networker).wrapApiCall(method, params, options).then(
					result => {
						resolve(result);
					},
					error => {
						if (Config.Modes.debug) {
							console.error(dT(), 'Error', error.code, error.type, baseDcID, dcID);
						}
						if (error.code == 401 && baseDcID == dcID && error.type !== 'SESSION_PASSWORD_NEEDED') {
							Storage.remove('dc', 'user_auth');
							telegramMeNotify(false);
							rejectPromise(error);
						} else if (error.code == 401 && baseDcID && dcID != baseDcID) {
							Config.Modes.debug && console.log('Exporting auth...');
							if (cachedExportPromise[dcID] === undefined) {
								const exportPromise = new Promise((exportResolve, exportReject) => {
									mtpInvokeApi(
										'auth.exportAuthorization',
										{ dc_id: dcID },
										{ noErrorBox: true }
									).then(
										exportedAuth => {
											mtpInvokeApi(
												'auth.importAuthorization',
												{
													id: exportedAuth.id,
													bytes: exportedAuth.bytes,
												},
												{ dcID: dcID, noErrorBox: true }
											).then(
												() => {
													exportResolve();
												},
												e => {
													exportReject(e);
												}
											);
										},
										e => {
											exportReject(e);
										}
									);
								});

								cachedExportPromise[dcID] = exportPromise;
							}

							cachedExportPromise[dcID].then(() => {
								(cachedNetworker = networker).wrapApiCall(method, params, options).then(result => {
									resolve(result);
								}, rejectPromise);
							}, rejectPromise);
						} else if (error.code == 303) {
							let fileMigrateDC = error.type.match(/^(|FILE_MIGRATE_)(\d+)/);
							if (fileMigrateDC) {
								fileMigrateDC = Number(fileMigrateDC[2]);
								if (fileMigrateDC !== dcID) {
									// const newOptions = {
									// 	dcID: fileMigrateDC,
									// 	fileDownload: true,
									// 	createNetworker: true,
									// 	...options,
									// };
									// baseDcID = fileMigrateDC;
									if (cachedExportPromise[fileMigrateDC] === undefined) {
										const exportPromise = new Promise((exportResolve, exportReject) => {
											mtpInvokeApi(
												'auth.exportAuthorization',
												{ dc_id: fileMigrateDC },
												{ noErrorBox: true }
											).then(
												exportedAuth => {
													Config.Modes.debug && console.log(exportedAuth);
													mtpInvokeApi(
														'auth.importAuthorization',
														{
															id: exportedAuth.id,
															bytes: new Uint8Array(exportedAuth.bytes),
														},
														{ dcID: fileMigrateDC, noErrorBox: true, createNetworker: true }
													).then(
														() => {
															exportResolve();
														},
														e => {
															console.error('INport rejected', e);
															exportReject(e);
														}
													);
												},
												e => {
													exportReject(e);
												}
											);
										});
										cachedExportPromise[fileMigrateDC] = exportPromise;
									}

									cachedExportPromise[fileMigrateDC].then(() => {
										mtpGetNetworker(fileMigrateDC, options).then(networker => {
											networker.wrapApiCall(method, params, options).then(
												result => {
													resolve(result);
												},
												e => {
													Config.Modes.debug && console.log('WRAP FAILED', e);
													return rejectPromise;
												}
											);
										});
									}, rejectPromise);
								}
							} else {
								const newDcID = error.type.match(
									/^(PHONE_MIGRATE_|NETWORK_MIGRATE_|USER_MIGRATE_)(\d+)/
								)[2];
								if (newDcID != dcID) {
									if (options.dcID) {
										options.dcID = newDcID;
									} else {
										Storage.set({ dc: (baseDcID = newDcID) });
									}

									mtpGetNetworker(newDcID, options).then(networker => {
										networker.wrapApiCall(method, params, options).then(result => {
											resolve(result);
										}, rejectPromise);
									}, rejectPromise);
								}
							}
						} else if (!options.rawError && error.code == 420) {
							const waitTime = error.type.match(/^FLOOD_WAIT_(\d+)/)[1] || 10;
							if (waitTime > (options.timeout || 60)) {
								return rejectPromise(error);
							}
							setTimeout(() => {
								performRequest(cachedNetworker);
							}, waitTime * 1000);
						} else if (!options.rawError && (error.code == 500 || error.type == 'MSG_WAIT_FAILED')) {
							const now = tsNow();
							if (options.stopTime) {
								if (now >= options.stopTime) {
									return rejectPromise(error);
								}
							} else {
								options.stopTime = now + (options.timeout !== undefined ? options.timeout : 10) * 1000;
							}
							options.waitTime = options.waitTime ? Math.min(60, options.waitTime * 1.5) : 1;
							setTimeout(() => {
								performRequest(cachedNetworker);
							}, options.waitTime * 1000);
						} else {
							rejectPromise(error);
						}
					}
				);
			};

			dcID = options.dcID || baseDcID;
			if (dcID) {
				mtpGetNetworker(dcID, options).then(performRequest, rejectPromise);
			} else {
				Storage.get('dc').then(baseDcID => {
					mtpGetNetworker((dcID = baseDcID || 2), options).then(performRequest, rejectPromise);
				});
			}
		});
	};

	const mtpGetUserID = () => {
		return Storage.get('user_auth').then(auth => {
			telegramMeNotify((auth && auth.id > 0) || false);
			return auth.id || 0;
		});
	};

	const getBaseDcID = () => {
		return baseDcID || false;
	};

	return {
		telegramMeNotify,
		invokeApi: mtpInvokeApi,
		getUserID: mtpGetUserID,
		getNetworker: mtpGetNetworker,
		setUserAuth: mtpSetUserAuth,
		logOut: mtpLogOut,
		getBaseDcID,
	};
}
