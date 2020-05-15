// import telegramApi from './TelegramApi';
import { dialogs, load } from '../stores/dialogs';
import telegramApi from './TelegramApi/index';
import { topBar } from '../stores/topBar';
import { messages } from '../stores/messages';

export const loadFirstDialogs = async () => {
	await telegramApi.fetchDialogs(80).then(dialog_items => {
		dialogs.set(dialog_items);
	});

	const handler = update => {
		//console.log('Handler called, update: ', update);
		if (update.id === -1) {
			dialogs.set(update.delta);
		} else {
			dialogs.update((prev = []) => {
				const idx = prev.findIndex(el => el.id === update.id);

				if (!prev[idx]) {
					return prev;
				}

				//console.log('Dialog was', prev[idx]);

				prev[idx] = { ...prev[idx], ...update.delta };

				//console.log('Dialog now', prev[idx]);
				return prev;
			});
		}
	};

	telegramApi.AppUpdatesManager.subscribe('dialogs', handler);
};

export const loadDialog = async id => {
	const { formattedStatus } = await telegramApi.peerManager.getPeerById(id);
	const {
		online,
		title,
		photo,
	} = await telegramApi.AppChatsManager.getDialog(id);
	const msgs = await telegramApi.AppMessagesManager.getCurrentMessages(
		id,
		60
	);
	messages.set(Object.values(msgs));
	const status =
		typeof formattedStatus === 'function'
			? formattedStatus
			: () => formattedStatus;
	topBar.set({ online, status, title, photo });
};

export const loadBotom = async () => {
	load.set(true);
	const data = await telegramApi.AppChatsManager.getNextDialogs();
	dialogs.set(data);
	load.set(false);
};

export const loadTop = async (topMessage = false) => {
	load.set(true);

	const data = topMessage
		? telegramApi.AppChatsManager.getCurrentDialogs()
		: telegramApi.AppChatsManager.getPreviousDialogs();
	dialogs.set(data);
	load.set(false);
};
