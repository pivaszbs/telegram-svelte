import telegramApi from '../services/TelegramApi/index';

export const cc = (cls, condition = true) => ({ class: cls, condition });
export const tc = (cls1, cls2, conditional) => cc(conditional ? cls1 : cls2);

export const reverse = str =>
	str
		.split('')
		.reverse()
		.join('');

export const clsx = (...clss) =>
	clss
		.filter(Boolean)
		.map(item => {
			if (typeof item === 'object') {
				return item.condition ? item.class : '';
			}

			return item;
		})
		.join(' ');

export const subscribe = element => {
	const el =
		typeof element === 'string' ? document.querySelector(element) : element;
	return function(...args) {
		el.addEventListener(...args);
	};
};

export const htmlToElement = html => {
	const template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	return template.content.firstChild;
};

export const setInnerHTML = function(selector) {
	return value => {
		this.querySelector(selector).innerHTML = value;
	};
};

const toggle = cls => force => elem => {
	elem.classList.toggle(cls, force);
};

const toggleHide = toggle('hide');
const toggleActive = force => elem => {
	if (force) {
		elem.setAttribute('active', 'true');
	} else {
		elem.removeAttribute('active');
	}
};

export const hide = toggleHide(true);
export const show = toggleHide(false);
export const setAttribute = function(selector) {
	return attribute => value => {
		this.querySelector(selector).setAttribute(attribute, value);
	};
};

export const setActive = toggleActive(true);
export const setNotActive = toggleActive(false);

export const startLoading = elem => {
	elem.innerHTML = '';
	elem.classList.add('loading');
};

export const startLoadingProgress = (
	elem,
	spin = true,
	size = 120,
	clear = true,
	color
) => {
	if (clear) {
		elem.innerHTML = '';
	}
	elem.classList.add('loading_progress');
	if (spin) {
		elem.classList.add('loading_progress_spin');
	}

	const radiusRatio = 56 / 120;

	let circle;

	if (!elem.querySelector('.progress-ring')) {
		const svg = htmlToElement(`<svg
		class="progress-ring"
		width="${size}"
		height="${size}">
	   <circle
		 class="progress-ring__circle"
		 stroke="${color || spin ? 'black' : 'white'}"
		 stroke-opacity="0.4"
		 stroke-width="4"
		 fill="transparent"
		 r="${size * radiusRatio}"
		 cx="${size / 2}"
		 cy="${size / 2}"/>
	 </svg>`);

		elem.appendChild(svg);
	}

	circle = elem.querySelector('.progress-ring__circle');
	const rad = circle.r.baseVal.value;
	const circ = rad * 2 * Math.PI;

	circle.style.strokeDasharray = `${circ} ${circ}`;
	circle.style.strokeDashoffset = circ;
};

export const setLoadingProgress = (elem, progress = 0) => {
	const circle = elem.querySelector('.progress-ring__circle');
	if (!circle) {
		return;
	}

	const rad = circle.r.baseVal.value;
	const circ = rad * 2 * Math.PI;
	const offset = circ - (progress / 100) * circ;
	circle.style.strokeDashoffset = offset;
};

export const stopLoadingProgress = elem => {
	elem.innerHTML = '';
	elem.classList.remove('loading_progress');
	if (elem.classList.contains('loading_progress_spin')) {
		elem.classList.remove('loading_progress_spin');
	}
};

export const stopLoading = elem => {
	elem.classList.remove('loading');
};

export const createElement = type => className => {
	const elem = document.createElement(type);
	elem.className = className;
	return elem;
};

export const createDiv = createElement('div');
export const createSpan = createElement('span');

export const createImg = (src, className) => {
	const elem = createElement('img')(className);
	elem.src = src;
	return elem;
};

export const createInput = (type, className, placeholder) => {
	const elem = createElement('input')(className);
	elem.type = type;
	elem.placeholder = placeholder;
	return elem;
};

export const getName = (first, second) => {
	if (!second) {
		return first;
	}
	return `${first} ${second}`;
};

export const getNotificationsModeBoolByPeer = peer => {
	return (peer.notify_settings &&
		(peer.notify_settings.flags == 0 ||
			peer.notify_settings.mute_until == 0)) ||
		(peer.full_chat &&
			(peer.full_chat.notify_settings.flags == 0 ||
				peer.full_chat.notify_settings.mute_until == 0))
		? true
		: false;
};

export const getRightSidebarFieldsFromPeer = peer => {
	const generalizedPeer = {};
	if (peer._ === 'userFull') {
		generalizedPeer.type = 'user';
		generalizedPeer.name = getName(
			peer.user.first_name,
			peer.user.last_name
		);
		generalizedPeer.bio = peer.about || '';
		generalizedPeer.username = peer.user.username;
		generalizedPeer.phone = peer.user.phone || '';
	} else if (peer._ === 'messages.chatFull') {
		if (peer.chats[0]._ === 'chat') {
			generalizedPeer.type = 'groupChat';
		} else if (telegramApi._checkFlag(peer.chats[0].flags, 8)) {
			generalizedPeer.type = 'groupChat';
		} else {
			generalizedPeer.type = 'channel';
		}
		generalizedPeer.name = peer.chats[0].title;
		generalizedPeer.about = peer.full_chat.about;
		generalizedPeer.link =
			(peer.full_chat.username && 't.me/' + peer.full_chat.username) ||
			'';
	} else {
		generalizedPeer.type = 'groupChat';
		generalizedPeer.name = peer.chats[0].title;
		generalizedPeer.about = peer.full_chat.about;
		generalizedPeer.link =
			(peer.full_chat.username && 't.me/' + peer.full_chat.username) ||
			'';
	}
	generalizedPeer.notifications = getNotificationsModeBoolByPeer(peer);
	generalizedPeer.avatar = peer.avatar;
	generalizedPeer.id = peer.id;

	if (peer.user && peer.user.pFlags.self) {
		generalizedPeer.about = null;
		generalizedPeer.link = null;
		generalizedPeer.bio = null;
		generalizedPeer.username = null;
		generalizedPeer.phone = null;
		generalizedPeer.notifications = null;
		generalizedPeer.self = true;
		generalizedPeer.avatar = saved;
	}

	return generalizedPeer;
};

export const onScrollTop = (element, callback) => {
	let lastScroll = 0;
	element.addEventListener('scroll', () => {
		const lt = window.pageYOffset || element.scrollTop;
		if (element.scrollTop < 500 && lastScroll > lt) {
			callback();
		}
		lastScroll = lt;
	});
};

export const onScrollBottom = (element, callback) => {
	let lastScroll = 0;
	element.addEventListener('scroll', () => {
		const lt = window.pageYOffset || element.scrollTop;
		if (
			element.scrollTop + element.clientHeight >=
				element.scrollHeight - 500 &&
			lastScroll < lt
		) {
			callback();
		}
		lastScroll = lt;
	});
};

export const sanitize = value => {
	const lt = /</g,
		gt = />/g,
		ap = /'/g,
		ic = /"/g;

	return value
		.toString()
		.replace(lt, '&lt;')
		.replace(gt, '&gt;')
		.replace(ap, '&#39;')
		.replace(ic, '&#34;');
};

export const capitalise = string =>
	string.charAt(0).toUpperCase() + string.slice(1);
export const peerToId = peer => {
	return peer.user_id || peer.channel_id || peer.chat_id;
};

export const apiGetter = key => {
	switch (key) {
		case 'media':
			return telegramApi.getPeerPhotos;
		case 'members':
			return telegramApi.getChatParticipants;
		default:
			console.log('No appropriate key is found');
	}
};
