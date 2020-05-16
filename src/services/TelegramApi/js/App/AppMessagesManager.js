import AppUsersManagerModule from './AppUsersManager';
import { tlFlags } from '../lib/utils';
import AppPeersManager from './AppPeersManager';
import { telegramApi } from '../../TelegramApi';
import AppProfileManager from './AppProfileManager';
import AppChatsManager from './AppChatsManager';

class AppMessagesManagerModule {
	current_peer = 0;
	window_size = 60;

	constructor() {
		this.messagesDatabase = {};
		this.AppUsersManager = AppUsersManagerModule;
	}

	saveMessages = (messages = []) => {
		messages.forEach(message => this.saveMessage(message));
	};

	_getMessagePeerId = message => {
		if (!message.from_id) {
			return message.to_id.channel_id;
		}

		if (
			message.to_id._ === 'peerChat' ||
			message.to_id._ === 'peerChannel'
		) {
			return message.to_id.channel_id || message.to_id.chat_id;
		}

		if (message.from_id === AppProfileManager.getProfileId()) {
			return (
				message.to_id.channel_id ||
				message.to_id.chat_id ||
				message.to_id.user_id
			);
		}

		return message.from_id;
	};

	messageDump = async id => {
		const peer = AppPeersManager.getInputPeerByID(id);
		const history = await telegramApi.invokeApi('messages.getHistory', {
			peer,
			offset_id: 0,
			limit: 100,
		});

		const result = history.messages;

		if (result.length < history.count) {
			let current = 100;
			const count = history.count;

			while (current < count) {
				const buf = await telegramApi.invokeApi('messages.getHistory', {
					peer,
					offset_id: result[result.length - 1].id,
					limit: 100,
				});

				result.push(...buf.messages);
				current += buf.messages.length;
			}
		}

		const formattedResult = [];

		result.forEach(mess => {
			if (mess.message) {
				formattedResult.push(mess.message);
			}
		});

		console.log(JSON.stringify(formattedResult));
	};

	_getMessageFlags = message => {
		const messageFlags = tlFlags(message.flags);

		return {
			out: messageFlags(1),
			mentioned: messageFlags(4),
			media_unread: messageFlags(5),
			muted: messageFlags(13),
			channel_post: messageFlags(14),
			scheduled: messageFlags(18),
			legacy: messageFlags(19),
			hide_edit: messageFlags(21),
		};
	};

	saveMessage = (message, peerId = this._getMessagePeerId(message)) => {
		const peerMessages = (this.messagesDatabase[peerId] = this
			.messagesDatabase[peerId] || {
			messages: {},
			current_pos: 0,
			no_fetch: false,
		});

		peerMessages.messages[message.id] = {
			...message,
			...this._getMessageFlags(message),
			formattedText: this._getMessageText(message),
		};

		return peerMessages[message.id];
	};

	_fetchMessages = async (peerId, up, down, offset_id) => {
		const peer = AppPeersManager.getInputPeerByID(peerId);

		if (!peer) {
			return;
		}

		const payload = {
			peer,
			limit: down + up,
		};

		if (offset_id) {
			payload.offset_id = offset_id;
			payload.add_offset = -down;
		}

		const result = await telegramApi.invokeApi(
			'messages.getHistory',
			payload
		);

		this.AppUsersManager.saveApiUsers(result.users);
		AppChatsManager.saveApiChats(result.chats);
		this.saveMessages(result.messages);
	};

	getCurrentMessages = async (peerId, window_size = this.window_size) => {
		if (this.window_size !== window_size) {
			this.window_size = window_size;
		}

		this.current_peer = peerId;

		let messages_meta = this.getMessagesMeta(peerId);

		if (!messages_meta) {
			console.log('No meta');
			return [];
		}

		let current_messages = Object.values(this.getMessages(peerId) || {});

		if (current_messages.length < window_size && !messages_meta.no_fetch) {
			await this._fetchMessages(peerId, window_size, 0);

			messages_meta = this.getMessagesMeta(peerId);
			current_messages = Object.values(this.getMessages(peerId) || {});

			if (!messages_meta || current_messages.length === 0) {
				console.log(
					'No meta or messages',
					messages_meta,
					current_messages
				);
				return [];
			}

			if (current_messages.length < window_size) {
				messages_meta.no_fetch = true;
				return current_messages;
			}
		}

		let [first_idx, last_idx] = this._calculateIndecies(peerId);

		if (first_idx < 0 && !messages_meta.no_fetch) {
			await this._fetchMessages(
				peerId,
				window_size,
				0,
				current_messages[0].id
			);

			[first_idx, last_idx] = this._calculateIndecies(peerId);

			if (first_idx < 0) {
				messages_meta.no_fetch = true;
				messages_meta.current_pos =
					current_messages.length - 1 - window_size;
				return current_messages.slice(0, window_size);
			}
		} else if (messages_meta.no_fetch) {
			return current_messages.slice(0, window_size);
		}

		return current_messages.slice(first_idx, last_idx);
	};

	getNextMessages = async () => {
		const peerId = this.current_peer;
		const messages_meta = this.getMessagesMeta(peerId);

		if (!messages_meta) {
			return [];
		}

		const current_messages = Object.values(this.getMessages(peerId));

		if (messages_meta.current_pos >= current_messages.length - 1) {
			return this.getCurrentMessages(peerId);
		}

		messages_meta.current_pos += this.window_size;

		return this.getCurrentMessages(peerId);
	};

	getPreviousMessages = async () => {
		const peerId = this.current_peer;
		const messages_meta = this.getMessagesMeta(peerId);

		if (!messages_meta) {
			return [];
		}

		messages_meta.current_pos = Math.max(
			0,
			messages_meta.current_pos - this.window_size
		);

		return this.getCurrentMessages(peerId);
	};

	_calculateIndecies = peerId => {
		const len = Object.values(this.getMessages(peerId) || {}).length;
		const meta = this.getMessagesMeta(peerId);

		return [
			len - meta.current_pos - this.window_size,
			len - meta.current_pos,
		];
	};

	getMessages = peerId => {
		return (
			(this.messagesDatabase[peerId] &&
				this.messagesDatabase[peerId].messages) ||
			null
		);
	};

	getMessagesMeta = peerId => {
		return this.messagesDatabase[peerId] || null;
	};

	getMessage = (peerId, id) => {
		if (!this.messagesDatabase[peerId]) {
			return null;
		}

		return this.messagesDatabase[peerId].messages[id] || null;
	};

	sendMessage = async (peerId, message, reply_to, schedule_date) => {
		const peer = this.AppPeersManager.getPeer(peerId);
		const payload = {
			flags: 0,
			peer,
			message,
			random_id: [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)],
			entities: [],
		};

		if (reply_to) {
			payload.reply_to_msg_id = reply_to;
		}

		if (schedule_date) {
			payload.schedule_date = schedule_date;
		}

		return await telegramApi.invokeApi('messages.sendMessage', payload);
	};

	_getMessageText = message => {
		let text = message.message;

		if (
			!text ||
			(message.media && message.media._ !== 'messageMediaEmpty')
		) {
			if (message._ === 'messageService') {
				text = 'service'; //this._getServiceMessage(message).text;
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
								if (tlFlags(attr.flags, 10)) {
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

	_getServiceMessage = message => {
		const from_peer = this.AppUsersManager.getUser(message.from_id);
		const result = {};

		let name;

		if (from_peer && from_peer.id === AppProfileManager.getProfileId()) {
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
				// TODO USE METHOD FROM FILEMANAGER
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
}

export default new AppMessagesManagerModule();
