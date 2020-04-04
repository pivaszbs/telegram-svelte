import StorageModule from '../Etc/Storage';
import MtpApiManagerModule from '../Mtp/MtpApiManager';
import { forEach, isObject } from '../Etc/Helper';
import { safeReplaceObject, tsNow } from '../lib/utils';
import AppProfileManager from './AppProfileManager';

class AppUsersManagerModule {
	static instance = null;

	constructor() {
		this.Storage = StorageModule();
		this.MtpApiManager = MtpApiManagerModule;

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
		if (apiUser.id === this.myID) {
			AppProfileManager.setUser(apiUser);
		}

		if (
			!isObject(apiUser) ||
			(noReplace &&
				isObject(this.users[apiUser.id]) &&
				this.users[apiUser.id].first_name)
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
			apiUser.formattedStatus = this.statusTransform(apiUser.status);
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
			(noReplace &&
				isObject(this.fullUsers[apiUser.id]) &&
				this.fullUsers[apiUser.id].first_name)
		) {
			return;
		}

		const userID = apiUser.id;

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

	unitCheck = unit => {
		if (unit > 1) {
			return 's';
		}

		return '';
	};

	statusTransform = ({ was_online: lastSeen, _: type }) => {
		switch (type) {
			case 'userStatusRecently':
				return `last seen recently`;

			case 'userStatusLastWeek':
				return 'last seen last week';

			case 'userStatusLastMonth':
				return 'last seen last month';

			case 'userStatusOffline':
				return this.lastSeenTransform(lastSeen);

			case 'userStatusOnline':
				return 'online';
		}
	};

	lastSeenTransform = lastSeen => {
		const unixShift = 1000;
		const now = new Date().getTime() / unixShift;
		const diff = Math.abs(now - lastSeen);
		const step = 60;
		let time;
		let unit;
		if (diff < step) {
			return `last seen just now`;
		} else if (diff < step ** 2) {
			unit = new Date(diff * unixShift).getMinutes();
			time = 'minute';
		} else if (diff < step ** 2 * 24) {
			unit = new Date(lastSeen * unixShift).getHours();
			time = 'hour';
		} else if (diff < step ** 2 * 24 * 7) {
			unit = new Date(lastSeen * unixShift).getDay();
			time = 'day';
		} else if (diff < step ** 2 * 24 * 7 * 4) {
			unit = new Date(lastSeen * unixShift).getHours();
			time = 'week';
		} else if (diff < step ** 2 * 24 * 7 * 4 * 12) {
			unit = new Date(lastSeen * unixShift).getHours();
			time = 'month';
		} else {
			time = `long time`;
		}
		time = unit + ' ' + time + this.unitCheck(unit);
		return `last seen ${time} ago`;
	};

	isOnline = id => {
		const user = this.getUser(id);
		if (!user) {
			return false;
		}

		return user.status && user.status._ === 'userStatusOnline';
	};

	getUser = id => {
		if (isObject(id)) {
			return id;
		}
		return this.users[id] || null;
	};

	getFullUser = id => {
		if (isObject(id)) {
			return id;
		}
		return this.fullUsers[id] || null;
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

export default new AppUsersManagerModule();
