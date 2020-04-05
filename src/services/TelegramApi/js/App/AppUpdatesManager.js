import MtpNetworkerFactoryModule from '../Mtp/MtpNetworkerFactory';
// import { telegramApi } from '../../../../App';
import AppUsersManagerModule from './AppUsersManager';
import AppMessagesManagerModule from './AppMessagesManager';
import { telegramApi } from '../../TelegramApi';

class AppUpdatesManagerModule {
	subscribed = {
		status: [],
		messages: [],
		misc: [],
		dialogs: [],
	};

	MtpNetworkerFactory = MtpNetworkerFactoryModule();

	constructor() {
		this.AppUsersManager = AppUsersManagerModule;
		const updatesHandler = data => {
			// console.log('Got event', data);
			if (data._ === 'updateShort' || data._ === 'updates') {
				this._parseUpdate(data);
			} else if (
				data._ === 'updateShortMessage' ||
				data._ === 'updateShortChatMessage'
			) {
				this._parseUpdate({ update: data });
			}
		};

		this.MtpNetworkerFactory.subscribe('updateHandler', updatesHandler);
	}

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

	passUpdate = data => {
		console.log('Got event', data);
		if (data._ === 'updateShort' || data._ === 'updates') {
			this._parseUpdate(data);
		} else if (
			data._ === 'updateShortMessage' ||
			data._ === 'updateShortChatMessage'
		) {
			this._parseUpdate({ update: data });
		}
	};

	subscribe = (type, handler) => {
		if (!type || !this.subscribed[type] || typeof handler !== 'function') {
			return;
		}

		this.subscribed[type].push(handler);
	};

	_parseUpdate = data => {
		console.log('Got update!', data);
		const switchUpdate = update => {
			switch (update._) {
				case 'updateNewMessage':
				case 'updateNewChannelMessage':
				case 'updateNewEncryptedMessage':
				case 'updateNewScheduledMessage':
					this._handleNewMessage(update, data);
					break;
				case 'updateShortChatMessage':
					this._handleNewChatMessage(update);
					break;
				case 'updateShortMessage':
					this._handleNewUserMessage(update);
					break;
				case 'updateUserStatus':
					this._handleUserStatus(update);
					break;
				case 'updateChatUserTyping':
				case 'updateUserTyping':
					console.log(update);
					this._handleUserTyping(update);
					break;
				case 'updateChatParticipantAdd':
					break;
				case 'updateChatParticipantDelete':
					break;
				default:
					console.log('UNHANDLED', update);
			}
		};
		if (data.updates) {
			data.updates.forEach(switchUpdate);
		} else {
			switchUpdate(data.update);
		}
	};

	_handleUserStatus = async update => {
		const payload = {
			_: 'userStatus',
			user_id: update.user_id,
			online: update.status._ === 'userStatusOnline',
		};

		this._dispatchForDialogs(payload);
	};

	_handleUserTyping = async update => {
		const user = this.AppUsersManager.getUser(update.user_id);

		const payload = {
			_: update._ === 'updateUserTyping' ? 'userTyping' : 'chatTyping',
			user_id: update.user_id,
			chat_id: update.chat_id,
			from_name: user.first_name,
		};

		let action;
		switch (update.action._) {
			case 'sendMessageTypingAction':
				action = 'is typing';
				break;
			case 'sendMessageRecordVideoAction':
				action = 'is recording video';
				break;
			case 'sendMessageUploadVideoAction':
				action = 'is uploading video';
				break;
			case 'sendMessageRecordAudioAction':
				action = 'is recording voice message';
				break;
			case 'sendMessageUploadAudioAction':
				action = 'is uploading audio';
				break;
			case 'sendMessageUploadPhotoAction':
				action = 'is uploading photo';
				break;
			case 'sendMessageUploadDocumentAction':
				action = 'is uploading document';
				break;
			case 'sendMessageGeoLocationAction':
				action = 'is sharing geo location';
				break;
			case 'sendMessageChooseContactAction':
				action = 'is sharing contact';
				break;
			case 'sendMessageGamePlayAction':
				action = 'is playing a game';
				break;
			case 'sendMessageRecordRoundAction':
				action = 'is recording a story';
				break;
			case 'sendMessageUploadRoundAction':
				action = 'is uploading a story';
				break;
			default:
				action = '';
		}

		payload.action = action;

		this._dispatchForDialogs(payload);
	};

	_handleNewChatMessage = async message => {
		const { from_id, chat_id, date, id, flags } = message;

		const dialog = telegramApi.AppChatsManager.getDialog(chat_id);
		if (!dialog.deleted) {
			telegramApi.AppChatsManager.saveDialog({
				...dialog,
				id,
			});
		}

		const payload = {
			_: 'newMessage',
			from_id,
			to_id: chat_id,
			date,
			message: telegramApi._getMessageText(message),
			id,
			message_info: this._checkMessageFlags(flags),
		};

		this._dispatchForDialogs(payload);
		this._dispatchForMessages(payload);
	};

	_handleNewUserMessage = async message => {
		const { user_id, date, id, flags } = message;

		const dialog = telegramApi.AppChatsManager.getDialog(user_id);
		if (!dialog.deleted) {
			telegramApi.AppChatsManager.saveDialog({
				...dialog,
				top_message: id,
			});
		}

		const payload = {
			_: 'newMessage',
			from_id: user_id,
			date,
			message: telegramApi._getMessageText(message),
			id,
			message_info: this._checkMessageFlags(flags),
		};

		this._dispatchForDialogs(payload);
		this._dispatchForMessages(payload);
	};

	_handleNewMessage = update => {
		// console.log('Got new message! ', update, data);

		const message = update.message;

		const from_id = message.from_id;

		const to_id =
			message.to_id.user_id ||
			message.to_id.chat_id ||
			message.to_id.channel_id;

		this.AppUsersManager.saveApiUsers(update.users);

		const payload = {
			_: 'newMessage',
			from_id,
			to_id,
			message:
				message._ === 'messageService'
					? telegramApi._getServiceMessage(message).text
					: telegramApi._getMessageText(message),
			message_info: this._checkMessageFlags(message.flags),
			date: message.date,
			id: message.id,
		};

		// console.log(payload);

		const dialog = telegramApi.AppChatsManager.getDialog(to_id);

		if (!dialog.deleted) {
			telegramApi.AppChatsManager.saveDialog({
				...dialog,
				top_message: message.id,
			});
		}

		const messageManager = AppMessagesManagerModule;
		messageManager.saveMessage(message);

		this._dispatchForDialogs(payload);
		this._dispatchForMessages(payload);
	};

	_dispatchEvent = (handler, payload) => {
		handler(payload);
	};

	_dispatchForDialogs = payload => {
		this.subscribed.dialogs.forEach(el => this._dispatchEvent(el, payload));
	};

	_dispatchForMessages = payload => {
		this.subscribed.messages.forEach(el =>
			this._dispatchEvent(el, payload)
		);
	};
}

export default new AppUpdatesManagerModule();
