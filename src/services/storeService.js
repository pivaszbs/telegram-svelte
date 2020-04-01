// import telegramApi from './TelegramApi';
import { dialogs } from '../stores/dialogs';
import telegramApi from './TelegramApi/index';

export const loadFirstDialogs = () => {
	telegramApi.fetchDialogs(10).then(dialog_items => {
		console.log('dialog_items', dialog_items);
		dialogs.set(dialog_items);
	});
};
