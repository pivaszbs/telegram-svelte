// This is the only module that knows the MTProto library. Loaded on first use.

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f06292, #c2185b)',
  'linear-gradient(135deg, #ffb74d, #f57c00)',
  'linear-gradient(135deg, #4db6ac, #00796b)',
  'linear-gradient(135deg, #42a5f5, #1e88e5)',
  'linear-gradient(135deg, #7e57c2, #4527a0)',
  'linear-gradient(135deg, #66bb6a, #2e7d32)',
  'linear-gradient(135deg, #d4e157, #9e9d24)',
  'linear-gradient(135deg, #a1887f, #4e342e)',
];

const DEFAULT_STICKER_PACKS = [
  {
    id: 'featured-top',
    title: 'Popular Stickers',
    count: 10,
    added: true,
    icon: '🐥',
    stickers: [
      { id: 'ft-1', emoji: '🐥❤️', label: 'Duck Love', bg: '#fff8e1' },
      { id: 'ft-2', emoji: '🦫🎉', label: 'Capybara Party', bg: '#fbe9e7' },
      { id: 'ft-3', emoji: '🐊😎', label: 'Cool Gator', bg: '#e8f5e9' },
      { id: 'ft-4', emoji: '🐕✨', label: 'Shiba Chill', bg: '#fff3e0' },
      { id: 'ft-5', emoji: '🦆🎀', label: 'Bow Duck', bg: '#fce4ec' },
      { id: 'ft-6', emoji: '🦀⌚', label: 'Crab Time', bg: '#ffebee' },
      { id: 'ft-7', emoji: '🦖💖', label: 'Dino Cute', bg: '#f3e5f5' },
      { id: 'ft-8', emoji: '👻🦆', label: 'Ghost Duck', bg: '#eceff1' },
      { id: 'ft-9', emoji: '🍒😚', label: 'Cherry Shy', bg: '#fce4ec' },
      { id: 'ft-10', emoji: '🎃🐱', label: 'Pumpkin Cat', bg: '#fff3e0' },
    ],
  },
  {
    id: 'hot-cherry',
    title: 'Hot Cherry',
    count: 32,
    added: true,
    icon: '🍒',
    stickers: [
      { id: 'hc-1', emoji: '🍒💋', label: 'Cherry Kiss', bg: '#fce4ec' },
      { id: 'hc-2', emoji: '🍒✨', label: 'Sparkle Cherry', bg: '#f8bbd0' },
      { id: 'hc-3', emoji: '🍒❓', label: 'Curious Cherry', bg: '#f3e5f5' },
      { id: 'hc-4', emoji: '🍒❤️', label: 'Heart Cherry', bg: '#ffebee' },
      { id: 'hc-5', emoji: '🍒🍰', label: 'Cherry Cake', bg: '#fff8e1' },
    ],
  },
  {
    id: 'peach',
    title: 'Peach',
    count: 32,
    added: false,
    icon: '🍑',
    stickers: [
      { id: 'p-1', emoji: '🍑😆', label: 'Happy Peach', bg: '#ffe0d6' },
      { id: 'p-2', emoji: '🍑💕', label: 'Love Peach', bg: '#fce4ec' },
      { id: 'p-3', emoji: '🍑👍', label: 'Approve Peach', bg: '#fff8e1' },
      { id: 'p-4', emoji: '🍑😱', label: 'Shocked Peach', bg: '#e3f2fd' },
      { id: 'p-5', emoji: '🍑🏃', label: 'Running Peach', bg: '#ffebee' },
    ],
  },
  {
    id: 'chilled-cat',
    title: 'Chilled Cat',
    count: 32,
    added: true,
    icon: '🐱',
    stickers: [
      { id: 'cc-1', emoji: '🐱💡', label: 'Idea Cat', bg: '#fff8e1' },
      { id: 'cc-2', emoji: '🐱👓', label: 'Cool Cat', bg: '#f3e5f5' },
      { id: 'cc-3', emoji: '🐱🤔', label: 'Thinking Cat', bg: '#e1f5fe' },
      { id: 'cc-4', emoji: '🐱🙀', label: 'Surprised Cat', bg: '#e0f7fa' },
      { id: 'cc-5', emoji: '🐱👋', label: 'Wave Cat', bg: '#e8eaf6' },
    ],
  },
  {
    id: 'little-flame',
    title: 'Little Flame',
    count: 32,
    added: false,
    icon: '🔥',
    stickers: [
      { id: 'lf-1', emoji: '🔥😌', label: 'Calm Flame', bg: '#fff3e0' },
      { id: 'lf-2', emoji: '🔥💙', label: 'Blue Flame', bg: '#e3f2fd' },
      { id: 'lf-3', emoji: '🔥😈', label: 'Spicy Flame', bg: '#ffebee' },
      { id: 'lf-4', emoji: '🔥🎉', label: 'Party Flame', bg: '#fce4ec' },
      { id: 'lf-5', emoji: '🔥☕', label: 'Cozy Flame', bg: '#efebe9' },
    ],
  },
];

