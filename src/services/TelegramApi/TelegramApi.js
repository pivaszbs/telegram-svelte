import './js/lib/polyfill';
import './js/lib/config';
import MtpNetworkerFactoryModule from './js/Mtp/MtpNetworkerFactory';
import MtpApiManagerModule from './js/Mtp/MtpApiManager';
import AppPeersManagerModule from './js/App/AppPeersManager';
import MtpApiFileManagerModule from './js/Mtp/MtpApiFileManager';
import AppUsersManagerModule from './js/App/AppUsersManager';
import AppProfileManagerModule from './js/App/AppProfileManager';
import MtpPasswordManagerModule from './js/Mtp/MtpPasswordManager';
import AppsChatsManagerModule from './js/App/AppChatsManager';
import FileSaverModule from './js/Etc/FileSaver';
import { nextRandomInt } from './js/lib/bin_utils';
import { isArray, isFunction, forEach, map, min, noop } from './js/Etc/Helper';
import $timeout from './js/Etc/angular/$timeout';
import { Config } from './js/lib/config';
import AppUpdatesManagerModule from './js/App/AppUpdatesManager';

import { inflate } from 'pako/lib/inflate';
import pako from 'pako';

import lottie from 'lottie-web';
import AppMessagesManagerModule from './js/App/AppMessagesManager';

class TelegramApi {
	options = { dcID: 2, createNetworker: true };

	user = {};

	AppChatsManager = new AppsChatsManagerModule();
	AppUsersManager = new AppUsersManagerModule();

	AppPeersManager = new AppPeersManagerModule();
	AppProfileManager = new AppProfileManagerModule();

	MtpApiManager = new MtpApiManagerModule();
	MtpApiFileManager = new MtpApiFileManagerModule();
	MtpPasswordManager = new MtpPasswordManagerModule();
	FileSaver = new FileSaverModule();
	MtpNetworkerFactory = MtpNetworkerFactoryModule();

	AppUpdatesManager = new AppUpdatesManagerModule();

	constructor() {
		this.MtpNetworkerFactory.setUpdatesProcessor(message => {
			switch (message._) {
				case 'updates':
					this.AppChatsManager.saveApiChats(message.chats);
					this.AppUsersManager.saveApiUsers(message.users);
					break;
			}
		});

		window.apiManager = this.MtpApiManager;
		this.MtpApiFileManager = new MtpApiFileManagerModule();

		this.setConfig({
			app: {
				id: 1166576 /* App ID */,
				hash: '99db6db0082e27973ee4357e4637aadc' /* App hash */,
				version: '0.0.1' /* App version */,
			},
			server: {
				test: [
					{ id: 1, host: '149.154.175.10', port: 443 },
					{ id: 2, host: '149.154.167.40', port: 443 },
					{ id: 3, host: '149.154.175.117', port: 443 },
				],
				production: [
					{ id: 1, host: 'pluto.web.telegram.org', port: 80 },
					{ id: 2, host: 'venus.web.telegram.org', port: 80 },
					{ id: 3, host: 'aurora.web.telegram.org', port: 80 },
					{ id: 4, host: 'vesta.web.telegram.org', port: 80 },
					{ id: 5, host: 'flora.web.telegram.org', port: 80 },
				],
			},
			mode: {
				test: true,
				debug: true,
			},
		});

		this.getUserInfo()
			.then(meUser => {
				if (meUser.id) {
					this.user = meUser;
				}
			})
			.catch(err => {
				if (Config.Modes.debug) {
					console.log('User not found', err);
				}
			});

		// To be removed
		const updateTestHandler = payload => {
			if (this.user.id === payload.from_id || payload.message_info.out) {
				console.log('Got peer', this.user);
			} else {
				this.getPeerByID(payload.from_id)
					.then(peer => {
						// console.log('Got peer', peer);
					})
					.catch(err => {
						// console.log('Peer not found', err);
					});
			}
		};

		// this.subscribeToUpdates('dialogs', updateTestHandler);
	}

	// MAIN METHODS ------------------------------------------------------

	invokeApi = (method, params) => this.MtpApiManager.invokeApi(method, params);

	setConfig = config => {
		config = config || {};

		config.app = config.app || {};
		config.server = config.server || {};

		config.server.test = config.server.test || [];
		config.server.production = config.server.production || [];

		config.mode.test = config.mode.test || false;
		config.mode.debug = config.mode.debug || false;

		Config.App.id = config.app.id;
		Config.App.hash = config.app.hash;
		Config.App.version = config.app.version || Config.App.version;

		Config.Server.Test = config.server.test;
		Config.Server.Production = config.server.production;

		Config.Modes.test = config.mode.test;
		Config.Modes.debug = config.mode.debug;

		this.MtpApiManager.invokeApi('help.getNearestDc', {}, this.options).then(nearestDcResult => {
			if (nearestDcResult.nearest_dc != nearestDcResult.this_dc) {
				this.MtpApiManager.getNetworker(nearestDcResult.nearest_dc, { createNetworker: true });
			}
		});
	};

	// AUTH METHODS ------------------------------------------------------

