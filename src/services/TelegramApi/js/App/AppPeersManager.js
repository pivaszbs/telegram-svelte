import AppsChatsManagerModule from './AppChatsManager';
import AppUsersManagerModule from './AppUsersManager';
import { isObject } from '../Etc/Helper';

class AppPeersManagerModule {
	AppChatsManager = AppsChatsManagerModule;
	AppUsersManager = AppUsersManagerModule;

	getPeerId = peer => {
		if (peer.id) {
			return peer.id;
		}
		return peer.user_id || peer.channel_id || peer.chat_id;
	};

	getInputPeerByID = peerID => {
		const peer = this.getPeer(peerID);

		if (peer) {
			if (peer._ === 'chat') {
				return {
					_: 'inputPeerChat',
					chat_id: peer.id,
				};
			}
			if (peer._ === 'channel') {
				return {
					_: 'inputPeerChannel',
					access_hash: peer.access_hash,
				};
			}
			if (peer._ === 'user') {
				return {
					_: 'inputPeerUser',
					access_hash: peer.access_hash,
				};
			}
		}
		return {
			_: 'inputPeerEmpty',
		};
	};

	getPeer = peerID => {
		const user_peer = this.AppUsersManager.getUser(peerID);

		if (user_peer && (!user_peer.id || !user_peer.deleted)) {
			return user_peer;
		}

		return this.AppChatsManager.getChat(peerID);
	};
}

export default new AppPeersManagerModule();
