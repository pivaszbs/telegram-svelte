import TLDeserialization, { TLSerialization } from '../lib/tl_utils';
import MtpTimeManagerModule from './MtpTimeManager';
import $http from '../Etc/angular/$http';
import $timeout from '../Etc/angular/$timeout';
import { extend } from '../Etc/Helper';
import { dT, tsNow } from '../lib/utils';
import {
	bytesToHex,
	bytesCmp,
	sha1BytesSync,
	aesDecryptSync,
	bytesToArrayBuffer,
	bytesFromHex,
	aesEncryptSync,
	bytesXor,
	nextRandomInt,
	rsaEncrypt,
} from '../lib/bin_utils';
import MtpRsaKeysManagerModule from './MtpRsaKeysManager';
import CryptoWorkerModule from '../Etc/CryptoWorker';
import MtpSecureRandom from './MtpSecureRandom';
import MtpDcConfiguratorModule from './MtpDcConfigurator';
import { Config } from '../lib/config';
import WebSocketManager from '../Etc/angular/$websocket';

export default class MtpAuthorizerModule {
	chromeMatches = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/);
	chromeVersion = (this.chromeMatches && parseFloat(this.chromeMatches[1])) || false;
	xhrSendBuffer = !('ArrayBufferView' in window) && (!this.chromeVersion || this.chromeVersion < 30);

	MtpTimeManager = new MtpTimeManagerModule();
	MtpRsaKeysManager = new MtpRsaKeysManagerModule();
	CryptoWorker = new CryptoWorkerModule();
	MtpDcConfigurator = new MtpDcConfiguratorModule();

	pendingCallbacks = [];

	handleWebSocket = data => {
		if (this.pendingCallbacks.length > 0) {
			this.pendingCallbacks.shift()({ data: data.buffer });
		}
	};

	mtpSendPlainRequest = (dcID, requestBuffer) => {
		const requestLength = requestBuffer.byteLength,
			requestArray = new Int32Array(requestBuffer);

		const header = new TLSerialization();
		const msg_id = this.MtpTimeManager.generateID();
		header.storeLongP(0, 0, 'auth_key_id'); // Auth key
		header.storeLong(msg_id, 'msg_id'); // Msg_id
		header.storeInt(requestLength, 'request_length');

		const headerBuffer = header.getBuffer(),
			headerArray = new Int32Array(headerBuffer),
			headerLength = headerBuffer.byteLength;

		const resultBuffer = new ArrayBuffer(headerLength + requestLength),
			resultArray = new Int32Array(resultBuffer);

		resultArray.set(headerArray);
		resultArray.set(requestArray, headerArray.length);

		const requestData = resultArray;
		let requestPromise;
		const url = this.MtpDcConfigurator.chooseServer(dcID);
		const baseError = { code: 406, type: 'NETWORK_BAD_RESPONSE', url: url };

		this.socket = new WebSocketManager(url, this.handleWebSocket);

		try {
			// requestPromise = $http.post(url, requestData, {
			// 	responseType: 'arraybuffer',
			// 	transformRequest: null,
			// });

			this.socket.sendData(requestData);
			// this.socket.sendTestRequest();
			// this.socket.sendAuthMessage();
			// this.socket.getTestRequest();
			let pendingPromise;
			requestPromise = new Promise(resolve => {
				pendingPromise = resolve;
			});

			this.pendingCallbacks.push(pendingPromise);
		} catch (e) {
			Config.Modes.debug && console.log('SMTH wrong with http');
			requestPromise = Promise.reject(extend(baseError, { originalError: e }));
		}

		return requestPromise.then(
			result => {
				if (!result.data || !result.data.byteLength) {
					Config.Modes.debug && console.log('SMTH wrong with byteLen');
					return Promise.reject(baseError);
				}

				let deserializer, auth_key_id, msg_id, msg_len;

				try {
					deserializer = new TLDeserialization(result.data, { mtproto: true });
					auth_key_id = deserializer.fetchLong('auth_key_id');
					msg_id = deserializer.fetchLong('msg_id');
					msg_len = deserializer.fetchInt('msg_len');
				} catch (e) {
					Config.Modes.debug && console.log('SMTH wrong with deser');
					return Promise.reject(extend(baseError, { originalError: e }));
				}

				return deserializer;
			},
			error => {
				if (!error.message && !error.type) {
					Config.Modes.debug && console.log('SMTH wrong with shit');
					error = extend(baseError, { originalError: error });
				}
				Config.Modes.debug && console.log('SMTH wrong with errrrror');
				return Promise.reject(error);
			}
		);
	};

	mtpSendReqPQ = auth =>
		new Promise((resolve, reject) => {
			const request = new TLSerialization({ mtproto: true });

			request.storeMethod('req_pq', { nonce: auth.nonce });

			Config.Modes.debug && console.log(dT(), 'Send req_pq', bytesToHex(auth.nonce));
			this.mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(
				deserializer => {
					const response = deserializer.fetchObject('ResPQ');

					if (response._ != 'resPQ') {
						Config.Modes.debug && console.log('resPQ response invalid: ' + response._);
						throw new Error('resPQ response invalid: ' + response._);
					}

					if (!bytesCmp(auth.nonce, response.nonce)) {
						Config.Modes.debug && console.log('resPQ nonce mismatch');
						throw new Error('resPQ nonce mismatch');
					}

					auth.serverNonce = response.server_nonce;
					auth.pq = response.pq;
					auth.fingerprints = response.server_public_key_fingerprints;

					Config.Modes.debug &&
						console.log(
							dT(),
							'Got ResPQ',
							bytesToHex(auth.serverNonce),
							bytesToHex(auth.pq),
							auth.fingerprints
						);

					auth.publicKey = this.MtpRsaKeysManager.select(auth.fingerprints);

					if (!auth.publicKey) {
						Config.Modes.debug && console.log('No public key found');
						throw new Error('No public key found');
					}

					Config.Modes.debug && console.log(dT(), 'PQ factorization start', auth.pq);
					this.CryptoWorker.factorize(auth.pq).then(
						pAndQ => {
							auth.p = pAndQ[0];
							auth.q = pAndQ[1];
							Config.Modes.debug && (dT(), 'PQ factorization done', pAndQ[2]);
							this.mtpSendReqDhParams(auth).then(result => {
								resolve(result);
							});
						},
						error => {
							Config.Modes.debug && console.log('Worker error', error, error.stack);
							reject(error);
						}
					);
				},
				error => {
					Config.Modes.debug && console.error(dT(), 'req_pq error', error);
					reject(error);
				}
			);

			$timeout(() => {
				this.MtpRsaKeysManager.prepare();
			});
		});

	mtpSendReqDhParams = auth =>
		new Promise((resolve, reject) => {
			auth.newNonce = new Array(32);
			MtpSecureRandom(auth.newNonce);

			const data = new TLSerialization({ mtproto: true });
			data.storeObject(
				{
					_: 'p_q_inner_data',
					pq: auth.pq,
					p: auth.p,
					q: auth.q,
					nonce: auth.nonce,
					server_nonce: auth.serverNonce,
					new_nonce: auth.newNonce,
				},
				'P_Q_inner_data',
				'DECRYPTED_DATA'
			);

			const dataWithHash = sha1BytesSync(data.getBuffer()).concat(data.getBytes());

			const request = new TLSerialization({ mtproto: true });
			request.storeMethod('req_DH_params', {
				nonce: auth.nonce,
				server_nonce: auth.serverNonce,
				p: auth.p,
				q: auth.q,
				public_key_fingerprint: auth.publicKey.fingerprint,
				encrypted_data: rsaEncrypt(auth.publicKey, dataWithHash),
			});

			Config.Modes.debug && console.log(dT(), 'Send req_DH_params');
			this.mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(
				deserializer => {
					const response = deserializer.fetchObject('Server_DH_Params', 'RESPONSE');

					if (response._ != 'server_DH_params_fail' && response._ != 'server_DH_params_ok') {
						reject(new Error('Server_DH_Params response invalid: ' + response._));
						return false;
					}

					if (!bytesCmp(auth.nonce, response.nonce)) {
						reject(new Error('Server_DH_Params nonce mismatch'));
						return false;
					}

					if (!bytesCmp(auth.serverNonce, response.server_nonce)) {
						reject(new Error('Server_DH_Params server_nonce mismatch'));
						return false;
					}

					if (response._ == 'server_DH_params_fail') {
						const newNonceHash = sha1BytesSync(auth.newNonce).slice(-16);
						if (!bytesCmp(newNonceHash, response.new_nonce_hash)) {
							reject(new Error('server_DH_params_fail new_nonce_hash mismatch'));
							return false;
						}
						reject(new Error('server_DH_params_fail'));
						return false;
					}

					try {
						this.mtpDecryptServerDhDataAnswer(auth, response.encrypted_answer);
					} catch (e) {
						reject(e);
						return false;
					}

					this.mtpSendSetClientDhParams(auth).then(result => {
						resolve(result);
					});
				},
				error => {
					reject(error);
				}
			);
		});

	mtpDecryptServerDhDataAnswer = (auth, encryptedAnswer) => {
		auth.localTime = tsNow();

		auth.tmpAesKey = sha1BytesSync(auth.newNonce.concat(auth.serverNonce)).concat(
			sha1BytesSync(auth.serverNonce.concat(auth.newNonce)).slice(0, 12)
		);
		auth.tmpAesIv = sha1BytesSync(auth.serverNonce.concat(auth.newNonce))
			.slice(12)
			.concat(sha1BytesSync([].concat(auth.newNonce, auth.newNonce)), auth.newNonce.slice(0, 4));

		const answerWithHash = aesDecryptSync(encryptedAnswer, auth.tmpAesKey, auth.tmpAesIv);

		const hash = answerWithHash.slice(0, 20);
		const answerWithPadding = answerWithHash.slice(20);
		const buffer = bytesToArrayBuffer(answerWithPadding);

		const deserializer = new TLDeserialization(buffer, { mtproto: true });
		const response = deserializer.fetchObject('Server_DH_inner_data');

		if (response._ != 'server_DH_inner_data') {
			throw new Error('server_DH_inner_data response invalid: ' + constructor);
		}

		if (!bytesCmp(auth.nonce, response.nonce)) {
			throw new Error('server_DH_inner_data nonce mismatch');
		}

		if (!bytesCmp(auth.serverNonce, response.server_nonce)) {
			throw new Error('server_DH_inner_data serverNonce mismatch');
		}

		Config.Modes.debug && console.log(dT(), 'Done decrypting answer');
		auth.g = response.g;
		auth.dhPrime = response.dh_prime;
		auth.gA = response.g_a;
		auth.serverTime = response.server_time;
		auth.retry = 0;

		const offset = deserializer.getOffset();

		if (!bytesCmp(hash, sha1BytesSync(answerWithPadding.slice(0, offset)))) {
			throw new Error('server_DH_inner_data SHA1-hash mismatch');
		}

		this.MtpTimeManager.applyServerTime(auth.serverTime, auth.localTime);
	};

	mtpSendSetClientDhParams = auth =>
		new Promise((resolve, reject) => {
			const gBytes = bytesFromHex(auth.g.toString(16));

			auth.b = new Array(256);
			MtpSecureRandom(auth.b);

			this.CryptoWorker.modPow(gBytes, auth.b, auth.dhPrime).then(
				gB => {
					const data = new TLSerialization({ mtproto: true });
					data.storeObject(
						{
							_: 'client_DH_inner_data',
							nonce: auth.nonce,
							server_nonce: auth.serverNonce,
							retry_id: [0, auth.retry++],
							g_b: gB,
						},
						'Client_DH_Inner_Data'
					);

					const dataWithHash = sha1BytesSync(data.getBuffer()).concat(data.getBytes());

					const encryptedData = aesEncryptSync(dataWithHash, auth.tmpAesKey, auth.tmpAesIv);

					const request = new TLSerialization({ mtproto: true });
					request.storeMethod('set_client_DH_params', {
						nonce: auth.nonce,
						server_nonce: auth.serverNonce,
						encrypted_data: encryptedData,
					});

					Config.Modes.debug && console.log(dT(), 'Send set_client_DH_params');
					this.mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(
						deserializer => {
							const response = deserializer.fetchObject('Set_client_DH_params_answer');

							if (
								response._ != 'dh_gen_ok' &&
								response._ != 'dh_gen_retry' &&
								response._ != 'dh_gen_fail'
							) {
								reject(new Error('Set_client_DH_params_answer response invalid: ' + response._));
								return false;
							}

							if (!bytesCmp(auth.nonce, response.nonce)) {
								reject(new Error('Set_client_DH_params_answer nonce mismatch'));
								return false;
							}

							if (!bytesCmp(auth.serverNonce, response.server_nonce)) {
								reject(new Error('Set_client_DH_params_answer server_nonce mismatch'));
								return false;
							}

							this.CryptoWorker.modPow(auth.gA, auth.b, auth.dhPrime).then(
								authKey => {
									const authKeyHash = sha1BytesSync(authKey),
										authKeyAux = authKeyHash.slice(0, 8),
										authKeyID = authKeyHash.slice(-8);

									Config.Modes.debug &&
										console.log(dT(), 'Got Set_client_DH_params_answer', response._);

									let newNonceHash1, newNonceHash2, newNonceHash3, serverSalt;

									switch (response._) {
										case 'dh_gen_ok':
											newNonceHash1 = sha1BytesSync(auth.newNonce.concat([1], authKeyAux)).slice(
												-16
											);

											if (!bytesCmp(newNonceHash1, response.new_nonce_hash1)) {
												reject(
													new Error('Set_client_DH_params_answer new_nonce_hash1 mismatch')
												);
												return false;
											}

											serverSalt = bytesXor(
												auth.newNonce.slice(0, 8),
												auth.serverNonce.slice(0, 8)
											);
											// console.log('Auth successfull!', authKeyID, authKey, serverSalt);

											auth.authKeyID = authKeyID;
											auth.authKey = authKey;
											auth.serverSalt = serverSalt;

											resolve(auth);
											break;

										case 'dh_gen_retry':
											newNonceHash2 = sha1BytesSync(auth.newNonce.concat([2], authKeyAux)).slice(
												-16
											);
											if (!bytesCmp(newNonceHash2, response.new_nonce_hash2)) {
												reject(
													new Error('Set_client_DH_params_answer new_nonce_hash2 mismatch')
												);
												return false;
											}

											mtpSendSetClientDhParams(auth).then(result => {
												resolve(result);
											});
											break;

										case 'dh_gen_fail':
											newNonceHash3 = sha1BytesSync(auth.newNonce.concat([3], authKeyAux)).slice(
												-16
											);
											if (!bytesCmp(newNonceHash3, response.new_nonce_hash3)) {
												reject(
													new Error('Set_client_DH_params_answer new_nonce_hash3 mismatch')
												);
												return false;
											}

											reject(new Error('Set_client_DH_params_answer fail'));
											return false;
									}
								},
								error => {
									reject(error);
								}
							);
						},
						error => {
							reject(error);
						}
					);
				},
				error => {
					reject(error);
				}
			);
		});

	cached = {};

	mtpAuth = dcID => {
		if (this.cached[dcID] !== undefined) {
			Config.Modes.debug && console.log('Returning existing one');
			return Promise.resolve(this.cached[dcID]);
		}

		const nonce = [];
		for (let i = 0; i < 16; i++) {
			nonce.push(nextRandomInt(0xff));
		}

		if (!this.MtpDcConfigurator.chooseServer(dcID)) {
			return Promise.reject(new Error('No server found for dc ' + dcID));
		}

		const auth = {
			dcID: dcID,
			nonce: nonce,
		};

		return new Promise((resolve, reject) => {
			$timeout(() => {
				return this.mtpSendReqPQ(auth);
			})
				.then(result => {
					this.cached[dcID] = result;

					Config.Modes.debug && console.log('DATA', this.cached[dcID]);
					resolve(this.cached[dcID]);
				})
				.catch(() => {
					Config.Modes.debug && console.log('DELETED');
					delete this.cached[dcID];
					reject('DELETED');
				});
		});
	};

	//legacy
	auth = this.mtpAuth;
}
