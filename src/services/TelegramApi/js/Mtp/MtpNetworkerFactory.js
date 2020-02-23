import {
	convertToUint8Array,
	sha1BytesSync,
	nextRandomInt,
	bytesToHex,
	bytesFromArrayBuffer,
	bytesToArrayBuffer,
	longToBytes,
	uintToInt,
	bigStringInt,
	bytesCmp,
} from '../lib/bin_utils';
import $interval from '../Etc/angular/$interval';
import $timeout from '../Etc/angular/$timeout';
import MtpSecureRandom from './MtpSecureRandom';
import MtpTimeManagerModule from './MtpTimeManager';
import { forEach, extend, isObject, toArray } from '../Etc/Helper';
import TLDeserialization, { TLSerialization } from '../lib/tl_utils';
import { Config } from '../lib/config';
import { dT, tsNow } from '../lib/utils';
import StorageModule from '../Etc/Storage';
import '../lib/polyfill';
import CryptoWorkerModule from '../Etc/CryptoWorker';
import $http from '../Etc/angular/$http';
import MtpDcConfiguratorModule from './MtpDcConfigurator';
import WebSocketManager from '../Etc/angular/$websocket';

export default function MtpNetworkerFactoryModule() {
	let updatesProcessor;
	let akStopped = false;
	const chromeMatches = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/);
	const chromeVersion = (chromeMatches && parseFloat(chromeMatches[1])) || false;
	const xhrSendBuffer = !('ArrayBufferView' in window) && (!chromeVersion || chromeVersion < 30);

	window.subscriptions = {};

	const subscribe = (id, handler) => {
		if (typeof handler == 'function') {
			subscriptions[id] = handler;
		}
	};

	const unSubscribe = id => {
		delete subscriptions[id];
	};

	class MtpNetworker {
		MtpTimeManager = new MtpTimeManagerModule();
		MtpDcConfigurator = new MtpDcConfiguratorModule();
		Storage = StorageModule();
		CryptoWorker = new CryptoWorkerModule();

		pendingPromises = [];

		handlePromise = data => {
			if (this.pendingPromises.length > 0) {
				this.pendingPromises.shift()({ data: data.buffer });
			}
		};

		constructor(dcID, authKey, serverSalt, options) {
			options = options || {};

			this.dcID = dcID;

			this.authKey = authKey;
			this.authKeyUint8 = convertToUint8Array(authKey);
			this.authKeyID = sha1BytesSync(authKey).slice(-8);

			this.serverSalt = serverSalt;

			this.upload = options.fileUpload || options.fileDownload || false;

			this.updateSession();

			this.checkConnectionPeriod = 0;

			this.sentMessages = {};
			this.serverMessages = [];

			this.pendingMessages = {};
			this.pendingAcks = [];
			this.pendingResends = [];
			this.connectionInited = false;

			const url = this.MtpDcConfigurator.chooseServer(this.dcID, this.upload);
			this.SocketManager = new WebSocketManager(url, this.handlePromise);

			// $interval(this.checkLongPoll.bind(this), 10000);

			// this.checkLongPoll();
		}

		updateSession = () => {
			this.seqNo = 0;
			this.sessionID = new Array(8);
			MtpSecureRandom(this.sessionID);
		};

		updateSentMessage = sentMessageID => {
			const sentMessage = this.sentMessages[sentMessageID];
			if (!sentMessage) {
				return false;
			}
			const self = this;
			if (sentMessage.container) {
				const newInner = [];
				forEach(sentMessage.inner, innerSentMessageID => {
					const innerSentMessage = self.updateSentMessage(innerSentMessageID);
					if (innerSentMessage) {
						newInner.push(innerSentMessage.msg_id);
					}
				});
				sentMessage.inner = newInner;
			}

			sentMessage.msg_id = this.MtpTimeManager.generateID();
			sentMessage.seq_no = this.generateSeqNo(sentMessage.notContentRelated || sentMessage.container);
			this.sentMessages[sentMessage.msg_id] = sentMessage;
			delete self.sentMessages[sentMessageID];

			return sentMessage;
		};

		generateSeqNo = notContentRelated => {
			let seqNo = this.seqNo * 2;

			if (!notContentRelated) {
				seqNo++;
				this.seqNo++;
			}

			return seqNo;
		};

		wrapMtpCall = (method, params, options) => {
			const serializer = new TLSerialization({
				mtproto: true,
			});

			serializer.storeMethod(method, params);

			const messageID = this.MtpTimeManager.generateID(),
				seqNo = this.generateSeqNo(),
				message = {
					msg_id: messageID,
					seq_no: seqNo,
					body: serializer.getBytes(),
				};

			if (Config.Modes.debug) {
				Config.Modes.debug && console.log(dT(), 'MT call', method, params, messageID, seqNo);
			}

			return this.pushMessage(message, options);
		};

		wrapMtpMessage = (object, options) => {
			options = options || {};

			const serializer = new TLSerialization({
				mtproto: true,
			});
			serializer.storeObject(object, 'Object');

			const messageID = this.MtpTimeManager.generateID(),
				seqNo = this.generateSeqNo(options.notContentRelated),
				message = {
					msg_id: messageID,
					seq_no: seqNo,
					body: serializer.getBytes(),
				};

			if (Config.Modes.debug) {
				Config.Modes.debug && console.log(dT(), 'MT message', object, messageID, seqNo);
			}

			return this.pushMessage(message, options);
		};

		wrapApiCall = (method, params, options) => {
			const serializer = new TLSerialization(options);

			if (!this.connectionInited) {
				serializer.storeInt(0xda9b0d0d, 'invokeWithLayer');
				serializer.storeInt(Config.Schema.API.layer, 'layer');
				serializer.storeInt(0x69796de9, 'initConnection');
				serializer.storeInt(Config.App.id, 'api_id');
				serializer.storeString(navigator.userAgent || 'Unknown UserAgent', 'device_model');
				serializer.storeString(navigator.platform || 'Unknown Platform', 'system_version');
				serializer.storeString(Config.App.version, 'app_version');
				serializer.storeString(navigator.language || 'en', 'lang_code');
			}

			if (options.afterMessageID) {
				serializer.storeInt(0xcb9f372d, 'invokeAfterMsg');
				serializer.storeLong(options.afterMessageID, 'msg_id');
			}

			options.resultType = serializer.storeMethod(method, params);

			const messageID = this.MtpTimeManager.generateID(),
				seqNo = this.generateSeqNo(),
				message = {
					msg_id: messageID,
					seq_no: seqNo,
					body: serializer.getBytes(true),
					isAPI: true,
				};

			if (Config.Modes.debug) {
				console.log(dT(), 'Api call', method, params, messageID, seqNo, options);
			} else {
				Config.Modes.debug && console.log(dT(), 'Api call', method);
			}

			return this.pushMessage(message, options);
		};

		checkLongPoll = force => {
			const isClean = this.cleanupSent();
			// console.log('Check lp', this.longPollPending, tsNow(), this.dcID, isClean);
			if ((this.longPollPending && tsNow() < this.longPollPending) || this.offline || akStopped) {
				return false;
			}
			const self = this;
			this.Storage.get('dc').then(baseDcID => {
				if (
					isClean &&
					(baseDcID != self.dcID || self.upload || (self.sleepAfter && tsNow() > self.sleepAfter))
				) {
					// console.warn(dT(), 'Send long-poll for DC is delayed', self.dcID, self.sleepAfter);
					return;
				}
				self.sendLongPoll();
			});
		};

		sendLongPoll = () => {
			const maxWait = 25000,
				self = this;

			this.longPollPending = tsNow() + maxWait;
			// console.log('Set lp', this.longPollPending, tsNow());

			this.wrapMtpCall(
				'http_wait',
				{
					max_delay: 500,
					wait_after: 150,
					max_wait: maxWait,
				},
				{
					noResponse: true,
					longPoll: true,
				}
			).then(
				() => {
					delete self.longPollPending;
					setZeroTimeout(self.checkLongPoll.bind(self));
				},
				() => {
					Config.Modes.debug && console.log('Long-poll failed');
				}
			);
		};

		pushMessage = (message, options) => {
			const self = this;

			Config.Modes.debug && console.log(dT(), 'Push message ', message, options);

			return new Promise((resolve, reject) => {
				self.sentMessages[message.msg_id] = extend(message, options || {}, {
					deferred: {
						resolve: resolve,
						reject: reject,
					},
				});
				self.pendingMessages[message.msg_id] = 0;

				if (!options || !options.noShedule) {
					self.sheduleRequest();
				}
				if (isObject(options)) {
					options.messageID = message.msg_id;
				}
			});
		};

		pushResend = (messageID, delay) => {
			const value = delay ? tsNow() + delay : 0;
			const sentMessage = this.sentMessages[messageID];
			if (sentMessage.container) {
				for (let i = 0; i < sentMessage.inner.length; i++) {
					this.pendingMessages[sentMessage.inner[i]] = value;
				}
			} else {
				this.pendingMessages[messageID] = value;
			}

			// console.log('Resend due', messageID, this.pendingMessages);

			this.sheduleRequest(delay);
		};

		getMsgKeyIv = (msgKey, isOut) => {
			const authKey = this.authKeyUint8,
				x = isOut ? 0 : 8,
				sha1aText = new Uint8Array(48),
				sha1bText = new Uint8Array(48),
				sha1cText = new Uint8Array(48),
				sha1dText = new Uint8Array(48),
				promises = {};

			sha1aText.set(msgKey, 0);
			sha1aText.set(authKey.subarray(x, x + 32), 16);
			promises.sha1a = this.CryptoWorker.sha1Hash(sha1aText);

			sha1bText.set(authKey.subarray(x + 32, x + 48), 0);
			sha1bText.set(msgKey, 16);
			sha1bText.set(authKey.subarray(x + 48, x + 64), 32);
			promises.sha1b = this.CryptoWorker.sha1Hash(sha1bText);

			sha1cText.set(authKey.subarray(x + 64, x + 96), 0);
			sha1cText.set(msgKey, 32);
			promises.sha1c = this.CryptoWorker.sha1Hash(sha1cText);

			sha1dText.set(msgKey, 0);
			sha1dText.set(authKey.subarray(x + 96, x + 128), 16);
			promises.sha1d = this.CryptoWorker.sha1Hash(sha1dText);

			return new Promise((resolve, reject) => {
				const p = [];
				const keys = Object.keys(promises);

				forEach(keys, key => {
					p.push(promises[key]);
				});

				Promise.all(p).then(resp => {
					const objects = toArray(resp);
					const result = {};

					forEach(keys, (key, i) => {
						result[key] = objects[i];
					});

					resolve(result);
				});
			}).then(result => {
				const aesKey = new Uint8Array(32),
					aesIv = new Uint8Array(32),
					sha1a = new Uint8Array(result.sha1a),
					sha1b = new Uint8Array(result.sha1b),
					sha1c = new Uint8Array(result.sha1c),
					sha1d = new Uint8Array(result.sha1d);

				aesKey.set(sha1a.subarray(0, 8));
				aesKey.set(sha1b.subarray(8, 20), 8);
				aesKey.set(sha1c.subarray(4, 16), 20);

				aesIv.set(sha1a.subarray(8, 20));
				aesIv.set(sha1b.subarray(0, 8), 12);
				aesIv.set(sha1c.subarray(16, 20), 20);
				aesIv.set(sha1d.subarray(0, 8), 24);

				return [aesKey, aesIv];
			});
		};

		checkConnection = event => {
			Config.Modes.debug && console.log(dT(), 'Check connection', event);
			$timeout.cancel(this.checkConnectionPromise);

			const serializer = new TLSerialization({
					mtproto: true,
				}),
				pingID = [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)];

			serializer.storeMethod('ping', {
				ping_id: pingID,
			});

			const pingMessage = {
				msg_id: this.MtpTimeManager.generateID(),
				seq_no: this.generateSeqNo(true),
				body: serializer.getBytes(),
			};

			const self = this;
			this.sendEncryptedRequest(pingMessage, {
				timeout: 15000,
			}).then(
				result => {
					self.toggleOffline(false);
				},
				() => {
					Config.Modes.debug && console.log(dT(), 'Delay ', self.checkConnectionPeriod * 1000);
					self.checkConnectionPromise = $timeout(
						self.checkConnection.bind(self),
						parseInt(self.checkConnectionPeriod * 1000)
					);
					self.checkConnectionPeriod = Math.min(60, self.checkConnectionPeriod * 1.5);
				}
			);
		};

		toggleOffline = enabled => {
			// console.log('toggle ', enabled, this.dcID, this.iii);
			if (this.offline !== undefined && this.offline == enabled) {
				return false;
			}

			this.offline = enabled;

			if (this.offline) {
				$timeout.cancel(this.nextReqPromise);
				delete this.nextReq;

				if (this.checkConnectionPeriod < 1.5) {
					this.checkConnectionPeriod = 0;
				}

				this.checkConnectionPromise = $timeout(
					this.checkConnection.bind(this),
					parseInt(this.checkConnectionPeriod * 1000)
				);
				this.checkConnectionPeriod = Math.min(30, (1 + this.checkConnectionPeriod) * 1.5);

				this.onOnlineCb = this.checkConnection.bind(this);

				document.body.addEventListener('online focus', this.onOnlineCb);
			} else {
				delete this.longPollPending;
				this.checkLongPoll();
				this.sheduleRequest();

				if (this.onOnlineCb) {
					document.body.removeEventListener('online focus', this.onOnlineCb);
				}
				$timeout.cancel(this.checkConnectionPromise);
			}
		};

		performSheduledRequest = () => {
			// console.log(dT(), 'sheduled', this.dcID, this.iii);
			if (this.offline || akStopped) {
				Config.Modes.debug && console.log(dT(), 'Cancel sheduled');
				return false;
			}
			delete this.nextReq;
			if (this.pendingAcks.length) {
				const ackMsgIDs = [];
				for (let i = 0; i < this.pendingAcks.length; i++) {
					ackMsgIDs.push(this.pendingAcks[i]);
				}
				// console.log('acking messages', ackMsgIDs);
				this.wrapMtpMessage(
					{
						_: 'msgs_ack',
						msg_ids: ackMsgIDs,
					},
					{
						notContentRelated: true,
						noShedule: true,
					}
				);
			}

			if (this.pendingResends.length) {
				const resendMsgIDs = [],
					resendOpts = {
						noShedule: true,
						notContentRelated: true,
					};
				for (let i = 0; i < this.pendingResends.length; i++) {
					resendMsgIDs.push(this.pendingResends[i]);
				}
				// console.log('resendReq messages', resendMsgIDs);
				this.wrapMtpMessage(
					{
						_: 'msg_resend_req',
						msg_ids: resendMsgIDs,
					},
					resendOpts
				);
				this.lastResendReq = {
					req_msg_id: resendOpts.messageID,
					resend_msg_ids: resendMsgIDs,
				};
			}

			let messages = [],
				message,
				messagesByteLen = 0,
				currentTime = tsNow(),
				hasApiCall = false,
				hasHttpWait = false,
				lengthOverflow = false,
				singlesCount = 0,
				self = this;

			forEach(this.pendingMessages, (value, messageID) => {
				if (!value || value >= currentTime) {
					message = self.sentMessages[messageID];
					if (message) {
						const messageByteLength = (message.body.byteLength || message.body.length) + 32;
						if (!message.notContentRelated && lengthOverflow) {
							return;
						}
						if (
							!message.notContentRelated &&
							messagesByteLen &&
							messagesByteLen + messageByteLength > 655360
						) {
							// 640 Kb
							lengthOverflow = true;
							return;
						}
						if (message.singleInRequest) {
							singlesCount++;
							if (singlesCount > 1) {
								return;
							}
						}
						messages.push(message);
						messagesByteLen += messageByteLength;
						if (message.isAPI) {
							hasApiCall = true;
						} else if (message.longPoll) {
							hasHttpWait = true;
						}
					} else {
						// console.log(message, messageID);
					}
					delete self.pendingMessages[messageID];
				}
			});

			if (hasApiCall && !hasHttpWait) {
				const serializer = new TLSerialization({
					mtproto: true,
				});
				serializer.storeMethod('http_wait', {
					max_delay: 500,
					wait_after: 150,
					max_wait: 3000,
				});
				messages.push({
					msg_id: this.MtpTimeManager.generateID(),
					seq_no: this.generateSeqNo(),
					body: serializer.getBytes(),
				});
			}

			if (!messages.length) {
				// console.log('no sheduled messages');
				return;
			}

			const noResponseMsgs = [];

			if (messages.length > 1) {
				const container = new TLSerialization({
					mtproto: true,
					startMaxLength: messagesByteLen + 64,
				});
				container.storeInt(0x73f1f8dc, 'CONTAINER[id]');
				container.storeInt(messages.length, 'CONTAINER[count]');
				const onloads = [];
				const innerMessages = [];
				for (let i = 0; i < messages.length; i++) {
					container.storeLong(messages[i].msg_id, 'CONTAINER[' + i + '][msg_id]');
					innerMessages.push(messages[i].msg_id);
					container.storeInt(messages[i].seq_no, 'CONTAINER[' + i + '][seq_no]');
					container.storeInt(messages[i].body.length, 'CONTAINER[' + i + '][bytes]');
					container.storeRawBytes(messages[i].body, 'CONTAINER[' + i + '][body]');
					if (messages[i].noResponse) {
						noResponseMsgs.push(messages[i].msg_id);
					}
				}

				const containerSentMessage = {
					msg_id: this.MtpTimeManager.generateID(),
					seq_no: this.generateSeqNo(true),
					container: true,
					inner: innerMessages,
				};

				message = extend(
					{
						body: container.getBytes(true),
					},
					containerSentMessage
				);

				this.sentMessages[message.msg_id] = containerSentMessage;

				if (Config.Modes.debug) {
					console.log(dT(), 'Container', innerMessages, message.msg_id, message.seq_no);
				}
			} else {
				if (message.noResponse) {
					noResponseMsgs.push(message.msg_id);
				}
				this.sentMessages[message.msg_id] = message;
			}

			this.pendingAcks = [];

			self = this;
			this.sendEncryptedRequest(message).then(
				result => {
					self.toggleOffline(false);
					// console.log('parse for', message);
					self.parseResponse(result.data).then(response => {
						if (Config.Modes.debug) {
							console.log(dT(), 'Server response', self.dcID, response);
						}

						self.processMessage(response.response, response.messageID, response.sessionID);

						for (let k in subscriptions) {
							subscriptions[k](response.response);
						}

						forEach(noResponseMsgs, msgID => {
							if (self.sentMessages[msgID]) {
								const deferred = self.sentMessages[msgID].deferred;
								delete self.sentMessages[msgID];
								deferred.resolve();
							}
						});

						self.checkLongPoll();

						this.checkConnectionPeriod = Math.max(1.1, Math.sqrt(this.checkConnectionPeriod));
					});
				},
				error => {
					Config.Modes.debug && ('Encrypted request failed', error);

					if (message.container) {
						forEach(message.inner, msgID => {
							self.pendingMessages[msgID] = 0;
						});
						delete self.sentMessages[message.msg_id];
					} else {
						self.pendingMessages[message.msg_id] = 0;
					}

					forEach(noResponseMsgs, msgID => {
						if (self.sentMessages[msgID]) {
							const deferred = self.sentMessages[msgID].deferred;
							delete self.sentMessages[msgID];
							delete self.pendingMessages[msgID];
							deferred.reject();
						}
					});

					self.toggleOffline(true);
				}
			);

			if (lengthOverflow || singlesCount > 1) {
				this.sheduleRequest();
			}
		};

		getEncryptedMessage = bytes => {
			const self = this;

			// console.log(dT(), 'Start encrypt', bytes.byteLength);
			return this.CryptoWorker.sha1Hash(bytes).then(bytesHash => {
				// console.log(dT(), 'after hash');
				const msgKey = new Uint8Array(bytesHash).subarray(4, 20);
				return self.getMsgKeyIv(msgKey, true).then(keyIv => {
					// console.log(dT(), 'after msg key iv');
					return this.CryptoWorker.aesEncrypt(bytes, keyIv[0], keyIv[1]).then(encryptedBytes => {
						// console.log(dT(), 'Finish encrypt');
						return {
							bytes: encryptedBytes,
							msgKey: msgKey,
						};
					});
				});
			});
		};

		getDecryptedMessage = (msgKey, encryptedData) => {
			// console.log(dT(), 'get decrypted start');
			return this.getMsgKeyIv(msgKey, false).then(keyIv => {
				// console.log(dT(), 'after msg key iv');
				return this.CryptoWorker.aesDecrypt(encryptedData, keyIv[0], keyIv[1]);
			});
		};

		sendEncryptedRequest = (message, options) => {
			console.log('Goin to send message', message);
			const self = this;
			options = options || {};
			// console.log(dT(), 'Send encrypted'/*, message*/);
			// console.trace();
			const data = new TLSerialization({
				startMaxLength: message.body.length + 64,
			});

			data.storeIntBytes(this.serverSalt, 64, 'salt');
			data.storeIntBytes(this.sessionID, 64, 'session_id');

			data.storeLong(message.msg_id, 'message_id');
			data.storeInt(message.seq_no, 'seq_no');

			data.storeInt(message.body.length, 'message_data_length');
			data.storeRawBytes(message.body, 'message_data');

			return this.getEncryptedMessage(data.getBuffer()).then(encryptedResult => {
				// console.log(dT(), 'Got encrypted out message'/*, encryptedResult*/);
				const request = new TLSerialization({
					startMaxLength: encryptedResult.bytes.byteLength + 256,
				});
				request.storeIntBytes(self.authKeyID, 64, 'auth_key_id');
				request.storeIntBytes(encryptedResult.msgKey, 128, 'msg_key');
				request.storeRawBytes(encryptedResult.bytes, 'encrypted_data');

				const requestData = xhrSendBuffer ? request.getBuffer() : request.getArray();

				let requestPromise;
				const url = this.MtpDcConfigurator.chooseServer(self.dcID, self.upload);
				const baseError = {
					code: 406,
					type: 'NETWORK_BAD_RESPONSE',
					url: url,
				};

				options = extend(options || {}, {
					responseType: 'arraybuffer',
					transformRequest: null,
				});
				console.log('{}{}{}{}{}{}SENDING SOCKET');
				this.SocketManager.sendData(requestData);

				try {
					options = extend(options || {}, {
						responseType: 'arraybuffer',
						transformRequest: null,
					});
					// requestPromise = $http.post(url, requestData, options);
					let pendingPromise;
					requestPromise = new Promise(resolve => {
						pendingPromise = resolve;
					});
					this.pendingPromises.push(pendingPromise);
				} catch (e) {
					requestPromise = Promise.reject(e);
				}
				return requestPromise.then(
					result => {
						if (!result.data || !result.data.byteLength) {
							return Promise.reject(baseError);
						}
						return result;
					},
					error => {
						if (error.status == 404 && (error.data || '').indexOf('nginx/0.3.33') != -1) {
							this.Storage.remove('dc' + self.dcID + '_server_salt', 'dc' + self.dcID + '_auth_key').then(
								() => {
									window.location.reload();
								}
							);
						}
						if (!error.message && !error.type) {
							error = extend(baseError, {
								type: 'NETWORK_BAD_REQUEST',
								originalError: error,
							});
						}
						return Promise.reject(error);
					}
				);
			});
		};

		parseResponse = responseBuffer => {
			// console.log(dT(), 'Start parsing response');
			const self = this;

			const deserializer = new TLDeserialization(responseBuffer);

			const authKeyID = deserializer.fetchIntBytes(64, false, 'auth_key_id');
			if (!bytesCmp(authKeyID, this.authKeyID)) {
				throw new Error('Invalid server auth_key_id: ' + bytesToHex(authKeyID));
			}
			const msgKey = deserializer.fetchIntBytes(128, true, 'msg_key'),
				encryptedData = deserializer.fetchRawBytes(
					responseBuffer.byteLength - deserializer.getOffset(),
					true,
					'encrypted_data'
				);

			return this.getDecryptedMessage(msgKey, encryptedData).then(dataWithPadding => {
				// console.log(dT(), 'after decrypt');
				const deserializer = new TLDeserialization(dataWithPadding, {
					mtproto: true,
				});

				const salt = deserializer.fetchIntBytes(64, false, 'salt');
				const sessionID = deserializer.fetchIntBytes(64, false, 'session_id');
				const messageID = deserializer.fetchLong('message_id');

				const seqNo = deserializer.fetchInt('seq_no');

				const messageBody = deserializer.fetchRawBytes(false, true, 'message_data');

				// console.log(dT(), 'before hash');
				const hashData = convertToUint8Array(dataWithPadding).subarray(0, deserializer.getOffset());

				return this.CryptoWorker.sha1Hash(hashData).then(dataHash => {
					if (!bytesCmp(msgKey, bytesFromArrayBuffer(dataHash).slice(-16))) {
						console.warn(msgKey, bytesFromArrayBuffer(dataHash));
						throw new Error('server msgKey mismatch');
					}

					const buffer = bytesToArrayBuffer(messageBody);
					const deserializerOptions = {
						mtproto: true,
						override: {
							mt_message: function(result, field) {
								result.msg_id = this.fetchLong(field + '[msg_id]');
								result.seqno = this.fetchInt(field + '[seqno]');
								result.bytes = this.fetchInt(field + '[bytes]');

								const offset = this.getOffset();

								try {
									result.body = this.fetchObject('Object', field + '[body]');
								} catch (e) {
									console.error(dT(), 'parse error', e.message, e.stack);
									result.body = {
										_: 'parse_error',
										error: e,
									};
								}
								if (this.offset != offset + result.bytes) {
									// console.warn(dT(), 'set offset', this.offset, offset, result.bytes);
									// console.log(dT(), result);
									this.offset = offset + result.bytes;
								}
								// console.log(dT(), 'override message', result);
							},
							mt_rpc_result: function(result, field) {
								result.req_msg_id = this.fetchLong(field + '[req_msg_id]');

								const sentMessage = self.sentMessages[result.req_msg_id],
									type = (sentMessage && sentMessage.resultType) || 'Object';

								if (result.req_msg_id && !sentMessage) {
									// console.warn(dT(), 'Result for unknown message', result);
									return;
								}
								result.result = this.fetchObject(type, field + '[result]');
								// console.log(dT(), 'override rpc_result', sentMessage, type, result);
							},
						},
					};
					const deserializer = new TLDeserialization(buffer, deserializerOptions);
					const response = deserializer.fetchObject('', 'INPUT');

					return {
						response: response,
						messageID: messageID,
						sessionID: sessionID,
						seqNo: seqNo,
					};
				});
			});
		};

		applyServerSalt = newServerSalt => {
			const serverSalt = longToBytes(newServerSalt);

			const storeObj = {};

			storeObj['dc' + this.dcID + '_server_salt'] = bytesToHex(serverSalt);
			this.Storage.set(storeObj);

			this.serverSalt = serverSalt;
			return true;
		};

		sheduleRequest = delay => {
			if (this.offline) {
				this.checkConnection('forced shedule');
			}
			const nextReq = tsNow() + delay;

			if (delay && this.nextReq && this.nextReq <= nextReq) {
				return false;
			}

			// console.log(dT(), 'shedule req', delay);
			// console.trace();

			$timeout.cancel(this.nextReqPromise);
			if (delay > 0) {
				this.nextReqPromise = $timeout(this.performSheduledRequest.bind(this), delay || 0);
			} else {
				setZeroTimeout(this.performSheduledRequest.bind(this));
			}

			this.nextReq = nextReq;
		};

		ackMessage = msgID => {
			// console.log('ack message', msgID);
			this.pendingAcks.push(msgID);
			this.sheduleRequest(30000);
		};

		reqResendMessage = msgID => {
			Config.Modes.debug && console.log(dT(), 'Req resend', msgID);
			this.pendingResends.push(msgID);
			this.sheduleRequest(100);
		};

		cleanupSent = () => {
			const self = this;
			let notEmpty = false;
			// console.log('clean start', this.dcID/*, this.sentMessages*/);
			forEach(this.sentMessages, (message, msgID) => {
				// console.log('clean iter', msgID, message);
				if (message.notContentRelated && self.pendingMessages[msgID] === undefined) {
					// console.log('clean notContentRelated', msgID);
					delete self.sentMessages[msgID];
				} else if (message.container) {
					for (let i = 0; i < message.inner.length; i++) {
						if (self.sentMessages[message.inner[i]] !== undefined) {
							// console.log('clean failed, found', msgID, message.inner[i], self.sentMessages[message.inner[i]].seq_no);
							notEmpty = true;
							return;
						}
					}
					// console.log('clean container', msgID);
					delete self.sentMessages[msgID];
				} else {
					notEmpty = true;
				}
			});

			return !notEmpty;
		};

		processMessageAck = messageID => {
			const sentMessage = this.sentMessages[messageID];
			if (sentMessage && !sentMessage.acked) {
				delete sentMessage.body;
				sentMessage.acked = true;

				return true;
			}

			return false;
		};

		processError = rawError => {
			const matches = (rawError.error_message || '').match(/^([A-Z_0-9]+\b)(: (.+))?/) || [];
			rawError.error_code = uintToInt(rawError.error_code);

			return {
				code: !rawError.error_code || rawError.error_code <= 0 ? 500 : rawError.error_code,
				type: matches[1] || 'UNKNOWN',
				description: matches[3] || 'CODE#' + rawError.error_code + ' ' + rawError.error_message,
				originalError: rawError,
			};
		};

		processMessage = (message, messageID, sessionID) => {
			// console.log('process message', message, messageID, sessionID);
			let len, sentMessage, sentMessageID, badMessage, badMsgID, pos;
			switch (message._) {
				case 'msg_container':
					len = message.messages.length;
					for (let i = 0; i < len; i++) {
						this.processMessage(message.messages[i], messageID, sessionID);
					}
					break;

				case 'bad_server_salt':
					Config.Modes.debug && console.log(dT(), 'Bad server salt', message);
					sentMessage = this.sentMessages[message.bad_msg_id];
					if (!sentMessage || sentMessage.seq_no != message.bad_msg_seqno) {
						Config.Modes.debug && console.log(message.bad_msg_id, message.bad_msg_seqno);
						throw new Error('Bad server salt for invalid message');
					}

					this.applyServerSalt(message.new_server_salt);
					this.pushResend(message.bad_msg_id);
					this.ackMessage(messageID);
					break;

				case 'bad_msg_notification':
					Config.Modes.debug && console.log(dT(), 'Bad msg notification', message);
					sentMessage = this.sentMessages[message.bad_msg_id];
					if (!sentMessage || sentMessage.seq_no != message.bad_msg_seqno) {
						Config.Modes.debug && console.log(message.bad_msg_id, message.bad_msg_seqno);
						throw new Error('Bad msg notification for invalid message');
					}

					if (message.error_code == 16 || message.error_code == 17) {
						if (
							this.MtpTimeManager.applyServerTime(
								bigStringInt(messageID)
									.shiftRight(32)
									.toString(10)
							)
						) {
							Config.Modes.debug && console.log(dT(), 'Update session');
							this.updateSession();
						}
						badMessage = this.updateSentMessage(message.bad_msg_id);
						this.pushResend(badMessage.msg_id);
						this.ackMessage(messageID);
					}
					break;

				case 'message':
					this.serverMessages.push(message.msg_id);
					this.processMessage(message.body, message.msg_id, sessionID);
					break;

				case 'new_session_created':
					this.ackMessage(messageID);

					this.processMessageAck(message.first_msg_id);
					this.applyServerSalt(message.server_salt);

					// var self = this;
					this.Storage.get('dc').then(baseDcID => {
						if (baseDcID == this.dcID && !this.upload && updatesProcessor) {
							updatesProcessor(message);
						}
					});
					break;

				case 'msgs_ack':
					for (let i = 0; i < message.msg_ids.length; i++) {
						this.processMessageAck(message.msg_ids[i]);
					}
					break;

				case 'msg_detailed_info':
					if (!this.sentMessages[message.msg_id]) {
						this.ackMessage(message.answer_msg_id);
						break;
					}
					break;
				case 'msg_new_detailed_info':
					// this.ackMessage(message.answer_msg_id);
					this.reqResendMessage(message.answer_msg_id);
					break;
				case 'msgs_state_info':
					this.ackMessage(message.answer_msg_id);
					if (
						this.lastResendReq &&
						this.lastResendReq.req_msg_id == message.req_msg_id &&
						this.pendingResends.length
					) {
						for (let i = 0; i < this.lastResendReq.resend_msg_ids.length; i++) {
							badMsgID = this.lastResendReq.resend_msg_ids[i];
							pos = this.pendingResends.indexOf(badMsgID);
							if (pos != -1) {
								this.pendingResends.splice(pos, 1);
							}
						}
					}
					break;

				case 'rpc_result':
					this.ackMessage(messageID);

					sentMessageID = message.req_msg_id;
					sentMessage = this.sentMessages[sentMessageID];

					this.processMessageAck(sentMessageID);
					if (sentMessage) {
						const deferred = sentMessage.deferred;
						if (message.result._ == 'rpc_error') {
							const error = this.processError(message.result);
							Config.Modes.debug && console.log(dT(), 'Rpc error', error);
							if (deferred) {
								deferred.reject(error);
							}
						} else {
							if (deferred) {
								if (Config.Modes.debug) {
									console.log(dT(), 'Rpc response', message.result);
								} else {
									let dRes = message.result._;
									if (!dRes) {
										if (message.result.length > 5) {
											dRes = '[..' + message.result.length + '..]';
										} else {
											dRes = message.result;
										}
									}
									Config.Modes.debug && console.log(dT(), 'Rpc response', dRes);
								}
								sentMessage.deferred.resolve(message.result);
							}
							if (sentMessage.isAPI) {
								this.connectionInited = true;
							}
						}

						delete this.sentMessages[sentMessageID];
					}
					break;

				default:
					this.ackMessage(messageID);

					// console.log('Update', message);
					if (updatesProcessor) {
						updatesProcessor(message);
					}
					break;
			}
		};
	}

	const startAll = () => {
		if (akStopped) {
			akStopped = false;
			updatesProcessor({ _: 'new_session_created' });
		}
	};

	const stopAll = () => {
		akStopped = true;
	};

	return {
		getNetworker: (dcID, authKey, serverSalt, options) => {
			Config.Modes.debug && console.log('NETWORKER', dcID, authKey, serverSalt, options);
			return new MtpNetworker(dcID, authKey, serverSalt, options);
		},
		setUpdatesProcessor: callback => {
			updatesProcessor = callback;
		},
		stopAll: stopAll,
		startAll: startAll,

		subscribe: subscribe,
		unSubscribe: unSubscribe,
	};
}
