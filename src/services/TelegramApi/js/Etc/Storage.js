import { forEach, toArray } from './Helper';
import { dT } from '../lib/utils';
import { Config } from '../lib/config';

export default function StorageModule() {
	const methods = {};

	let keyPrefix = '';
	let noPrefix = false;
	const cache = {};
	let useCs = !!(window.chrome && chrome.storage && chrome.storage.local);
	let useLs = !useCs && !!window.localStorage;

	const storageSetPrefix = newPrefix => {
		keyPrefix = newPrefix;
	};

	const storageSetNoPrefix = () => {
		noPrefix = true;
	};

	const storageGetPrefix = () => {
		if (noPrefix) {
			noPrefix = false;
			return '';
		}
		return keyPrefix;
	};

	const get = (...args) =>
		new Promise(resolve => {
			var keys = Array.prototype.slice.call(args),
				result = [],
				single = keys.length == 1,
				value,
				allFound = true,
				prefix = storageGetPrefix(),
				i,
				key;

			for (i = 0; i < keys.length; i++) {
				key = keys[i] = prefix + keys[i];
				if (key.substr(0, 3) != 'xt_' && cache[key] !== undefined) {
					result.push(cache[key]);
				} else if (useLs) {
					try {
						value = localStorage.getItem(key);
					} catch (e) {
						useLs = false;
					}
					try {
						value = value === undefined || value === null ? false : JSON.parse(value);
					} catch (e) {
						value = false;
					}
					result.push((cache[key] = value));
				} else if (!useCs) {
					result.push((cache[key] = false));
				} else {
					allFound = false;
				}
			}

			if (allFound) {
				resolve(single ? result[0] : result);
			}

			chrome.storage.local.get(keys, function(resultObj) {
				var value;
				result = [];
				for (i = 0; i < keys.length; i++) {
					key = keys[i];
					value = resultObj[key];
					value = value === undefined || value === null ? false : JSON.parse(value);
					result.push((cache[key] = value));
				}

				resolve(single ? result[0] : result);
			});
		});
	const set = (obj, callback) =>
		new Promise(resolve => {
			if (obj.user_auth && Config.Modes.debug) {
				console.log(dT(), '[DEBUG] Setting ', obj);
			}
			var keyValues = {},
				prefix = storageGetPrefix(),
				key,
				value;

			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					value = obj[key];
					key = prefix + key;
					cache[key] = value;
					value = JSON.stringify(value);
					if (useLs) {
						try {
							localStorage.setItem(key, value);
						} catch (e) {
							useLs = false;
						}
					} else {
						keyValues[key] = value;
					}
				}
			}

			if (useLs || !useCs) {
				if (callback) {
					callback();
				}
				resolve();
			}

			chrome.storage.local.set(keyValues, callback);
			resolve();
		});
	const remove = (...args) =>
		new Promise(resolve => {
			var keys = Array.prototype.slice.call(args),
				prefix = storageGetPrefix(),
				i,
				key,
				callback;

			if (typeof keys[keys.length - 1] === 'function') {
				callback = keys.pop();
			}

			for (i = 0; i < keys.length; i++) {
				key = keys[i] = prefix + keys[i];
				delete cache[key];
				if (useLs) {
					try {
						localStorage.removeItem(key);
					} catch (e) {
						useLs = false;
					}
				}
			}
			if (useCs) {
				chrome.storage.local.remove(keys, callback);
			} else if (callback) {
				callback();
			}
			resolve();
		});

	window.ConfigStorage = {
		prefix: storageSetPrefix,
		noPrefix: storageSetNoPrefix,
		get,
		set,
		remove,
	};

	return {
		methods: {
			get,
			set,
			remove,
		},
		get,
		set,
		remove,
	};
}
