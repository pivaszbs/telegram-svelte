// import telegramApi from './TelegramApi';
import { dialogs, load } from '../stores/dialogs';
import telegramApi from './TelegramApi/index';
import { topBar } from '../stores/topBar';
import { get } from 'svelte/store';

let offset = 30;
export const loadFirstDialogs = async () => {
	await telegramApi.fetchDialogs(30).then(dialog_items => {
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

export const loadBotom = async () => {
	load.set(true);
	const data = await telegramApi.fetchDialogs(20, 10, get(dialogs)[20].date);
	dialogs.set(data);
	load.set(false);
};

export const loadTop = async (topMessage = false) => {
	load.set(true);

	const data = topMessage
		? await telegramApi.fetchDialogs(30)
		: await telegramApi.fetchDialogs(10, 20, get(dialogs)[10].date);
	dialogs.set(data);
	load.set(false);
};
