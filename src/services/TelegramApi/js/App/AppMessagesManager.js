import { forEach, isObject } from '../Etc/Helper';

export default class AppMessagesManagerModule {
	messages = {};
	chatPeer = 0;

	constructor(peerId) {
		this.chatPeer = peerId;

		window.cachedMessages = window.cachedMessages || {};
		window.cachedMessages[peerId] = window.cachedMessages[peerId] || {};

		this.messages = window.cachedMessages[peerId].messages || {};
	}

	saveMessages = (messages = []) => {
		forEach(messages, this.saveMessage);
	};

	saveMessage = message => {
		if (!isObject(message)) {
			return;
		}

		if (!this.messages[message.id]) {
			this.messages[message.id] = message;
		} else {
			this.messages[message.id] = message;
		}

		cachedMessages[this.chatPeer].messages = this.messages;
	};

	getMessages = (offsetId, addOffset, limit) => {
		const keys = Object.keys(this.messages).sort((el1, el2) => Number(el1) - Number(el2));
		const focusPoint = keys.findIndex(el => el === offsetId);
		// console.log('GONNA USE', focusPoint, addOffset, limit);
		// console.log('KEYS', keys);
		if (focusPoint) {
			const idsArray = keys.slice(
				Math.max(0, focusPoint - addOffset),
				Math.max(0, Math.min(focusPoint - addOffset + limit, keys.length))
			);
			const messages = [];
			idsArray.forEach(idx => {
				messages.push(this.messages[idx]);
			});
			return messages;
		} else {
			return [];
		}
	};

	getMessage = id => {
		return this.messages[id] || { deleted: true };
	};
}
