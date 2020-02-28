import { writable } from "svelte/store";
import { telegramApi } from "../services/TelegramApi/TelegramApi";

// const apidialogs = telegramApi.getDialogsParsed(10);

export const dialogs = writable([]);