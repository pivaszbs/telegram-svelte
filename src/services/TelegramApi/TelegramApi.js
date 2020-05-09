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
import AppMessagesManagerModule from './js/App/AppMessagesManager';
import logger from './js/lib/logger';

class TelegramApi {
	options = { dcID: 2, createNetworker: true };

	user = {};

	AppChatsManager = AppsChatsManagerModule;
	AppUsersManager = AppUsersManagerModule;

	AppPeersManager = AppPeersManagerModule;
	AppProfileManager = AppProfileManagerModule;

	MtpApiManager = MtpApiManagerModule;
	// MtpApiFileManager = new MtpApiFileManagerModule();
	MtpPasswordManager = new MtpPasswordManagerModule();
	FileSaver = new FileSaverModule();
	MtpNetworkerFactory = MtpNetworkerFactoryModule;

	AppUpdatesManager = AppUpdatesManagerModule;
	AppMessagesManager = AppMessagesManagerModule;

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
		this.MtpApiFileManager = MtpApiFileManagerModule;

		this.setConfig({
			app: {
				id: 1166576 /* App ID */,
				hash: '99db6db0082e27973ee4357e4637aadc' /* App hash */,
				version: '0.0.1' /* App version */,
			},
			server: {
				production: [
					{ id: 1, host: 'pluto.web.telegram.org', port: 80 },
					{ id: 2, host: 'venus.web.telegram.org', port: 80 },
					{ id: 3, host: 'aurora.web.telegram.org', port: 80 },
					{ id: 4, host: 'vesta.web.telegram.org', port: 80 },
					{ id: 5, host: 'flora.web.telegram.org', port: 80 },
				],
			},
			mode: {
				test: false,
				debug: true,
			},
		});
	}

	// MAIN METHODS ------------------------------------------------------

	invokeApi = async (method, params) =>
		await this.MtpApiManager.invokeApi(method, params);

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

		this.MtpApiManager.invokeApi(
			'help.getNearestDc',
			{},
			this.options
		).then(nearestDcResult => {
			if (nearestDcResult.nearest_dc != nearestDcResult.this_dc) {
				this.MtpApiManager.getNetworker(nearestDcResult.nearest_dc, {
					createNetworker: true,
				});
			}
		});
	};

	profileManager = {
		sendCode: this.AppProfileManager.sendCode,
		signIn: this.AppProfileManager.signIn,
		signUp: this.AppProfileManager.signUp,
		signIn2FA: this.AppProfileManager.signIn2FA,
		logOut: this.AppProfileManager.logOut,
		isAuth: this.AppProfileManager.isAuth,
		getProfile: this.AppProfileManager.getProfile,
		getProfileId: this.AppProfileManager.getProfileId,
	};

	peerManager = {
		getPeerById: this.AppPeersManager.getPeer,
		getPeerId: this.AppPeersManager.getPeerId,
		getDialog: this.AppChatsManager.getDialog,
	};

	messageManager = {
		getMessages: this.AppMessagesManager.getMessages,
	};

	checkPhone = phone_number =>
		this.MtpApiManager.invokeApi('auth.checkPhone', {
			phone_number: phone_number,
		});

	// MESSAGES AND FILES ------------------------------------------------------

	_asyncForEach = async (array, callback) => {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	};

	getMessageByID = id => {
		return this.invokeApi('messages.getMessages', {
			_: 'inputMessageID',
			id: [id],
		});
	};

	getPhotoFile = async photo => {
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
				message_items.push(
					this._parseSearchMessage(message, res.chats, res.users)
				);
			});

			return message_items;
		});
	};

	getPeerPhotos = async (peer_id, offset_id = 0, limit = 30) => {
		return this.searchPeerMessages(
			peer_id,
			'',
			{ _: 'inputMessagesFilterPhotos' },
			limit,
			offset_id
		).then(messages => {
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
		});
	};

	getPeerDocuments = async (peer_id, offset_id = 0, limit = 100) => {
		return this.searchPeerMessages(
			peer_id,
			'',
			{ _: 'inputMessagesFilterDocument' },
			limit,
			offset_id
		).then(messages => {
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
		});
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
				return this.MtpApiManager.invokeApi(
					'messages.toggleChatAdmins',
					{
						chat_id: updates.chats[0].id,
						enabled: true,
					}
				);
			} else {
				return updates;
			}
		});
	};

	fetchDialogs = async (down, up, offset = 0) => {
		const request = {
			offset_peer: this.AppPeersManager.getInputPeerByID(0),
			offset_date: offset,
			limit: down,
		};

		const dialogs = await this.MtpApiManager.invokeApi(
			'messages.getDialogs',
			request
		);

		this.AppUsersManager.saveApiUsers(dialogs.users);
		this.AppChatsManager.saveApiChats(dialogs.chats);
		this.AppMessagesManager.saveMessages(dialogs.messages);
		this.AppChatsManager.saveDialogs(dialogs.dialogs);

		return this.AppChatsManager.getCurrentDialogs();
	};

	getFullChat = chat_id =>
		this.MtpApiManager.invokeApi('messages.getFullChat', { chat_id });

	getChatParticipants = async chat_id => {
		const chat = await this.getFullPeer(chat_id, 'chat');

		this.AppUsersManager.saveApiUsers(chat.users);

		if (chat && chat.full_chat && chat.full_chat._ === 'chatFull') {
			const onlineUsers = [],
				offlineUsers = [];

			chat.users.forEach(user => {
				if (user.status && user._ !== 'userEmpty') {
					user.status._ === 'userStatusOnline'
						? onlineUsers.push(user)
						: offlineUsers.push(user);
				}
			});

			return { onlineUsers, offlineUsers };
		} else if (
			chat &&
			chat.full_chat &&
			chat.full_chat._ === 'channelFull'
		) {
			const channel_peer = await this.getPeerByID(chat_id, 'chat');

			if (!this._checkFlag(channel_peer.flags, 8)) {
				return { onlineUsers: [], offlineUsers: [] };
			}

			const channel_users = await this.invokeApi(
				'channels.getParticipants',
				{
					channel: this.mapPeerToInputPeer(channel_peer),
					filter: {
						_: 'channelParticipantsRecent',
					},
					offset: 0,
					limit: 200,
					hash: Math.round(Math.random() * 100),
				}
			);

			this.AppUsersManager.saveApiUsers(channel_users.users);

			const onlineUsers = [],
				offlineUsers = [];

			channel_users.users.forEach(user => {
				if (user.status && user._ !== 'userEmpty') {
					user.status._ === 'userStatusOnline'
						? onlineUsers.push(user)
						: offlineUsers.push(user);
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

			console.log('USER', user);

			if (user) {
				return user;
			} else {
				return this.MtpApiManager.invokeApi('users.getFullUser', {
					id: { _: 'inputUserSelf' },
				})
					.then(userInfoFull => {
						this.AppUsersManager.saveApiUser(userInfoFull.user);
						return this.AppUsersManager.getUser(id);
					})
					.catch(err => {
						return {};
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
			logger('USER', user);
			if (!user.profile_photo) {
				return null;
			}

			return this.getPhotoFile(user.profile_photo, size);
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
				if (
					mapped_peer.user_id ===
					(await this.MtpApiManager.getUserID())
				) {
					return await this.getFullUserInfo();
				}
				saved_peer = this.AppUsersManager.getFullUser(
					mapped_peer.user_id
				);
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
				saved_peer = this.AppChatsManager.getFullChat(
					mapped_peer.chat_id
				);
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

		const to_peer =
			(to_id && chats.filter(el => el.id === to_id)[0]) ||
			users.filter(el => el.id === to_id)[0];
		const from_peer = from_id && users.filter(el => el.id === from_id)[0];

		if (channel_post) {
			msg_type = 'channel';
			title = to_peer.title;

			if (
				to_peer &&
				to_peer.photo &&
				to_peer.photo._ !== 'chatPhotoEmpty'
			) {
				photo = this.getPeerPhoto(to_id);
			}
		}

		if (!channel_post) {
			if (to_peer && to_peer._ !== 'user') {
				msg_type = 'chat';
				title = to_peer.title;
				from_name = from_peer.first_name;

				if (
					to_peer &&
					to_peer.photo &&
					to_peer.photo._ !== 'chatPhotoEmpty'
				) {
					photo = this.getPeerPhoto(to_id);
				}
			} else {
				msg_type = 'pm';
				title = (
					from_peer.first_name +
					' ' +
					(from_peer.last_name || '')
				).trim();

				if (out) {
					photo = this.getUserPhoto();
				} else if (
					from_peer &&
					from_peer.photo &&
					from_peer.photo._ !== 'userProfilePhotoEmpty'
				) {
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
			name = (
				from_peer.first_name +
				' ' +
				(from_peer.last_name || '')
			).trim();
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
				result.text =
					name + ' changed the chat title to ' + action.title;
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
						(prev || '') +
						name +
						' added ' +
						new_peer.first_name +
						' ' +
						(new_peer.last_name || '') +
						'\n'
					);
				}, 0);
				break;
			case 'messageActionChatDeleteUser':
				const deleted_peer = this.AppUsersManager.getUser(
					action.user_id
				);
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

		if (
			!text ||
			(message.media && message.media._ !== 'messageMediaEmpty')
		) {
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
									fin_text =
										'🎵' +
										attr.title +
										' - ' +
										attr.performer;
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
		return {
			title: 'Test',
			isOnline: true,
			text: 'text',
			message_info: {},
			pinned: true,
			muted: true,
			draft: false,
			archived: false,
			time: this._convertDate(Date.now()),
			unreadCount: 1,
			dialog_peer: { _: 'peerUser' },
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
					user_id: peer.user_id
						? peer.user_id.toString()
						: peer.id.toString(),
				};

			case 'inputPeerChat':
			case 'chat':
				return {
					...peer,
					_: 'inputChat',
					chat_id: peer.chat_id
						? peer.chat_id.toString()
						: peer.id.toString(),
				};

			case 'inputPeerChannel':
			case 'channel':
				return {
					...peer,
					_: 'inputChannel',
					channel_id: peer.channel_id
						? peer.channel_id.toString()
						: peer.id.toString(),
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
					channel_id: peer.channel_id
						? peer.channel_id.toString()
						: peer.id,
				};

			default:
				return peer;
		}
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
}

const telegramApi = new TelegramApi();
export { telegramApi };
