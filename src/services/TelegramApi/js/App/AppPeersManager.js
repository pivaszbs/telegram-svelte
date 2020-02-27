import AppsChatsManagerModule from './AppChatsManager';
import AppUsersManagerModule from './AppUsersManager';
import { isObject } from '../Etc/Helper';

export default class AppPeersManagerModule {
	AppChatsManager = new AppsChatsManagerModule();
	AppUsersManager = new AppUsersManagerModule();

	getInputPeerByID = peerID => {
		if (!peerID) {
			return { _: 'inputPeerEmpty' };
		}
		if (peerID < 0) {
			const chatID = -peerID;
			if (!this.AppChatsManager.isChannel(chatID)) {
				return {
					_: 'inputPeerChat',
					chat_id: chatID,
				};
			} else {
				return {
					_: 'inputPeerChannel',
					channel_id: chatID,
					access_hash: this.AppChatsManager.getChat(chatID).access_hash || 0,
				};
			}
		}
		return {
			_: 'inputPeerUser',
			user_id: peerID,
			access_hash: this.AppUsersManager.getUser(peerID).access_hash || 0,
		};
	};

	getPeerID = peerString => {
		if (isObject(peerString)) {
			return peerString.user_id ? peerString.user_id : -(peerString.channel_id || peerString.chat_id);
		}
		const isUser = peerString.charAt(0) == 'u',
			peerParams = peerString.substr(1).split('_');

		return isUser ? peerParams[0] : -peerParams[0] || 0;
	};

	getPeer = peerID => {
		const user_peer = this.AppUsersManager.getUser(peerID);

		if (user_peer && (!user_peer.id || !user_peer.deleted)) {
			return user_peer;
		}

		return this.AppChatsManager.getChat(peerID);
	};

	isChannel = peerID => peerID < 0 && this.AppChatsManager.isChannel(-peerID);
}
