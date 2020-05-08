import MtpNetworkerFactoryModule from '../Mtp/MtpNetworkerFactory';
// import { telegramApi } from '../../../../App';
import AppUsersManagerModule from './AppUsersManager';
import AppMessagesManagerModule from './AppMessagesManager';
import { telegramApi } from '../../TelegramApi';
import AppChatsManager from './AppChatsManager';
import AppMessagesManager from './AppMessagesManager';
import AppProfileManager from './AppProfileManager';

class AppUpdatesManagerModule {
	subscribed = {
		status: [],
		messages: [],
		misc: [],
		dialogs: [],
		peers: [],
	};

	MtpNetworkerFactory = MtpNetworkerFactoryModule;

	constructor() {
		this.AppUsersManager = AppUsersManagerModule;
		const updatesHandler = data => {
			if (data._ === 'updateShort' || data._ === 'updates') {
				this._parseUpdate(data);
			} else if (
				data._ === 'updateShortMessage' ||
				data._ === 'updateShortChatMessage'
			) {
				this._parseUpdate(this._transformToShort(data));
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

	subscribe = (type, handler) => {
		if (!type || !this.subscribed[type] || typeof handler !== 'function') {
			return;
		}

		this.subscribed[type].push(handler);
	};

	_parseUpdate = data => {
		//console.log('Got update!', data);
		const switchUpdate = update => {
			switch (update._) {
				case 'updateNewMessage':
				case 'updateNewChannelMessage':
				case 'updateNewEncryptedMessage':
				case 'updateNewScheduledMessage':
					this._handleNewMessage(update, data);
					break;
				case 'updateUserStatus':
					this._handleUserStatus(update);
					break;
				case 'updateChatUserTyping':
				case 'updateUserTyping':
					console.log(update);
					//this._handleUserTyping(update);
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
		const user = this.AppUsersManager.getUser(update.user_id);

		if (!user) {
			return;
		}

		user.status = update.status;

		const dialog = AppChatsManager.getDialog(user.id);

		if (!dialog) {
			return;
		}

		dialog.online = this.AppUsersManager.isOnline(user.id);

		AppChatsManager.isDialogInWindow(dialog.id) &&
			this._dispatchForDialogs({
				id: dialog.id,
				delta: {
					online: dialog.online,
				},
			});

		this._dispatchForPeers({
			id: user.id,
			delta: {
				status: user.status,
				formattedStatus: user.formattedStatus,
			},
		});
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

	_transformToShort = update => {
		if (update._ === 'updateShortMessage') {
			return this._handleNewUserMessage(update);
		}
	};

	_handleNewUserMessage = message => {
		const new_message = {
			_: 'message',
			flags: message.flags,
			id: message.id,
			from_id: message.pFlags.out
				? AppProfileManager.getProfileId()
				: message.user_id,
			to_id: message.pFlags.out
				? { _: 'peerUser', user_id: message.user_id }
				: AppProfileManager.getProfileId(),
			fwd_from: message.fwd_from,
			via_bot_id: message.via_bot_id,
			reply_to_msg_id: message.reply_to_msg_id,
			date: message.date,
			message: message.message,
			entities: message.entities,
		};

		return {
			_: 'updateShort',
			update: {
				_: 'updateNewMessage',
				message: new_message,
			},
		};
	};

	_handleNewMessage = async update => {
		AppMessagesManager.saveMessage(update.message);

		const peerId = AppMessagesManager._getMessagePeerId(update.message);
		const dialog = AppChatsManager.getDialog(peerId);

		if (dialog) {
			AppChatsManager.saveDialogs([
				{ ...dialog, top_message: update.message.id },
			]);

			AppChatsManager.isDialogInWindow(dialog.id) &&
				this._dispatchForDialogs({
					id: -1,
					delta: AppChatsManager.getCurrentDialogs(),
				});
		} else {
			const dialogs = await telegramApi.fetchDialogs(1);

			AppChatsManager.isDialogInWindow(peerId) &&
				this._dispatchForDialogs({
					id: -1,
					delta: dialogs,
				});
		}
	};

	_dispatchEvent = (handler, payload) => {
		handler(payload);
	};

	_dispatchForDialogs = payload => {
		this.subscribed.dialogs.forEach(el => this._dispatchEvent(el, payload));
	};

	_dispatchForPeers = payload => {
		this.subscribed.peers.forEach(el => this._dispatchEvent(el, payload));
	};

	_dispatchForMessages = payload => {
		this.subscribed.messages.forEach(el =>
			this._dispatchEvent(el, payload)
		);
	};
}

export default new AppUpdatesManagerModule();
