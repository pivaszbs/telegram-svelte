import telegramApi from './TelegramApi';
import { dialogs, archives } from '../stores/dialogs';

export const loadFirstDialogs = () => {
	telegramApi.getDialogsParsed(10).then(({ dialog_items, archived_items }) => {
		console.log('dialog_items', dialog_items);
		dialogs.set(dialog_items);
		archives.set(archived_items);
	});
};

export const loadPeerDialog = peer => {
	const id = peer.channel_id || peer.chat_id || peer.user_id;
	telegramApi.getFullPeer(id).then(data => console.log('peer', data));
	telegramApi.getMessagesFromPeer(peer).then(data => console.log('messages', data));
};