	sendCode = phone_number =>
		this.MtpApiManager.invokeApi(
			'auth.sendCode',
			{
				phone_number: phone_number,
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

	signIn = (phone_number, phone_code_hash, phone_code) =>
		this.MtpApiManager.invokeApi(
			'auth.signIn',
			{
				phone_number: phone_number,
				phone_code_hash: phone_code_hash,
				phone_code: phone_code,
			},
			this.options
		).then(result => {
			if (result._ === 'auth.authorizationSignUpRequired') {
				throw 'PHONE_NUMBER_UNOCCUPIED';
			}

			this.MtpApiManager.setUserAuth(this.options.dcID, {
				id: result.user.id,
			});
			this.user = result.user;
			return result;
		});

	signIn2FA = password =>
		this.MtpPasswordManager.getState().then(result => {
			return this.MtpPasswordManager.check(result, password, this.options).then(result => {
				this.MtpApiManager.setUserAuth(this.options.dcID, {
					id: result.user.id,
				});
				this.user = result.user;
				return result;
			});
		});

	setUp2FA = (old_password, password, email, hint) =>
		this.MtpPasswordManager.getState().then(result => {
			return this.MtpPasswordManager.updateSettings(result, {
				cur_password: old_password,
				new_password: password,
				email: email,
				hint: hint,
			});
		});

	signUp = (phone_number, phone_code_hash, phone_code, first_name, last_name) =>
		this.MtpApiManager.invokeApi(
			'auth.signUp',
			{
				phone_number: phone_number,
				phone_code_hash: phone_code_hash,
				phone_code: phone_code,
				first_name: first_name || '',
				last_name: last_name || '',
			},
			this.options
		).then(result => {
			this.user = result.user;
			this.MtpApiManager.setUserAuth(this.options.dcID, {
				id: result.user.id,
			});
		});

	sendSms = (phone_number, phone_code_hash, next_type) => {
		return this.MtpApiManager.invokeApi(
			'auth.resendCode',
			{
				phone_number: phone_number,
				phone_code_hash: phone_code_hash,
				next_type: next_type,
			},
			this.options
		);
	};

	logOut = () => this.MtpApiManager.logOut();

	checkPhone = phone_number => this.MtpApiManager.invokeApi('auth.checkPhone', { phone_number: phone_number });

	// MESSAGES AND FILES ------------------------------------------------------

	sendMessage = async (id, message, reply_to = 0, schedule_date) => {
		const peer = this.mapPeerToTruePeer(await this.getPeerByID(id));

		return this.MtpApiManager.invokeApi('messages.sendMessage', {
			flags: 0,
			peer,
			message: message,
			random_id: [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)],
			reply_to_msg_id: reply_to,
			entities: [],
			schedule_date,
		});
	};

	readPeerHistory = async peer_id => {
		const peer = this.mapPeerToTruePeer(await this.getPeerByID(peer_id));

		if (peer._ === 'inputPeerChannel') {
			return this.invokeApi('channels.readHistory', {
				channel: this.mapPeerToInputPeer(peer),
			});
		}

		return this.invokeApi('messages.readHistory', {
			peer,
		});
	};

	deleteMessages = ids => {
		if (!isArray(ids)) {
			ids = [ids];
		}

		return this.MtpApiManager.invokeApi('messages.deleteMessages', { id: ids });
	};

	startBot = botName =>
		this.MtpApiManager.invokeApi('contacts.search', { q: botName, limit: 1 }).then(result => {
			this.AppUsersManager.saveApiUsers(result.users);
			return this.sendMessage(result.users[0].id, '/start');
		});

	getHistory = params => {
		params = params || {};
		params.id = params.id || 0;
		params.take = params.take || 15;
		params.skip = params.skip || 0;
		params.type = params.type || 'chat';

		if (params.type == 'chat' && params.id > 0) {
			params.id = params.id * -1;
		}

		return this.MtpApiManager.invokeApi('messages.getHistory', {
			peer: this.AppPeersManager.getInputPeerByID(params.id),
			offset_id: 0,
			add_offset: params.skip,
			limit: params.take,
		});
	};

	getMessages = ids => {
		if (!isArray(ids)) {
			ids = [ids];
		}

		const id = ids.map(el => ({ _: 'inputMessageID', id: el }));

		return this.MtpApiManager.invokeApi('messages.getMessages', { id }).then(updates => {
			this.AppUsersManager.saveApiUsers(updates.users);
			this.AppChatsManager.saveApiChats(updates.chats);

			return updates;
		});
	};

	getReplyInfo = async ids => {
		const data = await this.getMessages(ids);

		const payload = {};

		// console.log(data);

		if (!data.messages[0].message) {
			if (data.messages[0].media) {
				const { media } = data.messages[0];
				if (media._ === 'messageMediaPhoto') {
					payload.photo = this.getPhotoPreview(media.photo);
				}
				if (media._ === 'messageMediaDocument') {
					payload.document = {
						type: media.document.mime_type.split('/')[1] || 'raw',
						photo: this.getDocumentPreview(media.document),
						filename: media.document.attributes.filter(el => el._ === 'documentAttributeFilename')[0]
							.file_name,
					};
				}
			}
		} else {
			payload.title =
				(data.users[0] && (data.users[0].first_name + ' ' + (data.users[0].last_name || '')).trim()) || '';
			payload.message =
				data.messages[0]._ === 'messageService'
					? this._getServiceMessage(data.messages[0]).text
					: this._getMessageText(data.messages[0]);
		}

		return payload;
	};

	sendFile = async (
		params = {
			id: 0,
			file: {},
			caption: '',
		},
		inputType,
		progressHandler = noop
	) => {
		const peer = this.mapPeerToTruePeer(await this.getPeerByID(params.id));

		return this.MtpApiFileManager.uploadFile(params.file, progressHandler).then(inputFile => {
			const file = params.file;

			inputFile.name = file.name;

			const inputMedia = {
				_: inputType || 'inputMediaUploadedDocument',
				file: inputFile,
				mime_type: file.type,
				attributes: [{ _: 'documentAttributeFilename', file_name: file.name }],
			};

			return this.MtpApiManager.invokeApi('messages.sendMedia', {
				peer,
				media: inputMedia,
				message: params.caption,
				random_id: [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)],
			});
		});
	};

	sendMultiFile = async (
		params = {
			id: 0,
			data: [],
		},
		inputType,
		progressHandler = noop
	) => {
		const peer = this.mapPeerToTruePeer(await this.getPeerByID(params.id));

		const multi_media = [];

		for (let i = 0; i < params.data.length; i++) {
			const inputFile = await this.MtpApiFileManager.uploadFile(params.data[i].file, progressHandler);

			const file = params.data[i].file;
			inputFile.name = file.name;

			const inputMedia = {
				_: inputMedia || 'inputMediaUploadedDocument',
				file: inputFile,
				mime_type: file.type,
				attributes: [{ _: 'documentAttributeFilename', file_name: file.name }],
			};

			multi_media.push({
				_: 'inputSingleMedia',
				media: inputMedia,
				message: 'aas',
				random_id: [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)],
			});
		}

