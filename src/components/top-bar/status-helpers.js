import telegramApi from "../../services/TelegramApi";

const unitCheck = unit => {
    if (unit > 1) {
        return 's';
    }

    return '';
};

const transformNumber = number => {
    const str = reverse(String(number));
    let res = '';
    for (let i = 0; i < str.length; i++) {
        res += str[i];
        if ((i + 1) % 3 === 0 && i !== str.length - 1) {
            res += ',';
        }
    }
    return reverse(res);
};

export const loadStatus = id => {
    let onlineStatus;
    return telegramApi
        .getPeerByID(id)
        .then(({ status, _: type, pFlags: { megagroup } }) => {
            if ((!status && megagroup) || type === 'chat') {
                return telegramApi.getChatParticipants(id);
            } else if (type === 'channel') {
                return telegramApi.getFullPeer(id);
            }
            onlineStatus = statusTransform(status);
        })
        .then(data => {
            if (!data) {
                return;
            }
            if (data.onlineUsers) {
                let {
                    onlineUsers: { length: online },
                    offlineUsers: { length: all },
                } = data;
                all = all + online;
                all = `${transformNumber(all)} ${all > 1 ? 'members' : 'member'}`;
                online = online && `${transformNumber(online)} online`;
                return online ? `${all}, ${online}` : all;
            } else {
                const count = data.full_chat.participants_count;
                const sub = 'subsriber' + unitCheck(count);
                return `${transformNumber(count)} ${sub}`;
            }
        })
};

const statusTransform = ({ was_online: lastSeen, _: type }) => {
    switch (type) {
        case 'userStatusRecently':
            return `last seen recently`;

        case 'userStatusOffline':
            return lastSeenTransform(lastSeen);

        case 'userStatusOnline':
            return 'online';
    }
};

const lastSeenTransform = lastSeen => {
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
    time = unit + ' ' + time + unitCheck(unit);
    return `last seen ${time} ago`;
};