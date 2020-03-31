import { forEach, isObject } from '../Etc/Helper';
import AppUsersManagerModule from './AppUsersManager';
import { tlFlags } from '../lib/utils';
import AppPeersManagerModule from './AppPeersManager';
import MtpApiFileManagerModule from '../Mtp/MtpApiFileManager';
import { telegramApi } from '../../TelegramApi';

export default class AppMessagesManagerModule {
	static instance = null;

	constructor() {
		if (AppMessagesManagerModule.instance) {
			return AppMessagesManagerModule.instance;
		}

		this.messages = {};
		this.AppUsersManager = new AppUsersManagerModule();
		this.AppPeersManager = new AppPeersManagerModule();

		AppMessagesManagerModule.instance = this;
	}

	saveMessages = (peerId, messages = []) => {
		messages.forEach(message => this.saveMessage(peerId, message));
	};

	saveMessage = (peerId, message) => {
		this.messages[peerId] = this.messages[peerId] || {};

		const peerMessages = this.messages[peerId];

		const messageFlags = tlFlags(message.flags);

		peerMessages[message.id] = {
			out: messageFlags(1),
			mentioned: messageFlags(4),
			media_unread: messageFlags(5),
			muted: messageFlags(13),
			channel_post: messageFlags(14),
			scheduled: messageFlags(18),
			legacy: messageFlags(19),
			hide_edit: messageFlags(21),
			id: message.id,
			from_id: message.from_id || -1,
			to_id: message.to_id.user_id || message.to_id.chat_id || message.to_id.channel_id,
			fwd_from: message.fwd_from,
			reply_id: message.reply_to_msg_id,
			date: new Date(message.date * 1000),
			message: this._getMessageText(message),
			media: message.media,
			entities: message.entities,
			views: message.views,
			edit_date: new Date(message.edit_date * 1000),
			post_author: message.post_author || '',
			grouped_id: message.grouped_id,
		};
	};

	getMessages = peerId => {
		return this.messages[peerId] || null;
	};

	getMessage = (peerId, id) => {
		if (!this.messages[peerId]) {
			return null;
		}

		return this.messages[peerId][id] || null;
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

		return telegramApi.invokeApi('messages.sendMessage', payload);
	};

	getMessagesManagerForPeerId = peerId => {
		return {
			saveMessages: (messages = []) => this.saveMessage(peerId, messages),
			saveMessage: message => this.saveMessage(peerId, message),
			getMessages: () => this.getMessages(peerId),
			getMessage: id => this.getMessage(peerId, id),
		};
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
								if (tlFlags(attr.flags, 10)) {
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
}