		return this.MtpApiManager.invokeApi('messages.sendMultiMedia', {
			peer,
			multi_media,
		});
	};

	downloadDocument = (doc, progress, autosave, useCached = true) => {
		doc = doc || {};
		doc.id = doc.id || 0;
		doc.access_hash = doc.access_hash || 0;
		doc.attributes = doc.attributes || [];
		doc.size = doc.size || 0;

		const cached = this.MtpApiFileManager.getLocalFile(doc.id);

		if (cached && useCached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		if (!isFunction(progress)) {
			progress = noop;
		}

		const location = {
			_: 'inputDocumentFileLocation',
			id: doc.id,
			access_hash: doc.access_hash,
			file_reference: doc.file_reference,
		};
		let fileName = 'FILE';
		let size = 15728640;
		let limit = 524288;
		let offset = 0;
		const promise = new Promise((resolve, request) => {
			const bytes = [];

			// if (doc.size > size) {
			// 	throw new Error('Big file not supported');
			// }

			size = doc.size;

			forEach(doc.attributes, attr => {
				if (attr._ == 'documentAttributeFilename') {
					fileName = attr.file_name;
				}
			});

			const download = () => {
				if (offset < size) {
					this.MtpApiManager.invokeApi('upload.getFile', {
						location: location,
						offset: offset,
						limit: limit,
					}).then(result => {
						bytes.push(result.bytes);
						offset += limit;
						progress(offset < size ? offset : size, size);
						download();
					});
				} else {
					if (autosave) {
						this.FileSaver.save(bytes, fileName);
					}
					resolve({
						bytes: bytes,
						fileName: fileName,
						type: doc.mime_type,
					});
				}
			};

			$timeout(download);
		});
		this.MtpApiFileManager.saveDownloadingPromise(doc.id, promise);
		return promise;
	};

	downloadPhoto = (photo, progress, autosave, useCached = true) => {
		const photoSize = photo.sizes[photo.sizes.length - 1];
		const location = {
			_: 'inputPhotoFileLocation',
			id: photo.id,
			access_hash: photo.access_hash,
			file_reference: photo.file_reference,
			thumb_size: 'c',
		};

		const cached = this.MtpApiFileManager.getLocalFile(photo.id);

		if (cached && useCached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		if (!isFunction(progress)) {
			progress = noop;
		}

		const fileName = photo.id + '.jpg';
		let size = 15728640;
		let limit = 524288;
		let offset = 0;

		const promise = new Promise((resolve, reject) => {
			const bytes = [];

			if (photoSize.size > size) {
				throw new Error('Big file not supported');
			}

			size = photoSize.size;

			const download = () => {
				if (offset < size) {
					this.MtpApiManager.invokeApi('upload.getFile', {
						location: location,
						offset: offset,
						limit: limit,
					}).then(result => {
						bytes.push(result.bytes);
						offset += limit;
						progress(offset < size ? offset : size, size);
						download();
					});
				} else {
					if (autosave) {
						this.FileSaver.save(bytes, fileName);
					}
					resolve({
						bytes: bytes,
						fileName: fileName,
						type: 'image/jpeg',
					});
				}
			};

			$timeout(download);
		});
		this.MtpApiFileManager.saveDownloadingPromise(photo.id, promise);
		return promise;
	};

	getAllStickers = async () => {
		return this.invokeApi('messages.getAllStickers', {
			hash: [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)],
		});
	};

	_asyncForEach = async (array, callback) => {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	};

	_parseStickerData = async data => {
		// console.log('STICKERS', data);
		if (data.sets) {
			const result_sets = [];
			data.sets.forEach(async stickerset => {
				result_sets.push(
					this.invokeApi('messages.getStickerSet', {
						stickerset: {
							_: 'inputStickerSetID',
							id: stickerset.id,
							access_hash: stickerset.access_hash,
						},
					}).then(result => {
						// console.log(result);

						const isAnimated = this._checkFlag(stickerset.flags, 5) || stickerset.pFlags.animated;
						let location = result.set.thumb && result.set.thumb.location;
						const cached = this.MtpApiFileManager.getLocalFile(stickerset.id);

						return {
							set_info: result.set,
							stickers: result.documents.map(doc => () =>
								this.downloadDocument(doc).then(res => {
									if (isAnimated) {
										// return this._getStickerData(res.bytes, doc.id);
										return res;
									} else {
										return this._getImageData(res.bytes, doc.id);
									}
								})
							),
							previews: () =>
								result.documents.map(doc => {
									return this.getDocumentPreview(doc);
								}),
							set_preview: cached
								? new Promise(resolve => {
									resolve(cached);
								})
								: location &&
								this.invokeApi('upload.getFile', {
									offset: 0,
									limit: 524288,
									location: {
										_: 'inputStickerSetThumb',
										stickerset: {
											_: 'inputStickerSetID',
											id: stickerset.id,
											access_hash: stickerset.access_hash,
										},
										volume_id: location.volume_id,
										local_id: location.local_id,
									},
								}).then(res => this._getImageData(res.bytes, stickerset.id)),
							docs: result.documents,
							isAnimated,
							id: stickerset.id,
						};
					})
				);
			});
			return result_sets;
		}
	};

	getAllStickersParsed = async () => {
		const sets = await this.getAllStickers().then(this._parseStickerData);

		return sets;
	};

	getDocumentPreview = doc => {
		const cached = this.MtpApiFileManager.getLocalFile(doc.id);
		if (cached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		const location = { ...doc };
		let limit = 524288;

		let thumb_size = doc.thumbs;
		if (thumb_size) {
			thumb_size = thumb_size[2] || thumb_size[1] || thumb_size[0];
			location.thumb_size = thumb_size.type;
		} else {
			return new Promise(resolve => {
				resolve({});
			});
		}

		location._ = 'inputDocumentFileLocation';

		const promise = this.MtpApiManager.invokeApi('upload.getFile', {
			location: location,
			offset: 0,
			limit: limit,
		}).then(res => {
			return this._getImageData(res.bytes, doc.id);
		});
		this.MtpApiFileManager.saveDownloadingPromise(doc.id, promise);
		return promise;
	};

	getPhotoPreview = (photo, customSize) => {
		const cached = this.MtpApiFileManager.getLocalFile(photo.id);
		if (cached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		let photo_size = photo.sizes;
		photo_size = photo_size[2] || photo_size[1] || photo_size[0];
		const location = {
			_: 'inputPhotoFileLocation',
			id: photo.id,
			access_hash: photo.access_hash,
			file_reference: photo.file_reference,
			thumb_size: photo_size.type,
		};
		let limit = 524288;

		const promise = this.MtpApiManager.invokeApi('upload.getFile', {
			location: location,
			offset: 0,
			limit: limit,
		}).then(data => this._getImageData(data.bytes, photo.id));
		this.MtpApiFileManager.saveDownloadingPromise(photo.id, promise);
		return promise;
	};

	getMessagesFromPeer = async (peer, limit = 200, offsetId = 0, addOffset = 0) => {
		const messagesManager = new AppMessagesManagerModule(
			peer.user_id || peer.channel_id || peer.chat_id || peer.id
		);

		// min_id = addOffset < 0 ? offsetId : -1;

		// console.log('Calling', offsetId, addOffset, limit, max_id, min_id);

		// const cached = messagesManager.getMessages(offsetId, addOffset, limit);

		// if (cached && cached.length >= limit) {
		// 	console.log('RETURNING CACHED', cached);
		// 	return { messages: cached };
		// }

		return await this.invokeApi('messages.getHistory', {
			peer: this.mapPeerToTruePeer(peer),
			limit,
			offset_id: offsetId,
			add_offset: addOffset,
		}).then(res => {
			messagesManager.saveMessages(res.messages);

			return res;
		});
	};

	getPeerMessage = async (peer_id, message_id) => {
		const messagesManager = new AppMessagesManagerModule(peer_id);
		const cached = messagesManager.getMessage(message_id);

		if (cached && !cached.deleted) {
			return cached;
		}

		const res = await this.getMessageByID(message_id);
		// console.log('PeerMessage', res);
		messagesManager.saveMessages(res.messages);
		return res;
	};

	getMessageByID = id => {
		return this.invokeApi('messages.getMessages', {
			_: 'inputMessageID',
			id: [id],
		});
	};

	getPhotoFile = async (photo, size) => {
		const { id, access_hash, file_reference } = photo;
		const photo_size = photo.sizes[2] || photo.sizes[1] || photo.sizes[0];
		console.log(photo_size);
		return await this.invokeApi(
			'upload.getFile',
			{
				location: {
					_: 'inputPhotoFileLocation',
					id,
					access_hash,
					thumb_size: photo_size.type,
					file_reference,
				},
				offset: 0,
				limit: 1048576,
			},
			{ fileDownload: true }
		)
			.then(res => {
				// console.log('Got file!');
				return this._getImageData(res.bytes, id);
			})
			.catch(err => {
				if (err.type === 'FILEREF_UPGRADE_NEEDED') {
					return null;
				}
			});
	};

	getPeerPhoto = async peer_id => {
		if (!peer_id) {
			return;
		}
		const peer = await this.getPeerByID(peer_id);

		if (!peer.photo) {
			return;
		}

		const cached = this.MtpApiFileManager.getLocalFile(peer_id);

		if (cached) {
			return cached;
		}

		const photo = peer.photo.photo_small;
		// console.log('PEER', peer);
		// console.log('PHOTO', photo);
		const promise = this.invokeApi('upload.getFile', {
			location: {
				_: 'inputPeerPhotoFileLocation',
				peer: this.mapPeerToTruePeer(peer),
				volume_id: photo.volume_id,
				local_id: photo.local_id,
			},
			offset: 0,
			limit: 1048576,
		}).then(photo_file => {
			// console.log('Got file!');
			return this._getImageData(photo_file.bytes, peer_id);
		});
		this.MtpApiFileManager.saveDownloadingPromise(peer_id, promise);
		return promise;
	};

	searchPeerMessages = async (
		peer_id,
		text,
		filter = { _: 'inputMessagesFilterEmpty' },
		limit = 100,
		offset_id = 0
	) => {
		const peer = this.mapPeerToTruePeer(await this.getPeerByID(peer_id));

		return this.invokeApi('messages.search', {
			peer,
			q: text,
			filter,
			limit,
			offset_id,
			// add_offset: -limit,
			hash: Math.floor(Math.random() * 1000),
		});
	};

	searchMessagesGlobal = async (text, offset_rate = 0, limit = 0) => {
		return this.invokeApi('messages.searchGlobal', {
			q: text,
			offset_rate,
			limit,
			offset_peer: {
				_: 'inputPeerEmpty',
			},
		}).then(res => {
			const message_items = [];

			console.log('SEARCH RES SERV', res);

			res.messages.forEach(message => {
				message_items.push(this._parseSearchMessage(message, res.chats, res.users));
			});

			return message_items;
		});
	};

	getPeerPhotos = async (peer_id, offset_id = 0, limit = 30) => {
		return this.searchPeerMessages(peer_id, '', { _: 'inputMessagesFilterPhotos' }, limit, offset_id).then(
			messages => {
				const msg_photos = [];

				messages.messages.forEach(msg => {
					msg_photos.push({
						photo: msg.media.photo,
						caption: msg.message,
						id: msg.media.photo.id,
						msg_id: msg.id,
					});
				});

				return this._fillPhotosPromises(msg_photos);
			}
		);
	};

	getPeerDocuments = async (peer_id, offset_id = 0, limit = 100) => {
		return this.searchPeerMessages(peer_id, '', { _: 'inputMessagesFilterDocument' }, limit, offset_id).then(
			messages => {
				const msg_docs = [];
				console.log(messages.messages);

				messages.messages.forEach(msg => {
					msg_docs.push({
						document: msg.media.document,
						caption: msg.message,
						id: msg.media.document.id,
						msg_id: msg.id,
						thumbs: msg.media.document.thumbs,
					});
				});

				return this._fillDocumentsPromises(msg_docs);
			}
		);
	};

	// CHATS ------------------------------------------------------

	createChat = (title, userIDs) => {
		title = title || '';
		userIDs = userIDs || [];

		if (!isArray(userIDs)) {
			throw new Error('[userIDs] is not array');
		}

		const inputUsers = [];

		for (let i = 0; i < userIDs.length; i++) {
			inputUsers.push(this.AppUsersManager.getUserInput(userIDs[i]));
		}

		return this.MtpApiManager.invokeApi('messages.createChat', {
			title: title,
			users: inputUsers,
		}).then(updates => {
			// TODO: Remove
			if (updates.chats && updates.chats[0]) {
				return this.MtpApiManager.invokeApi('messages.toggleChatAdmins', {
					chat_id: updates.chats[0].id,
					enabled: true,
				});
			} else {
				return updates;
			}
		});
	};

	getDialogsParsed = async limit => {
		const last = this.last || 0;
		const { result, offset } = await this.getDialogs(last, limit);
		this.last = offset;
		const { chats, dialogs, messages, users } = result;

		const dialog_items = [];
		const archived_items = [];

		dialogs.forEach(dialog => {
			(parsed_dialog => {
				(parsed_dialog.archived && archived_items.push(parsed_dialog)) || dialog_items.push(parsed_dialog);
			})(this._parseDialog(dialog, chats, messages, users));
		});

		dialog_items.sort((a, b) => a.date - b.date);

		return { dialog_items, archived_items };
	};

	getDialogs = (offset, limit) => {
		offset = offset || 0;
		limit = limit || 50;

		return this.MtpApiManager.invokeApi('messages.getDialogs', {
			offset_peer: this.AppPeersManager.getInputPeerByID(0),
			offset_date: offset,
			limit: limit,
		}).then(dialogsResult => {
			// console.log('Saving users', dialogsResult);
			this.AppUsersManager.saveApiUsers(dialogsResult.users);
			this.AppChatsManager.saveApiChats(dialogsResult.chats);
			this.AppChatsManager.saveDialogs(dialogsResult.dialogs);

			const dates = map(dialogsResult.messages, msg => {
				return msg.date;
			});

			return {
				result: dialogsResult,
				offset: Math.min(...dates),
			};
		});
	};

	// TODO : REWRITE WITH _parseDialog
	searchPeers = async (subsrt, limit) => {
		const res = await this.invokeApi('contacts.search', {
			q: subsrt,
			limit,
		});

		const { results, users, chats } = res;

		const search_items = [];

		await results.forEach(async result => {
			let peer, title, text, photo, status;

			if (result._ === 'peerChat') {
				const chat = chats[chats.findIndex(el => el.id === result.chat_id)];
				title = chat.title;
				text =
					chat.participants_count > 1
						? chat.participants_count + ' members'
						: chat.participants_count + ' member';
				photo = chat.photo && chat.photo._ !== 'chatPhotoEmpty' && chat.photo;
				peer = {
					...result,
					access_hash: chat.access_hash,
				};
			} else if (result._ === 'peerChannel') {
				const channel = chats[chats.findIndex(el => el.id === result.channel_id)];
				Config.Modes.debug && console.log('GOT CHANNEL', channel);
				Config.Modes.debug && console.log('IS SUPERGROUP? ', (channel.flags & (2 ** 8)) === 2 ** 8);
				title = channel.title;
				text =
					channel.participants_count > 1
						? channel.participants_count + ' members'
						: channel.participants_count + ' member';
				photo = channel.photo && channel.photo._ !== 'chatPhotoEmpty' && channel.photo;
				peer = {
					...result,
					access_hash: channel.access_hash,
				};
			} else {
				const user = users[users.findIndex(el => el.id === result.user_id)];
				const last_name = user.last_name ? ' ' + user.last_name : '';
				title = user.first_name + last_name;
				status = user.status;
				text = '@' + user.username;
				photo = user.photo && user.photo._ !== 'userPhotoEmpty' && user.photo;
				peer = user.access_hash
					? {
						...result,
						access_hash: user.access_hash,
					}
					: result;
			}

			if (photo) {
				photo = this.getPeerPhoto(peer.user_id || peer.chat_id || peer.channel_id);
			}

			search_items.push({
				title,
				peer,
				text,
				status,
				photo,
			});
		});

		return search_items;
	};

	getChatLink = (chatID, force) => this.AppProfileManager.getChatInviteLink(chatID, force);

	createChannel = (title, about) =>
		this.MtpApiManager.invokeApi(
			'channels.createChannel',
			{
				title: title || '',
				flags: 0,
				about: about || '',
			},
			this.options
		).then(data => {
			this.AppChatsManager.saveApiChats(data.chats);
			return data;
		});

	joinChat = link => {
		let regex;
		let hash;

		regex = link.match(/^https:\/\/telegram.me\/joinchat\/([\s\S]*)/);

		if (regex) {
			hash = regex[1];
		} else {
			hash = link;
		}

		return this.MtpApiManager.invokeApi('messages.importChatInvite', { hash: hash }).then(updates => {
			this.AppChatsManager.saveApiChats(updates.chats);
			this.AppUsersManager.saveApiUsers(updates.users);
		});
	};

	editChatAdmin = (chatID, userID, isAdmin) => {
		if (typeof isAdmin == 'undefined') {
			isAdmin = true;
		}

		isAdmin = !!isAdmin;
		chatID = this.AppChatsManager.getChatInput(chatID);
		userID = this.AppUsersManager.getUserInput(userID);

		return this.MtpApiManager.invokeApi('messages.editChatAdmin', {
			chat_id: chatID,
			user_id: userID,
			is_admin: isAdmin,
		});
	};

	editChatTitle = (chat_id, title) =>
		this.MtpApiManager.invokeApi('messages.editChatTitle', {
			chat_id: chat_id,
			title: title,
		});

	editChannelAdmin = (channel_id, user_id) =>
		this.MtpApiManager.invokeApi('channels.editAdmin', {
			channel: this.AppChatsManager.getChannelInput(channel_id),
			user_id: this.AppUsersManager.getUserInput(user_id),
			role: { _: 'channelRoleEditor' },
		});

	getFullChat = chat_id => this.MtpApiManager.invokeApi('messages.getFullChat', { chat_id });

	editChannelTitle = (channel_id, title) =>
		this.MtpApiManager.invokeApi('channels.editTitle', {
			channel: this.AppChatsManager.getChannelInput(channel_id),
			title: title,
		});

	editChatPhoto = (chat_id, photo) => {
		return this.MtpApiFileManager.uploadFile(photo).then(inputFile => {
			return this.MtpApiManager.invokeApi('messages.editChatPhoto', {
				chat_id: chat_id,
				photo: {
					_: 'inputChatUploadedPhoto',
					file: inputFile,
					crop: {
						_: 'inputPhotoCropAuto',
					},
				},
			});
		});
	};

	editChannelPhoto = (channel_id, photo) => {
		return this.MtpApiFileManager.uploadFile(photo).then(inputFile => {
			return this.MtpApiManager.invokeApi('channels.editPhoto', {
				channel: this.AppChatsManager.getChannelInput(channel_id),
				photo: {
					_: 'inputChatUploadedPhoto',
					file: inputFile,
					crop: {
						_: 'inputPhotoCropAuto',
					},
				},
			});
		});
	};

	getChatParticipants = async chat_id => {
		const chat = await this.getFullPeer(chat_id, 'chat');

		this.AppUsersManager.saveApiUsers(chat.users);

		if (chat && chat.full_chat && chat.full_chat._ === 'chatFull') {
			const onlineUsers = [],
				offlineUsers = [];

			chat.users.forEach(user => {
				if (user.status && user._ !== 'userEmpty') {
					user.status._ === 'userStatusOnline' ? onlineUsers.push(user) : offlineUsers.push(user);
				}
			});

			return { onlineUsers, offlineUsers };
		} else if (chat && chat.full_chat && chat.full_chat._ === 'channelFull') {
			const channel_peer = await this.getPeerByID(chat_id, 'chat');

			if (!this._checkFlag(channel_peer.flags, 8)) {
				return { onlineUsers: [], offlineUsers: [] };
			}

			const channel_users = await this.invokeApi('channels.getParticipants', {
				channel: this.mapPeerToInputPeer(channel_peer),
				filter: {
					_: 'channelParticipantsRecent',
				},
				offset: 0,
				limit: 200,
				hash: Math.round(Math.random() * 100),
			});

			this.AppUsersManager.saveApiUsers(channel_users.users);

			const onlineUsers = [],
				offlineUsers = [];

			channel_users.users.forEach(user => {
				if (user.status && user._ !== 'userEmpty') {
					user.status._ === 'userStatusOnline' ? onlineUsers.push(user) : offlineUsers.push(user);
				}
			});

			return { onlineUsers, offlineUsers };
		}

		return { onlineUsers: [], offlineUsers: [] };
	};

	// PROFILE ------------------------------------------------------

	getUserInfo = () =>
		this.MtpApiManager.getUserID().then(id => {
			const user = this.AppUsersManager.getUser(id);

			if (!user.id || !user.deleted) {
				return user;
			} else {
				return this.MtpApiManager.invokeApi('users.getFullUser', {
					id: { _: 'inputUserSelf' },
				}).then(userInfoFull => {
					this.AppUsersManager.saveApiUser(userInfoFull.user);
					return this.AppUsersManager.getUser(id);
				});
			}
		});

	getFullUserInfo = () =>
		this.MtpApiManager.getUserID().then(id => {
			const user = this.AppUsersManager.getFullUser(id);

			if (user.user && (!user.user.id || !user.user.deleted)) {
				return user;
			} else {
				return this.MtpApiManager.invokeApi('users.getFullUser', {
					id: { _: 'inputUserSelf' },
				}).then(userInfoFull => {
					this.AppUsersManager.saveFullUser(userInfoFull);
					return this.AppUsersManager.getFullUser(id);
				});
			}
		});

	getUserPhoto = size => {
		return this.getFullUserInfo().then(user => {
			Config.Modes.debug && console.log('USER', user);
			if (!user.profile_photo) {
				return null;
			}

			return this.getPhotoFile(user.profile_photo, size);
		});
	};

	editUserPhoto = photo => {
		return this.MtpApiFileManager.uploadFile(photo).then(inputFile => {
			return this.invokeApi('photos.uploadProfilePhoto', {
				file: inputFile,
			});
		});
	};

	spamMyself = async message => {
		this.invokeApi('messages.sendMessage', {
			peer: {
				_: 'inputPeerSelf',
			},
			message,
			random_id: Math.round(Math.random() * 100000),
		});
	};

	// SERVICE

	subscribeToUpdates = (type, handler) => {
		this.AppUpdatesManager.subscribe(type, handler);
	};

	getPeerByID = id => {
		const peer = this.AppPeersManager.getPeer(id);

		return new Promise((resolve, reject) => {
			if (!peer.deleted) {
				return resolve(peer);
			}

			let offsetDate = 0;
			let dialogsLoaded = 0;
			let totalCount = 0;
			let load;

			(load = () => {
				this.MtpApiManager.invokeApi('messages.getDialogs', {
					offset_peer: this.AppPeersManager.getInputPeerByID(0),
					limit: 100,
					offset_date: offsetDate,
				}).then(
					result => {
						this.AppChatsManager.saveApiChats(result.chats);
						this.AppUsersManager.saveApiUsers(result.users);

						dialogsLoaded += result.dialogs.length;
						totalCount = result.count;

						const peer = this.AppPeersManager.getPeer(id);

						if (!peer.deleted) {
							resolve(peer);
							return;
						}

						if (totalCount && dialogsLoaded < totalCount) {
							const dates = map(result.messages, msg => {
								return msg.date;
							});
							offsetDate = min(dates);
							load();
							return;
						}

						reject({ type: 'PEER_NOT_FOUND' });
					},
					err => {
						reject(err);
					}
				);
			})();
		});
	};

	getFullPeer = async peer_id => {
		const peer = await this.getPeerByID(peer_id);
		const mapped_peer = this.mapPeerToInputPeer(peer);

		let saved_peer;
		console.log(mapped_peer);

		switch (mapped_peer._) {
			case 'inputUser':
				if (mapped_peer.user_id === (await this.MtpApiManager.getUserID())) {
					return await this.getFullUserInfo();
				}
				saved_peer = this.AppUsersManager.getFullUser(mapped_peer.user_id);
				if (saved_peer && (!saved_peer.id || !saved_peer.deleted)) {
					return saved_peer;
				}
				return await this.invokeApi('users.getFullUser', {
					id: mapped_peer,
				}).then(fullUser => {
					this.AppUsersManager.saveFullUser(fullUser);
					return fullUser;
				});
			case 'inputChat':
				saved_peer = this.AppChatsManager.getFullChat(mapped_peer.chat_id);
				if (saved_peer && (!saved_peer.id || !saved_peer.deleted)) {
					return saved_peer;
				}
				return await this.invokeApi('messages.getFullChat', {
					chat_id: mapped_peer.chat_id,
				}).then(fullChat => {
					this.AppChatsManager.saveFullChat(fullChat);
					return fullChat;
				});
			case 'inputChannel':
				saved_peer = this.AppChatsManager.getFullChat(mapped_peer.id);
				if (saved_peer && (!saved_peer.id || !saved_peer.deleted)) {
					return saved_peer;
				}
				return await this.invokeApi('channels.getFullChannel', {
					channel: mapped_peer,
				}).then(fullChannel => {
					this.AppChatsManager.saveFullChat(fullChannel);
					return fullChannel;
				});
		}
	};

	//processing methods go from here

	_convertDate = date => {
		const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		let time = new Date(date * 1000);
		const currentTime = new Date();

		const startOfTheWeek = date => {
			const now = date ? new Date(date) : new Date();
			now.setHours(0, 0, 0, 0);
			const monday = new Date(now);
			monday.setDate(1);
			return monday;
		};

		const formatTime = t => (t < 10 ? '0' + t : t);

		if (time.getDay() - currentTime.getDay() === 0) {
			time = `${formatTime(time.getHours())}:${formatTime(time.getMinutes())}`;
		} else if (time.getDay() > startOfTheWeek(time)) {
			time = days[time.getDay()];
		} else {
			time = time.toLocaleDateString().replace(/[/]/g, '.');
			time = time.slice(0, 6) + time.slice(8);
		}

		return time;
	};

	_checkFlag = (flags, idx) => {
		return (flags & (2 ** idx)) === 2 ** idx;
	};

	_checkMessageFlags = msg_flags => ({
		out: this._checkFlag(msg_flags, 1),
		mentioned: this._checkFlag(msg_flags, 4),
		media_unread: this._checkFlag(msg_flags, 5),
		muted: this._checkFlag(msg_flags, 13),
		channel_post: this._checkFlag(msg_flags, 14),
		scheduled: this._checkFlag(msg_flags, 18),
		legacy: this._checkFlag(msg_flags, 19),
		hide_edit: this._checkFlag(msg_flags, 21),
	});

	_parseSearchMessage = (message, chats, users) => {
		const text = this._getMessageText(message);

		let msg_type, title, from_name, photo;

		let { from_id, to_id } = message;
		to_id = to_id.user_id || to_id.chat_id || to_id.channel_id || to_id;

		const { out, channel_post } = this._checkMessageFlags(message.flags);

		const to_peer = (to_id && chats.filter(el => el.id === to_id)[0]) || users.filter(el => el.id === to_id)[0];
		const from_peer = from_id && users.filter(el => el.id === from_id)[0];

		if (channel_post) {
			msg_type = 'channel';
			title = to_peer.title;

			if (to_peer && to_peer.photo && to_peer.photo._ !== 'chatPhotoEmpty') {
				photo = this.getPeerPhoto(to_id);
			}
		}

		if (!channel_post) {
			if (to_peer && to_peer._ !== 'user') {
				msg_type = 'chat';
				title = to_peer.title;
				from_name = from_peer.first_name;

				if (to_peer && to_peer.photo && to_peer.photo._ !== 'chatPhotoEmpty') {
					photo = this.getPeerPhoto(to_id);
				}
			} else {
				msg_type = 'pm';
				title = (from_peer.first_name + ' ' + (from_peer.last_name || '')).trim();

				if (out) {
					photo = this.getUserPhoto();
				} else if (from_peer && from_peer.photo && from_peer.photo._ !== 'userProfilePhotoEmpty') {
					photo = this.getPeerPhoto(from_id);
				}
			}
		}

		return {
			_: msg_type,
			title,
			text,
			from_name: from_name || '',
			to_peer: to_peer || {},
			from_peer: from_peer || {},
			date: message.date,
			id: message.id,
			photo,
			out,
		};
	};

	_getServiceMessage = message => {
		const from_peer = this.AppUsersManager.getUser(message.from_id);
		const result = {};

		let name;

		if (from_peer.id === this.user.id) {
			name = 'You';
		} else {
			name = (from_peer.first_name + ' ' + (from_peer.last_name || '')).trim();
		}

		const { action } = message;

		switch (action._) {
			case 'messageActionChatJoinedByLink':
				result.text = name + ' joined the group via invite link';
				break;
			case 'messageActionChatCreate':
				result.text = name + ' created the chat';
				break;
			case 'messageActionChatEditTitle':
				result.text = name + ' changed the chat title to ' + action.title;
				break;
			case 'messageActionChatEditPhoto':
				result.text = name + ' changed the chat photo';
				result.photo = this.getPhotoPreview(action.photo);
				break;
			case 'messageActionChatDeletePhoto':
				result.text = name + ' deleted the chat photo';
				break;
			case 'messageActionChatAddUser':
				result.text = action.users.reduce((prev, user) => {
					const new_peer = this.AppUsersManager.getUser(user);
					if (new_peer.id === from_peer.id) {
						return (prev || '') + name + ' joined the group\n';
					}
					return (
						(prev || '') + name + ' added ' + new_peer.first_name + ' ' + (new_peer.last_name || '') + '\n'
					);
				}, 0);
				break;
			case 'messageActionChatDeleteUser':
				const deleted_peer = this.AppUsersManager.getUser(action.user_id);
				if (from_peer.id === deleted_peer.id) {
					result.text = name + ' left the group';
				} else {
					result.text = name + ' removed ' + deleted_peer.first_name;
				}
				break;
			case 'messageActionChannelCreate':
				result.text = 'Channel was created';
				break;
			case 'messageActionPinMessage':
				result.text = name + ' pinned the message';
				break;
			case 'messageActionPhoneCall':
				result.text = 'Incoming call';
				result.duration = action.duration;
				break;
			case 'messageActionContactSignUp':
				result.text = name + ' just joined the Telegram!';
				break;
		}

		return result;
	};

	_getMessageText = message => {
		let text = message.message;

		if (!text || (message.media && message.media._ !== 'messageMediaEmpty')) {
			if (message._ === 'messageService') {
				text = this._getServiceMessage(message).text;
			} else {
				const type = message.media && message.media._;
				const getDocumentText = media => {
					const doc = media.document;

					let isSticker,
						filename,
						fin_text = '';

					if (doc.attributes) {
						doc.attributes.forEach(attr => {
							if (attr._ === 'documentAttributeAnimated') {
								fin_text = 'GIF';
							}
							if (attr._ === 'documentAttributeSticker') {
								fin_text = attr.alt + ' Sticker';
								isSticker = true;
							}
							if (attr._ === 'documentAttributeVideo') {
								fin_text = 'Video';
							}
							if (attr._ === 'documentAttributeAudio') {
								if (this._checkFlag(attr.flags, 10)) {
									fin_text = 'Voice Message';
								} else {
									fin_text = '🎵' + attr.title + ' - ' + attr.performer;
								}
							}
							if (attr._ === 'documentAttributeFilename') {
								filename = attr.file_name;
							}
						});

						if (isSticker) {
							return fin_text;
						}
						if (filename && !fin_text) {
							return filename;
						}
						return fin_text;
					}
				};

				if (type) {
					switch (type) {
						case 'messageMediaPhoto':
							text = text ? '🖼️ ' + text : 'Photo';
							break;
						case 'messageMediaGeo':
							text = 'Location';
							break;
						case 'messageMediaContact':
							text = 'Contact';
							break;
						case 'messageMediaDocument':
							text = getDocumentText(message.media);
							break;
						case 'messageMediaPoll':
							text = 'Poll';
							break;
						default:
							text = text || 'Unsupported message';
					}
				}
			}
		}

		return text;
	};

	_parseDialog = (dialog, chats, messages, users) => {
		let peer = dialog.peer;
		let title,
			from_name,
			status,
			photo,
			is_supergroup = false;
		if (peer._ === 'peerChat') {
			const chat = chats[chats.findIndex(el => el.id === peer.chat_id)];
			title = chat.title;
			if (chat.photo && chat.photo._ !== 'chatPhotoEmpty') {
				photo = chat.photo;
			}
		} else if (peer._ === 'peerChannel') {
			const idx = chats.findIndex(el => el.id === peer.channel_id);
			const channel = chats[idx];

			is_supergroup = this._checkFlag(channel.flags, 8);

			title = channel.title;
			if (channel.photo && channel.photo._ !== 'chatPhotoEmpty') {
				photo = channel.photo;
			}
			peer = {
				...peer,
				access_hash: channel.access_hash,
			};
		} else {
			const user = users[users.findIndex(el => el.id === peer.user_id)];
			const last_name = user.last_name ? ' ' + user.last_name : '';
			title = user.first_name + last_name;
			status = user.status;
			if (user.photo && user.first_name !== 'Telegram') {
				photo = user.photo;
			}
			peer = user.access_hash
				? {
					...peer,
					access_hash: user.access_hash,
				}
				: peer;
		}
		const message = messages[messages.findIndex(el => el.id === dialog.top_message)];
		from_name = users.filter(el => el.id === message.from_id)[0];
		if (from_name) {
			from_name = from_name.first_name;
		}
		let { date, flags: msg_flags } = message;
		const unread_count = dialog.unread_count;

		const text = this._getMessageText(message);

		if (photo) {
			photo = this.getPeerPhoto(peer.user_id || peer.chat_id || peer.channel_id);
		}

		const message_info = this._checkMessageFlags(msg_flags);

		if (message_info.out) {
			message_info.outRead = dialog.read_outbox_max_id >= dialog.top_message;
			from_name = 'You';
		}

		return {
			title: title,
			isOnline: status && status._ === 'userStatusOnline',
			text: text,
			message_info,
			pinned: this._checkFlag(dialog.flags, 2),
			muted: this._checkFlag(dialog.notify_settings.flags, 1),
			draft: dialog.draft && dialog.draft._ !== 'draftMessageEmpty' ? dialog.draft : null,
			archived: dialog.folder_id && dialog.folder_id === 1,
			time: this._convertDate(date),
			unreadCount: unread_count,
			dialog_peer: peer,
			is_supergroup,
			photo,
			from_name,
		};
	};

	mapPeerToInputPeer = peer => {
		const type = peer._;

		switch (type) {
			case 'inputPeerUser':
			case 'user':
				return {
					...peer,
					_: 'inputUser',
					user_id: peer.user_id ? peer.user_id.toString() : peer.id.toString(),
				};

			case 'inputPeerChat':
			case 'chat':
				return {
					...peer,
					_: 'inputChat',
					chat_id: peer.chat_id ? peer.chat_id.toString() : peer.id.toString(),
				};

			case 'inputPeerChannel':
			case 'channel':
				return {
					...peer,
					_: 'inputChannel',
					channel_id: peer.channel_id ? peer.channel_id.toString() : peer.id.toString(),
				};

			default:
				return peer;
		}
	};

	mapPeerTypeToType = type => {
		switch (type) {
			case 'inputPeerUser':
			case 'inputUser':
			case 'peerUser':
				return 'user';

			case 'inputPeerChat':
			case 'inputChat':
			case 'peerChat':
				return 'chat';

			case 'inputPeerChannel':
			case 'inputChannel':
			case 'peerChannel':
				return 'channel';

			default:
				return type;
		}
	};

	mapPeerToTruePeer = peer => {
		const type = peer._;

		switch (type) {
			case 'peerUser':
			case 'user':
				return {
					...peer,
					_: 'inputPeerUser',
					user_id: peer.user_id ? peer.user_id.toString() : peer.id,
				};

			case 'peerChat':
			case 'chat':
				return {
					...peer,
					_: 'inputPeerChat',
					chat_id: peer.chat_id ? peer.chat_id.toString() : peer.id,
				};

			case 'peerChannel':
			case 'channel':
				return {
					...peer,
					_: 'inputPeerChannel',
					channel_id: peer.channel_id ? peer.channel_id.toString() : peer.id,
				};

			default:
				return peer;
		}
	};

	_getStickerData = async (sticker, id) => {
		if (!(sticker instanceof Array)) {
			Config.Modes.debug && console.log('GOT CACHED', sticker);
			return sticker;
		}
		const decoded_text = new TextDecoder('utf-8').decode(await pako.inflate(sticker[0]));
		const data = JSON.parse(decoded_text);
		if (id) {
			Config.Modes.debug && console.log('SAVING', data);
			this.MtpApiFileManager.saveLocalFile(id, { bytes: data });
		}
		return data;
	};

	setStickerToContainer = (sticker, container, cacheId) => {
		return this._getStickerData(sticker.bytes, cacheId).then(st => {
			return lottie.loadAnimation({
				container: container,
				renderer: 'svg',
				loop: true,
				autoplay: false,
				animationData: st,
			});
		});
	};

	_fillPhotosPromises = async (photos = []) => {
		const photo_promises = [];
		photos.forEach(photo => {
			if (photo) {
				photo_promises.push({
					photo: this.getPhotoPreview(photo.photo),
					caption: photo.caption,
					id: photo.id,
					msg_id: photo.msg_id,
				});
			}
		});
		return photo_promises;
	};

	_fillDocumentsPromises = async (docs = []) => {
		const doc_results = [];
		docs.forEach(doc => {
			const new_doc = { ...doc };

			// if (doc.thumbs) {
			// 	new_doc.preview = this.getDocumentPreview(doc);
			// }

			doc_results.push(new_doc);
		});

		return doc_results;
	};

	_getImageData = async (bytes, id) => {
		if (!(bytes instanceof Uint8Array)) {
			return bytes;
		}
		const data = window.URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
		if (id) {
			this.MtpApiFileManager.saveLocalFile(id, data);
		}
		return data;
	};

	_getVideoData = async (bytes, id) => {
		// const byteArray = ;
		// console.log('BTARRAY', byteArray);
		if (!(bytes instanceof Array)) {
			return bytes;
		}
		const blob = new Blob(bytes, { type: 'video/mp4' });
		console.log('BLOB', blob);
		const data = window.URL.createObjectURL(blob);
		if (id) {
			this.MtpApiFileManager.saveLocalFile(id, { bytes: data });
		}
		return data;
	};
}

const telegramApi = new TelegramApi();
export { telegramApi };
