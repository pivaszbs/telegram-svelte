import { writable, get } from 'svelte/store';
import { currentPeer } from './currentPeer';

const createMessages = () => {
	const messages = writable([]);
	const mapper = {};
	const set = newMessages => {
		newMessages.forEach((message, i) => {
			mapper[message.id] = i;
		});
		messages.set(newMessages);
	};

	const setMessage = (peerId, newMessage) => {
		if (peerId !== get(currentPeer).id) {
			return;
		}
		console.log('current peer', get(currentPeer));
		messages.update(old => {
			old = [...old];
			old[mapper[newMessage.id]] = newMessage;
			return old;
		});
	};

	return {
		...messages,
		set,
		setMessage,
	};
};
export const messages = createMessages();
