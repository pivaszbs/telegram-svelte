/*!
 * Webogram v0.5.3 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

var _logTimer = new Date().getTime();

export function dT() {
	return '[' + ((new Date().getTime() - _logTimer) / 1000).toFixed(3) + ']';
}

export function tsNow(seconds) {
	var t = +new Date() + (window.tsOffset || 0);
	return seconds ? Math.floor(t / 1000) : t;
}

export function safeReplaceObject(wasObject, newObject) {
	for (var key in wasObject) {
		if (!newObject.hasOwnProperty(key) && key.charAt(0) != '$') {
			delete wasObject[key];
		}
	}
	for (var key in newObject) {
		if (newObject.hasOwnProperty(key)) {
			wasObject[key] = newObject[key];
		}
	}
}

export function tlFlags(flags, val) {
	if (val) {
		return (flags & (2 ** val)) === 2 ** val;
	}
	return val => (flags & (2 ** val)) === 2 ** val;
}

export function convertDate(date) {
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	let time = new Date(date * 1000);
	const currentTime = new Date();

	const startOfTheWeek = date => {
		const now = date ? new Date(date) : new Date();
		now.setHours(0, 0, 0, 0);
		const monday = new Date(now);
		monday.setDate(1);
		return monday;
	};

	const formatTime = t => (t < 10 ? '0' + t : t);

	if (time.getDay() - currentTime.getDay() === 0) {
		time = `${formatTime(time.getHours())}:${formatTime(time.getMinutes())}`;
	} else if (time.getDay() > startOfTheWeek(time)) {
		time = days[time.getDay()];
	} else {
		time = time.toLocaleDateString().replace(/[/]/g, '.');
		time = time.slice(0, 6) + time.slice(8);
	}

	return time;
}
