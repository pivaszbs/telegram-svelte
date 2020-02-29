import telegramApi from './TelegramApi';
import { dialogs, archives } from '../stores/dialogs';

export const loadFirstDialogs = () => {
	telegramApi.getDialogsParsed(10).then(({ dialog_items, archived_items}) => {
        console.log('dialog_items', dialog_items)
        dialogs.set(dialog_items);
        archives.set(archived_items);
    });
}