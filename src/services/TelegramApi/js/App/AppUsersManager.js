import StorageModule from '../Etc/Storage';
import MtpApiManagerModule from '../Mtp/MtpApiManager';
import { forEach, isObject } from '../Etc/Helper';
import { safeReplaceObject, tsNow } from '../lib/utils';

export default class AppUsersManagerModule {
	static instance = null;

	constructor() {
		if (AppUsersManagerModule.instance) {
			return AppUsersManagerModule.instance;
		}

		this.Storage = StorageModule();
		this.MtpApiManager = new MtpApiManagerModule();

		this.users = {};
		this.fullUsers = {};
		this.userAccess = {};
		this.serverTimeOffset = 0;

		this.Storage.get('server_time_offset').then(to => {
			if (to) {
				this.serverTimeOffset = to;
			}
		});

		this.MtpApiManager.getUserID().then(id => {
			this.myID = id;
		});
	}

	saveApiUsers = apiUsers => {
		forEach(apiUsers, this.saveApiUser);
	};

	saveApiUser = (apiUser, noReplace) => {
		if (
			!isObject(apiUser) ||
			(noReplace && isObject(this.users[apiUser.id]) && this.users[apiUser.id].first_name)
		) {
			return;
		}

		const userID = apiUser.id;

		apiUser.num = (Math.abs(userID) % 8) + 1;

		if (apiUser.pFlags === undefined) {
			apiUser.pFlags = {};
		}

		if (apiUser.status) {
			if (apiUser.status.expires) {
				apiUser.status.expires -= this.serverTimeOffset;
			}
			if (apiUser.status.was_online) {
				apiUser.status.was_online -= this.serverTimeOffset;
			}
		}
		if (apiUser.pFlags.bot) {
			apiUser.sortStatus = -1;
		} else {
			apiUser.sortStatus = this.getUserStatusForSort(apiUser.status);
		}

		let result = this.users[userID];

		if (result === undefined) {
			result = this.users[userID] = apiUser;
		} else {
			safeReplaceObject(result, apiUser);
		}
	};

	saveFullUser = (user, noReplace) => {
		const { user: apiUser } = user;
		if (
			!isObject(user) ||
			(noReplace && isObject(this.fullUsers[apiUser.id]) && this.fullUsers[apiUser.id].first_name)
		) {
			return;
		}

		const userID = apiUser.id;

		apiUser.num = (Math.abs(userID) % 8) + 1;

		if (apiUser.pFlags === undefined) {
			apiUser.pFlags = {};
		}

		if (apiUser.status) {
			if (apiUser.status.expires) {
				apiUser.status.expires -= this.serverTimeOffset;
			}
			if (apiUser.status.was_online) {
				apiUser.status.was_online -= this.serverTimeOffset;
			}
		}
		if (apiUser.pFlags.bot) {
			apiUser.sortStatus = -1;
		} else {
			apiUser.sortStatus = this.getUserStatusForSort(apiUser.status);
		}

		let result = this.fullUsers[userID];

		if (result === undefined) {
			result = this.fullUsers[userID] = user;
		} else {
			safeReplaceObject(result, user);
		}
	};

	getUserStatusForSort = status => {
		if (status) {
			const expires = status.expires || status.was_online;
			if (expires) {
				return expires;
			}
			const timeNow = tsNow(true);
			switch (status._) {
				case 'userStatusRecently':
					return timeNow - 86400 * 3;
				case 'userStatusLastWeek':
					return timeNow - 86400 * 7;
				case 'userStatusLastMonth':
					return timeNow - 86400 * 30;
			}
		}

		return 0;
	};

	getUser = id => {
		if (isObject(id)) {
			return id;
		}
		return this.users[id] || { id: id, deleted: true, num: 1, access_hash: this.userAccess[id] };
	};

	getFullUser = id => {
		if (isObject(id)) {
			return id;
		}
		return this.fullUsers[id] || { id: id, deleted: true, num: 1, access_hash: this.userAccess[id] };
	};

	getSelf = () => {
		return this.getUser(this.myID);
	};

	getUserInput = id => {
		const user = this.getUser(id);
		if (user.pFlags.self) {
			return { _: 'inputUserSelf' };
		}
		return {
			_: 'inputUser',
			user_id: id,
			access_hash: user.access_hash || 0,
		};
	};
}
