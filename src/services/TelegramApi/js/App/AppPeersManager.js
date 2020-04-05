import AppsChatsManagerModule from './AppChatsManager';
import AppUsersManagerModule from './AppUsersManager';

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
					channel_id: peer.id,
					access_hash: peer.access_hash,
				};
			}
			if (peer._ === 'user') {
				return {
					_: 'inputPeerUser',
					user_id: peer.id,
					access_hash: peer.access_hash,
				};
			}
		}
		return {
			_: 'inputPeerEmpty',
		};
	};

	getInputByID = peerID => {
		const peer = this.getPeer(peerID);

		if (peer) {
			if (peer._ === 'chat') {
				return {
					_: 'inputChat',
					chat_id: peer.id.toString(),
				};
			}
			if (peer._ === 'channel') {
				return {
					_: 'inputChannel',
					channel_id: peer.id.toString(),
					access_hash: peer.access_hash,
				};
			}
			if (peer._ === 'user') {
				return {
					_: 'inputUser',
					user_id: peer.id.toString(),
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
