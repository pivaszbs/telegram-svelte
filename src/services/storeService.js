// import telegramApi from './TelegramApi';
import { dialogs } from '../stores/dialogs';
import telegramApi from './TelegramApi/index';
import { topBar } from '../stores/topBar';

export const loadFirstDialogs = () => {
	telegramApi.fetchDialogs(20).then(dialog_items => {
		dialogs.set(dialog_items);
	});
};

export const loadDialog = async id => {
	const { formattedStatus } = await telegramApi.peerManager.getPeerById(id);
	const {
		online,
		title,
		photo,
	} = await telegramApi.AppChatsManager.getDialog(id);
	topBar.set({ online, status: formattedStatus, title, photo });
};
