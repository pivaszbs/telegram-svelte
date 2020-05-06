import { forEach, isObject } from '../Etc/Helper';
import { safeReplaceObject, tlFlags, convertDate } from '../lib/utils';
import AppPeersManager from './AppPeersManager';
import AppMessagesManager from './AppMessagesManager';
import AppProfileManager from './AppProfileManager';
import AppUsersManager from './AppUsersManager';
import MtpApiFileManager from '../Mtp/MtpApiFileManager';
import { telegramApi } from '../../TelegramApi';

class AppsChatsManagerModule {
	dialogsOrder = [];
	current_pos = 0;
	window_size = 30;

	constructor() {
		this.chatsManagerStorage = {};
		this.fullChats = {};
		this.dialogsDataBase = {};
	}

	saveApiChats = apiChats => {
		forEach(apiChats, this.saveApiChat);
	};

	saveApiChat = apiChat => {
		if (!isObject(apiChat)) {
			return;
		}

		if (apiChat.pFlags === undefined) {
			apiChat.pFlags = {};
		}

		if (apiChat.participants_count) {
			console.log(apiChat.participants_count);
			apiChat.formattedStatus =
				apiChat.participants_count +
				(this.isSupergroup(apiChat) || this.isGroup(apiChat)
					? ' participants'
					: ' subscribers');
			console.log(apiChat.formattedStatus);
		}

		if (this.chatsManagerStorage[apiChat.id] === undefined) {
			this.chatsManagerStorage[apiChat.id] = apiChat;
		} else {
			safeReplaceObject(this.chatsManagerStorage[apiChat.id], apiChat);
		}
	};

	saveFullChat = apiChatFull => {
		if (!isObject(apiChatFull)) {
			return;
		}

		const { full_chat: apiChat } = apiChatFull;

		if (apiChat.pFlags === undefined) {
			apiChat.pFlags = {};
		}

		if (this.fullChats[apiChat.id] === undefined) {
			this.fullChats[apiChat.id] = apiChatFull;
		} else {
			safeReplaceObject(this.fullChats[apiChat.id], apiChatFull);
		}
	};

	saveDialogs = (apiDialogs = []) => {
		apiDialogs.forEach(this.saveDialog);

		const pinned = [];
		const dialogs = [];

		Object.values(this.dialogsDataBase)
			.sort(this._sortByDate)
			.forEach(dialog => {
				if (dialog.pinned) {
					pinned.push(dialog.id);
				} else {
					dialogs.push(dialog.id);
				}
			});

		this.dialogsOrder = [...pinned, ...dialogs];
	};

	saveDialog = dialog => {
		dialog = { ...dialog };
		if (!isObject(dialog)) {
			return;
		}

		dialog.id = AppPeersManager.getPeerId(dialog.peer);
		const dialogPeer = AppPeersManager.getPeer(dialog.id);

		if (dialog.pFlags === undefined) {
			dialog.pFlags = {};
		}

		let photo = dialogPeer.photo;

		if (
			photo &&
			photo._ !== 'userProfilePhotoEmpty' &&
			photo._ !== 'chatPhotoEmpty'
		) {
			photo = {
				...photo,
				src: MtpApiFileManager.getPeerPhoto(dialog.id),
			};
		}

		dialog.photo = photo;
		dialog.unreadCount = dialog.unread_count;
		dialog.title = (() => {
			if (dialogPeer._ !== 'user') {
				return dialogPeer.title;
			}
			return (
				dialogPeer.first_name +
				' ' +
				(dialogPeer.last_name || '')
			).trim();
		})();
		const topMessage = AppMessagesManager.getMessage(
			dialog.id,
			dialog.top_message
		);

		dialog.text = topMessage.formattedText;
		dialog.date = topMessage.date;
		dialog.time = convertDate(topMessage.date);
		dialog.pinned = tlFlags(dialog.flags, 2);
		if (
			dialogPeer._ !== 'user' &&
			!this.isChannel(dialog.id) &&
			topMessage._ !== 'messageService'
		) {
			dialog.fromName =
				topMessage.from_id &&
				AppPeersManager.getPeer(topMessage.from_id).first_name;
		}
		dialog.out = topMessage.out;
		dialog.saved = AppProfileManager.isSelf(dialog.id);
		if (dialogPeer._ === 'user') {
			dialog.online = AppUsersManager.isOnline(dialog.id);
		}
		dialog.muted = this.isMuted(dialog.id);

		if (dialog.read_outbox_max_id >= topMessage.id) {
			dialog.read = true;
		}

		if (this.dialogsDataBase[dialog.id] === undefined) {
			this.dialogsDataBase[dialog.id] = dialog;
		} else {
			safeReplaceObject(this.dialogsDataBase[dialog.id], dialog);
		}
	};

	getChat = id => this.chatsManagerStorage[id] || null;
	getFullChat = id => this.fullChats[id] || null;
	getDialog = id => this.dialogsDataBase[id] || null;

	getCurrentDialogs = (window_size = this.window_size) => {
		const dialogs = [];

		if (window_size !== this.window_size) {
			this.window_size = Math.min(100, window_size);
		}

		if (this.current_pos + this.window_size >= this.dialogsOrder.length) {
			this.current_pos = this.dialogsOrder.length - 1 - this.window_size;
		}

		this.dialogsOrder
			.slice(this.current_pos, this.current_pos + this.window_size)
			.forEach(dialog_id => {
				dialogs.push(this.dialogsDataBase[dialog_id]);
			});

		return dialogs;
	};

	getNextDialogs = async () => {
		if (
			this.current_pos + 2 * this.window_size >=
			this.dialogsOrder.length
		) {
			const offset_date = this.getDialog(
				this.dialogsOrder[this.dialogsOrder.length - 1]
			).date;

			await telegramApi.fetchDialogs(0, this.window_size, offset_date);
		}

		this.current_pos += this.window_size / 2;
		return this.getCurrentDialogs();
	};

	getPreviousDialogs = () => {
		this.current_pos = Math.max(0, this.current_pos - this.window_size / 2);
		return this.getCurrentDialogs();
	};

	_sortByDate = (a, b) => b.date - a.date;

	isMuted = id => {
		const dialog = this.dialogsDataBase[id];
		const notifySettings = dialog?.notifySettings;

		return (
			dialog &&
			notifySettings &&
			(tlFlags(notifySettings.flags, 1) ||
				notifySettings.mute_until * 1000 > Date.now())
		);
	};

	isChannel = id => {
		const chat = isObject(id) ? id : this.chatsManagerStorage[id];

		return (
			chat &&
			(chat._ === 'channel' || chat._ === 'channelForbidden') &&
			!tlFlags(chat.flags, 8)
		);
	};

	isSupergroup = id => {
		const chat = isObject(id) ? id : this.chatsManagerStorage[id];

		return (
			chat &&
			(chat._ === 'channel' || chat._ === 'channelForbidden') &&
			tlFlags(chat.flags, 8)
		);
	};

	isGroup = id => {
		const chat = isObject(id) ? id : this.chatsManagerStorage[id];

		return chat && (chat._ === 'chat' || chat._ === 'chatForbidden');
	};

	getChatInput = id => id || 0;

	getChannelInput = id => {
		if (!id) {
			return { _: 'inputChannelEmpty' };
		}
		return {
			_: 'inputChannel',
			channel_id: id,
			access_hash:
				this.getChat(id).access_hash || this.channelAccess[id] || 0,
		};
	};
}

export default new AppsChatsManagerModule();