const DEFAULT_GIFS = [
  { id: 'gif-1', title: 'Nyan Cat Rainbow', emoji: '🌈🐱', gradient: 'linear-gradient(135deg, #1a237e, #e91e63, #ffeb3b)' },
  { id: 'gif-2', title: 'Spongebob Rainbow', emoji: '🧽🌈', gradient: 'linear-gradient(135deg, #29b6f6, #fdd835)' },
  { id: 'gif-3', title: 'Nothing Is Impossible', emoji: '💪✨', gradient: 'linear-gradient(135deg, #263238, #607d8b)' },
  { id: 'gif-4', title: 'Follow Your Dreams', emoji: '🌠💤', gradient: 'linear-gradient(135deg, #4a148c, #ff6f00)' },
  { id: 'gif-5', title: 'Shia Just Do It', emoji: '🔥🙌', gradient: 'linear-gradient(135deg, #212121, #b71c1c)' },
  { id: 'gif-6', title: 'BMO Dancing', emoji: '🤖🎶', gradient: 'linear-gradient(135deg, #00695c, #4db6ac)' },
  { id: 'gif-7', title: 'Adventure Time Rain', emoji: '🗡️🌧️', gradient: 'linear-gradient(135deg, #283593, #90caf9)' },
  { id: 'gif-8', title: 'Party Confetti', emoji: '🥳🎊', gradient: 'linear-gradient(135deg, #ad1457, #ffb300)' },
  { id: 'gif-9', title: 'Coding Fast', emoji: '💻⚡', gradient: 'linear-gradient(135deg, #0d47a1, #00e676)' },
];

function formatTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(typeof value === 'number' && value < 1e11 ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(title) {
  const parts = String(title || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'T';
  return parts
    .slice(0, 2)
    .map(p => [...p][0]?.toUpperCase() || '')
    .join('') || 'T';
}

function inferFolderIcon(title, emoticon) {
  const lower = String(title || '').toLowerCase();
  if (emoticon === '👤') return { icon: 'user', customEmoji: '👤' };
  if (emoticon === '📢') return { icon: 'channel', customEmoji: '📢' };
  if (emoticon === '👥') return { icon: 'group', customEmoji: '👥' };
  if (emoticon === '🤖') return { icon: 'bot', customEmoji: '🤖' };
  if (emoticon === '⭐') return { icon: 'star', customEmoji: '⭐' };
  if (/друз|friend/.test(lower)) return { icon: 'folder', customEmoji: emoticon || '🐻' };
  if (/health|здоров/.test(lower)) return { icon: 'folder', customEmoji: emoticon || '❤️' };
  if (/развит|study|learn/.test(lower)) return { icon: 'folder', customEmoji: emoticon || '💡' };
  return { icon: 'folder', customEmoji: emoticon && emoticon !== '📁' ? emoticon : '' };
}

export async function createTransport(config) {
  const { TelegramClient, MemoryStorage, Dialog, Thumbnail } = await import('@mtcute/web');
  const client = new TelegramClient({
    apiId: config.apiId, apiHash: config.apiHash,
    storage: new MemoryStorage(), updates: false,
    logLevel: 0,
    initConnectionOptions: { deviceModel: 'Web browser', appVersion: '0.2.0', systemVersion: navigator.platform || 'Web', langCode: navigator.language.split('-')[0] || 'en' },
  });
  const api = client.withParams({ timeout: 30000, floodSleepThreshold: 0, maxRetryCount: 1 });
  const user = value => ({ id: String(value.id), displayName: value.displayName, username: value.username || '' });
  const sent = value => value.phoneCodeHash ? { type: value.type, phoneCodeHash: value.phoneCodeHash, nextType: value.nextType, timeout: value.timeout, length: value.length } : { user: user(value) };

  const peerMap = new Map();
  const rawPeerMap = new Map();
  const chatMap = new Map();
  let cachedFolders = [];
  let stickerPacks = JSON.parse(JSON.stringify(DEFAULT_STICKER_PACKS));

  function bytesToBlobUrl(bytes, mime = 'image/jpeg') {
    if (!bytes || !(bytes instanceof Uint8Array) || bytes.length === 0 || typeof URL === 'undefined') {
      return '';
    }
    try {
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch {
      return '';
    }
  }

  function extractStrippedThumbUrl(media) {
    try {
      const sizes = media?.raw?.sizes || media?.raw?.thumbs || [];
      const stripped = sizes.find(s => s?._ === 'photoStrippedSize');
      if (stripped && media?.raw) {
        const thumb = new Thumbnail(media.raw, stripped);
        if (thumb.location instanceof Uint8Array) {
          return bytesToBlobUrl(thumb.location);
        }
      }
    } catch {}
    return '';
  }

  function formatDateLabel(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  function mapMessage(msg, overrideMedia = null, isChannel = false) {
    const mediaType = msg?.media?.type || '';
    let media = overrideMedia;
    if (!media) {
      if (mediaType === 'sticker') {
        media = {
          type: 'sticker',
          emoji: msg?.media?.alt || '🎭',
          label: msg?.media?.alt || 'Sticker',
          bg: '#fff8e1',
        };
      } else if (mediaType === 'photo') {
        media = {
          type: 'photo',
          emoji: '🖼️',
          title: msg?.text || 'Photo',
          photoUrl: extractStrippedThumbUrl(msg?.media),
        };
      }
    }
    const reactions = [];
    for (const r of msg?.raw?.reactions?.results || []) {
      const emoticon = r?.reaction?.emoticon;
      if (emoticon) {
        reactions.push({ emoji: emoticon, count: Number(r.count || 1) });
      }
    }
    return {
      id: String(msg?.id || Date.now()),
      sender: msg?.isOutgoing ? 'You' : (msg?.sender?.displayName || ''),
      text: media?.type === 'sticker' || media?.type === 'gif'
        ? ''
        : (msg?.text || (mediaType && mediaType !== 'photo' ? `[${mediaType}]` : '')),
      time: formatTime(msg?.date || new Date()),
      dateLabel: formatDateLabel(msg?.date || new Date()),
      views: msg?.views || 0,
      reactions,
      out: isChannel ? false : Boolean(msg?.isOutgoing ?? true),
      read: true,
      media,
    };
  }

  function mapDialog(dialog) {
    const peer = dialog.peer;
    const id = String(peer.id);
    peerMap.set(id, peer.inputPeer || peer.id);
    rawPeerMap.set(id, peer);

    const isSelf = peer.type === 'user' && Boolean(peer.isSelf);
    const isBot = peer.type === 'user' && Boolean(peer.isBot);
    const title = isSelf
      ? 'Saved Messages'
      : (peer.displayName || peer.title || peer.username || 'Telegram Chat');
    const isTelegram = id === '777000' || title === 'Telegram';
    const colorIndex = Math.abs(Number(peer.id) || 0) % AVATAR_GRADIENTS.length;
    const avatarBg = isSelf || isTelegram
      ? '#3390ec'
      : AVATAR_GRADIENTS[colorIndex];

    let initialAvatarUrl = '';
    if (!isSelf && !isTelegram && peer?.photo) {
      try {
        initialAvatarUrl = bytesToBlobUrl(peer.photo.thumb);
      } catch {}
    }

    let online = false;
    let status = '';
    if (peer.type === 'user') {
      if (isSelf) status = 'cloud storage';
      else if (isBot) status = 'bot';
      else if (peer.status === 'online') {
        online = true;
        status = 'online';
      } else if (peer.status === 'recently') {
        status = 'last seen recently';
      } else {
        status = peer.username ? `@${peer.username}` : 'last seen recently';
      }
    } else {
      if (peer.chatType === 'channel') {
        status = peer.membersCount ? `${peer.membersCount.toLocaleString()} subscribers` : 'channel';
      } else {
        status = peer.membersCount ? `${peer.membersCount.toLocaleString()} members` : 'group';
      }
    }

    const last = dialog.lastMessage;
    const out = Boolean(last?.isOutgoing);
    const read = out
      ? (last?.id ? last.id <= dialog.lastReadOutgoing : true)
      : dialog.unreadCount === 0;
    const fromName = out && peer.type === 'chat' && peer.isGroup
      ? 'You'
      : (!out && peer.type === 'chat' && peer.isGroup && last?.sender?.displayName
          ? last.sender.displayName.split(' ')[0]
          : '');
    const mediaType = last?.media?.type || '';
    const thumbUrl = (mediaType === 'photo' || mediaType === 'video')
      ? extractStrippedThumbUrl(last?.media)
      : '';
    const mediaPreview = mediaType === 'photo'
      ? { type: 'photo', gradient: 'linear-gradient(135deg, #90caf9, #f48fb1)', thumbUrl }
      : mediaType === 'video'
        ? { type: 'video', gradient: 'linear-gradient(135deg, #ce93d8, #80deea)', thumbUrl }
        : null;

    let previewText = last?.text || '';
    if (!previewText) {
      if (mediaType === 'sticker') previewText = `${last?.media?.alt || '🎭'} Sticker`;
      else if (mediaType === 'photo') previewText = 'Photo';
      else if (mediaType === 'video') previewText = 'Video';
      else if (mediaType === 'voice') previewText = 'Voice message';
      else if (mediaType === 'document') previewText = last?.media?.fileName || 'Document';
      else if (mediaType) previewText = mediaType;
      else previewText = 'No messages yet';
    }

    const mapped = {
      id,
      title,
      online,
      saved: isSelf,
      isTelegram,
      pinned: Boolean(dialog.isPinned),
      verified: Boolean(peer.isVerified) || isTelegram,
      forwarded: Boolean(last?.forward),
      docPreview: mediaType === 'document',
      username: peer.username || '',
      phone: peer.phone || '',
      bio: '',
      time: formatTime(last?.date),
      unreadCount: Number(dialog.unreadCount || 0),
      muted: Boolean(dialog.isMuted),
      out,
      read,
      fromName,
      text: previewText,
      mediaPreview,
      status,
      hiddenInAll: false,
      avatar: {
        bg: avatarBg,
        initials: getInitials(title),
        badge: isBot ? 'bot' : null,
        photoUrl: initialAvatarUrl,
        hasPhoto: Boolean(peer?.photo?.small && !isSelf && !isTelegram),
        hiRes: false,
      },
    };
    chatMap.set(id, mapped);
    return mapped;
  }

  return {
    prepare: () => client.prepare(),
    signInQr: async ({ signal, onUrlUpdated, onScanned }) => user(await api.signInQr({ abortSignal: signal, onUrlUpdated, onQrScanned: onScanned })),
    sendCode: async phone => sent(await api.sendCode({ phone })),
    resendCode: async (phone, phoneCodeHash) => sent(await api.resendCode({ phone, phoneCodeHash })),
    signIn: async (phone, phoneCodeHash, phoneCode) => user(await api.signIn({ phone, phoneCodeHash, phoneCode })),
    checkPassword: async password => user(await api.checkPassword(password)),
    getPasswordHint: () => api.getPasswordHint(),
    getMe: async () => user(await api.getMe()),
    importSession: async value => { await client.prepare(); try { await client.importSession(value); } catch { throw Object.assign(new Error('INVALID_SESSION'), { text: 'INVALID_SESSION' }); } },
    exportSession: () => client.exportSession(),
    logOut: () => api.logOut(),
    close: () => client.destroy(),

    getBootstrap: async () => {
      const rawDialogs = [];
      for await (const d of api.iterDialogs({ limit: 80, archived: 'exclude' })) {
        rawDialogs.push(d);
      }
      const chats = rawDialogs.map(mapDialog);

      // Upgrade profile photos for the top 12 dialogs to crisp 160x160 JPEGs via downloadAsBuffer(peer.photo.small)
      await Promise.all(
        rawDialogs.slice(0, 12).map(async (d, idx) => {
          if (!d.peer?.photo?.small || chats[idx]?.saved || chats[idx]?.isTelegram) return;
          try {
            const bytes = await Promise.race([
              api.downloadAsBuffer(d.peer.photo.small),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
            ]);
            const photoUrl = bytesToBlobUrl(bytes);
            if (photoUrl) {
              chats[idx].avatar.photoUrl = photoUrl;
              chats[idx].avatar.hiRes = true;
              chatMap.set(chats[idx].id, chats[idx]);
            }
          } catch {}
        })
      );

      let archivedSummary = null;
      try {
        const archivedDialogs = [];
        for await (const d of api.iterDialogs({ limit: 15, archived: 'only' })) {
          archivedDialogs.push(d);
        }
        if (archivedDialogs.length > 0) {
          const names = archivedDialogs
            .slice(0, 6)
            .map(d => d.peer.displayName || d.peer.title || 'Chat')
            .join(', ');
          const unreadTotal = archivedDialogs.reduce((acc, d) => acc + Number(d.unreadCount || 0), 0);
          archivedSummary = {
            count: unreadTotal || archivedDialogs.length,
            preview: names,
          };
        }
      } catch {
        // Ignore archived dialog errors.
      }

      const folders = [
        {
          id: 'all',
          title: 'All Chats',
          icon: 'chats',
          customEmoji: '',
          system: true,
          includedIds: [],
          excludedIds: [],
          inviteLinks: [],
        },
      ];

      try {
        const rawFolders = await api.getFolders();
        for (const filter of rawFolders?.filters || []) {
          if (!filter || filter._ === 'dialogFilterDefault') continue;
          const fTitle = typeof filter.title === 'string'
            ? filter.title
            : (filter.title?.text || 'Folder');
          let predicate = () => false;
          try {
            predicate = Dialog.filterFolder(filter, false);
          } catch {}
          const matchingDialogs = rawDialogs.filter(d => {
            try {
              return predicate(d);
            } catch {
              return false;
            }
          });
          const includedIds = matchingDialogs.map(d => String(d.peer.id));
          const badgeCount = matchingDialogs.filter(d => Number(d.unreadCount || 0) > 0).length;
          const iconMeta = inferFolderIcon(fTitle, filter.emoticon);
          folders.push({
            id: `tg-folder-${filter.id}`,
            title: fTitle,
            ...iconMeta,
            system: false,
            badgeCount,
            includedIds,
            excludedIds: [],
            inviteLinks: [],
          });
        }
      } catch {
        // Ignore folder fetch errors and fall back to standard category folders.
      }

      if (folders.length === 1) {
        const personalIds = rawDialogs.filter(d => d.peer.type === 'user' && !d.peer.isBot).map(d => String(d.peer.id));
        const channelIds = rawDialogs.filter(d => d.peer.type === 'chat' && d.peer.chatType === 'channel').map(d => String(d.peer.id));
        const groupIds = rawDialogs.filter(d => d.peer.type === 'chat' && d.peer.isGroup).map(d => String(d.peer.id));
        const botIds = rawDialogs.filter(d => d.peer.type === 'user' && d.peer.isBot).map(d => String(d.peer.id));

        folders.push(
          { id: 'personal', title: 'Personal', icon: 'user', customEmoji: '⛏️', system: false, includedIds: personalIds, excludedIds: [], inviteLinks: [] },
          { id: 'channels', title: 'Channels', icon: 'channel', customEmoji: '💎', system: false, includedIds: channelIds, excludedIds: [], inviteLinks: [] },
          { id: 'groups', title: 'Groups', icon: 'group', customEmoji: '₿', system: false, includedIds: groupIds, excludedIds: [], inviteLinks: [] },
          { id: 'bots', title: 'Bots', icon: 'bot', customEmoji: '🤖', system: false, includedIds: botIds, excludedIds: [], inviteLinks: [] },
        );
      }

      let meProfile = null;
      try {
        const fullMe = await api.getFullUser('self');
        let mePhotoUrl = '';
        if (fullMe?.photo) {
          mePhotoUrl = bytesToBlobUrl(fullMe.photo.thumb);
          try {
            const bytes = await Promise.race([
              api.downloadAsBuffer(fullMe.photo.big || fullMe.photo.small),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
            ]);
            const hiUrl = bytesToBlobUrl(bytes);
            if (hiUrl) mePhotoUrl = hiUrl;
          } catch {}
        }
        const rawPhone = String(fullMe?.phoneNumber || '').replace(/\D/g, '');
        const formattedPhone = rawPhone.startsWith('44') && rawPhone.length === 12
          ? `+44 ${rawPhone.slice(2, 6)} ${rawPhone.slice(6)}`
          : rawPhone
            ? `+${rawPhone}`
            : '';
        let formattedBirthday = '';
        const bday = fullMe?.birthday;
        if (bday && bday.day && bday.month) {
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const mName = months[(bday.month - 1) % 12] || '';
          if (bday.year) {
            const now = new Date();
            let age = now.getFullYear() - bday.year;
            const mDiff = (now.getMonth() + 1) - bday.month;
            if (mDiff < 0 || (mDiff === 0 && now.getDate() < bday.day)) age -= 1;
            formattedBirthday = `${mName} ${bday.day}, ${bday.year} (${age} years old)`;
          } else {
            formattedBirthday = `${mName} ${bday.day}`;
          }
        }
        let personalChannel = null;
        if (fullMe?.personalChannel) {
          const ch = fullMe.personalChannel;
          const chId = String(ch.id);
          const existingChat = chatMap.get(chId);
          let chPhotoUrl = existingChat?.avatar?.photoUrl || '';
          if (!chPhotoUrl && ch.photo) {
            chPhotoUrl = bytesToBlobUrl(ch.photo.thumb);
            try {
              const chBytes = await Promise.race([
                api.downloadAsBuffer(ch.photo.small),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
              ]);
              const hiChUrl = bytesToBlobUrl(chBytes);
              if (hiChUrl) chPhotoUrl = hiChUrl;
            } catch {}
          }
          personalChannel = {
            id: chId,
            title: ch.title || existingChat?.title || 'Channel',
            subscribers: ch.membersCount ? `${ch.membersCount.toLocaleString()} subscribers` : (existingChat?.status || 'channel'),
            photoUrl: chPhotoUrl,
            initials: getInitials(ch.title || 'C'),
            bg: existingChat?.avatar?.bg || '#3390ec',
            text: existingChat?.text || 'Channel updates',
            thumbUrl: existingChat?.mediaPreview?.thumbUrl || '',
            time: existingChat?.time || '',
          };
        }
        meProfile = {
          id: String(fullMe.id),
          displayName: fullMe.displayName || 'Telegram User',
          username: fullMe.username || '',
          phone: formattedPhone,
          bio: fullMe.bio || '',
          birthday: formattedBirthday,
          photoUrl: mePhotoUrl,
          personalChannel,
        };
      } catch {}

      cachedFolders = folders;
      return {
        folders,
        chats,
        archivedSummary,
        meProfile,
        messages: {},
        stickerPacks,
        gifs: DEFAULT_GIFS,
      };
    },

    openChat: async ({ chatId }) => {
      const id = String(chatId);
      const peer = peerMap.get(id) ?? Number(id);
      const rawPeer = rawPeerMap.get(id);
      const current = chatMap.get(id);

      const [history] = await Promise.all([
        api.getHistory(peer, { limit: 40 }),
        (async () => {
          if (current && !current.avatar?.hiRes && rawPeer?.photo?.small && !current.saved && !current.isTelegram) {
            try {
              const bytes = await Promise.race([
                api.downloadAsBuffer(rawPeer.photo.small),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
              ]);
              const photoUrl = bytesToBlobUrl(bytes);
              if (photoUrl) {
                current.avatar = { ...current.avatar, photoUrl, hiRes: true };
              }
            } catch {}
          }
        })(),
      ]);

      api.readHistory(peer).catch(() => {});
      const isChannel = Boolean(rawPeer?.chatType === 'channel' || current?.status?.includes('subscriber'));
      const rawReversed = [...history].reverse();
      const messages = rawReversed.map(msg => mapMessage(msg, null, isChannel));

      // Download full-size photo media directly via rawMsg.media (FileLocation)
      await Promise.all(
        rawReversed.map(async (rawMsg, idx) => {
          if (rawMsg?.media?.type !== 'photo') return;
          try {
            const bytes = await Promise.race([
              api.downloadAsBuffer(rawMsg.media),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
            ]);
            const photoUrl = bytesToBlobUrl(bytes);
            if (photoUrl) {
              messages[idx].media = {
                ...messages[idx].media,
                photoUrl,
              };
            }
          } catch {}
        })
      );

      const updatedChat = current ? { ...current, unreadCount: 0, read: true } : { id, title: 'Chat', unreadCount: 0 };
      chatMap.set(id, updatedChat);
      return {
        chat: updatedChat,
        messages,
      };
    },

    downloadAvatar: async ({ chatId }) => {
      const id = String(chatId);
      const rawPeer = rawPeerMap.get(id);
      const current = chatMap.get(id);
      if (!rawPeer?.photo?.small || !current || current.saved || current.isTelegram) {
        return { photoUrl: current?.avatar?.photoUrl || '' };
      }
      if (current.avatar?.hiRes && current.avatar?.photoUrl) {
        return { photoUrl: current.avatar.photoUrl };
      }
      try {
        const bytes = await Promise.race([
          api.downloadAsBuffer(rawPeer.photo.small),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
        ]);
        const photoUrl = bytesToBlobUrl(bytes);
        if (photoUrl) {
          current.avatar = { ...current.avatar, photoUrl, hiRes: true };
          chatMap.set(id, current);
          return { photoUrl };
        }
      } catch {}
      return { photoUrl: current?.avatar?.photoUrl || '' };
    },

    sendMessage: async ({ chatId, text, media }) => {
      const id = String(chatId);
      const peer = peerMap.get(id) ?? Number(id);
      const body = text?.trim() || (media?.type === 'sticker' ? media.emoji : media?.title || '');
      const sentMsg = await api.sendText(peer, body);
      const message = mapMessage(sentMsg, media || null);
      const current = chatMap.get(id);
      const updatedChat = current
        ? {
            ...current,
            text: body,
            time: message.time,
            out: true,
            read: true,
            fromName: '',
          }
        : { id, title: 'Chat', text: body, time: message.time, out: true, read: true };
      chatMap.set(id, updatedChat);
      return {
        chat: updatedChat,
        message,
      };
    },

    saveFolder: async ({ folder }) => {
      const idx = cachedFolders.findIndex(item => item.id === folder.id);
      if (idx >= 0) cachedFolders[idx] = { ...cachedFolders[idx], ...folder };
      else cachedFolders.push(folder);
      return { folders: cachedFolders, folder };
    },

    createInviteLink: async ({ folderId }) => {
      const slug = `${folderId}-${Math.random().toString(36).slice(2, 7)}`;
      const link = `https://t.me/addlist/${slug}`;
      cachedFolders = cachedFolders.map(item =>
        item.id === folderId
          ? { ...item, inviteLinks: [...(item.inviteLinks || []), link] }
          : item
      );
      const folder = cachedFolders.find(item => item.id === folderId) || null;
      return { folder, link };
    },

    toggleStickerPack: async ({ packId }) => {
      stickerPacks = stickerPacks.map(pack =>
        pack.id === packId ? { ...pack, added: !pack.added } : pack
      );
      return { stickerPacks };
    },
  };
}
