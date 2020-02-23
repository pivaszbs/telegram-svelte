import AppsChatsManagerModule from './AppChatsManager';
import AppUsersManagerModule from './AppUsersManager';
import { dT } from '../lib/utils';
import MtpApiManagerModule from '../Mtp/MtpApiManager';

export default class AppProfileManagerModule {
	chatsFull = {};
	chatFullPromises = {};

	AppChatsManager = new AppsChatsManagerModule();
	AppUsersManager = new AppUsersManagerModule();

	MtpApiManager = new MtpApiManagerModule();

	getChatFull = id => {
		if (this.AppChatsManager.isChannel(id)) {
			return this.getChannelFull(id);
		}
		if (this.chatsFull[id] !== undefined) {
			const chat = this.AppChatsManager.getChat(id);
			if (chat.version == this.chatsFull[id].participants.version || chat.pFlags.left) {
				return Promise.resolve(this.chatsFull[id]);
			}
		}
		if (this.chatFullPromises[id] !== undefined) {
			return this.chatFullPromises[id];
		}
		console.trace(dT(), 'Get chat full', id, this.AppChatsManager.getChat(id));
		return (this.chatFullPromises[id] = this.MtpApiManager.invokeApi('messages.getFullChat', {
			chat_id: this.AppChatsManager.getChatInput(id),
		}).then(result => {
			this.AppChatsManager.saveApiChats(result.chats);
			this.AppUsersManager.saveApiUsers(result.users);
			const fullChat = result.full_chat;
			delete this.chatFullPromises[id];
			this.chatsFull[id] = fullChat;

			return fullChat;
		}));
	};

	getChatInviteLink = (id, force) =>
		this.getChatFull(id).then(chatFull => {
			if (!force && chatFull.exported_invite && chatFull.exported_invite._ == 'chatInviteExported') {
				return chatFull.exported_invite.link;
			}
			let promise;
			if (this.AppChatsManager.isChannel(id)) {
				promise = this.MtpApiManager.invokeApi('channels.exportInvite', {
					channel: this.AppChatsManager.getChannelInput(id),
				});
			} else {
				promise = this.MtpApiManager.invokeApi('messages.exportChatInvite', {
					chat_id: this.AppChatsManager.getChatInput(id),
				});
			}
			return promise.then(exportedInvite => {
				if (this.chatsFull[id] !== undefined) {
					this.chatsFull[id].exported_invite = exportedInvite;
				}
				return exportedInvite.link;
			});
		});

	getChannelParticipants = id =>
		this.MtpApiManager.invokeApi('channels.getParticipants', {
			channel: this.AppChatsManager.getChannelInput(id),
			filter: { _: 'channelParticipantsRecent' },
			offset: 0,
			limit: 200,
		}).then(result => {
			this.AppUsersManager.saveApiUsers(result.users);
			const participants = result.participants;

			const chat = this.AppChatsManager.getChat(id);
			if (!chat.pFlags.kicked && !chat.pFlags.left) {
				const myID = this.AppUsersManager.getSelf().id;
				let myIndex = false;
				let myParticipant;
				for (let i = 0, len = participants.length; i < len; i++) {
					if (participants[i].user_id == myID) {
						myIndex = i;
						break;
					}
				}
				if (myIndex !== false) {
					myParticipant = participants[i];
					participants.splice(i, 1);
				} else {
					myParticipant = { _: 'channelParticipantSelf', user_id: myID };
				}
				participants.unshift(myParticipant);
			}

			return participants;
		});

	getChannelFull = (id, force) => {
		if (this.chatsFull[id] !== undefined && !force) {
			return Promise.resolve(this.chatsFull[id]);
		}
		if (this.chatFullPromises[id] !== undefined) {
			return this.chatFullPromises[id];
		}

		return (this.chatFullPromises[id] = this.MtpApiManager.invokeApi('channels.getFullChannel', {
			channel: this.AppChatsManager.getChannelInput(id),
		}).then(
			result => {
				this.AppChatsManager.saveApiChats(result.chats);
				this.AppUsersManager.saveApiUsers(result.users);
				const fullChannel = result.full_chat;
				const chat = this.AppChatsManager.getChat(id);
				let participantsPromise;
				if (fullChannel.flags & 8) {
					participantsPromise = this.getChannelParticipants(id).then(
						participants => {
							delete this.chatFullPromises[id];
							fullChannel.participants = {
								_: 'channelParticipants',
								participants: participants,
							};
						},
						error => {
							error.handled = true;
						}
					);
				} else {
					participantsPromise = Promise.resolve([]);
				}
				return participantsPromise.then(() => {
					delete this.chatFullPromises[id];
					this.chatsFull[id] = fullChannel;

					return fullChannel;
				});
			},
			error => {
				return Promise.reject(error);
			}
		));
	};
}
