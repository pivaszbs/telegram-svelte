// Stateful Fake Telegram Server for SvelteKit routes and E2E verification.
const defaultUser = { id: '123456789', displayName: 'Alex Morgan', username: 'alex_demo' };

function createInitialChatState() {
  const folders = [
    { id: 'all', title: 'All Chats', icon: 'chats', customEmoji: '', system: true, includedIds: [], excludedIds: [], inviteLinks: [] },
    { id: 'personal', title: 'Personal', icon: 'user', customEmoji: '⛏️', system: false, includedIds: ['1', '2', '6'], excludedIds: [], inviteLinks: [] },
    { id: 'channels', title: 'Channels', icon: 'channel', customEmoji: '💎', system: false, includedIds: ['3', '7'], excludedIds: [], inviteLinks: [] },
    { id: 'groups', title: 'Groups', icon: 'group', customEmoji: '₿', system: false, badgeCount: 5, includedIds: ['5', '8'], excludedIds: [], inviteLinks: [] },
    { id: 'bots', title: 'Bots', icon: 'bot', customEmoji: '🤖', system: false, includedIds: ['9'], excludedIds: [], inviteLinks: [] },
    { id: 'other', title: 'Other', icon: 'folder', customEmoji: '👾', system: false, includedIds: ['4', '7'], excludedIds: ['8'], inviteLinks: ['https://t.me/addlist/other-chats'] },
  ];

  const chats = [
    {
      id: '1',
      title: 'Jessica Flowers',
      online: true,
      pinned: true,
      verified: false,
      username: 'jessica_flowers',
      phone: '+1 385 943 8853',
      bio: '25 y.o. product designer & traveler',
      pinnedMessage: { id: 101, text: 'Hey Alex! Did you check the new Telegram Web A mockups?' },
      time: '19:25',
      unreadCount: 2,
      muted: false,
      out: false,
      read: true,
      fromName: '',
      text: 'Wait, my views have...',
      mediaPreview: null,
      status: 'online',
      avatar: { bg: 'linear-gradient(135deg, #e57373, #ad1457)', initials: 'JF', badge: 'photo' },
    },
    {
      id: '2',
      title: 'Patrick Rose',
      online: false,
      pinned: true,
      verified: false,
      username: 'patrick_rose',
      phone: '+44 7700 900412',
      bio: 'Coffee enthusiast · London',
      time: '19:25',
      unreadCount: 0,
      muted: false,
      out: true,
      read: true,
      fromName: '',
      text: 'Will be there soon, 1h or so',
      mediaPreview: null,
      status: 'last seen recently',
      avatar: { bg: 'linear-gradient(135deg, #ffd54f, #f57f17)', initials: 'PR', badge: 'photo' },
    },
    {
      id: '3',
      title: 'Digital Nomads',
      online: false,
      pinned: false,
      verified: true,
      username: 'digitalnomads_global',
      bio: 'Remote work communities, visas, and coworking spots worldwide.',
      pinnedMessage: { id: 301, text: 'Any coworking recommendations in Lisbon for next week?' },
      time: '19:25',
      unreadCount: 8,
      muted: true,
      out: false,
      read: true,
      fromName: 'Leo',
      text: 'Cool, give this a try.',
      mediaPreview: null,
      status: '1,420 members, 84 online',
      avatar: { bg: 'linear-gradient(135deg, #4dd0e1, #00695c)', initials: 'DN', badge: 'group' },
    },
    {
      id: '4',
      title: 'Saved Messages',
      saved: true,
      online: false,
      pinned: true,
      verified: false,
      username: 'alex_demo',
      bio: 'Personal cloud storage for messages, media and links.',
      time: '19:25',
      unreadCount: 0,
      muted: false,
      out: false,
      read: true,
      fromName: '',
      text: 'Photo',
      mediaPreview: { type: 'photo', label: 'Photo', gradient: 'linear-gradient(135deg, #ffcc80, #5c6bc0)' },
      status: 'cloud storage',
      avatar: { bg: '#3390ec', initials: 'SM', badge: 'saved' },
    },
    {
      id: '5',
      title: 'Gaming',
      online: false,
      time: '19:25',
      unreadCount: 5,
      muted: true,
      out: false,
      read: true,
      fromName: 'Leo',
      text: 'Cool, give this a try.',
      mediaPreview: null,
      status: '512 members, 49 online',
      avatar: { bg: 'linear-gradient(135deg, #7e57c2, #311b92)', initials: 'GA', badge: 'gamepad' },
    },
    {
      id: '6',
      title: 'Emma Richards',
      online: true,
      time: '19:25',
      unreadCount: 0,
      muted: false,
      out: true,
      read: true,
      fromName: '',
      text: 'I, for one, welcome our new...',
      mediaPreview: null,
      status: 'online',
      avatar: { bg: 'linear-gradient(135deg, #81c784, #2e7d32)', initials: 'ER', badge: 'photo' },
    },
    {
      id: '7',
      title: 'Doge memes',
      online: false,
      time: '19:25',
      unreadCount: 1,
      muted: true,
      out: false,
      read: true,
      fromName: '',
      text: 'Photo',
      mediaPreview: { type: 'photo', label: 'Photo', gradient: 'linear-gradient(135deg, #ffd54f, #e65100)' },
      status: '14.8K subscribers',
      avatar: { bg: 'linear-gradient(135deg, #dce775, #827717)', initials: 'DM', badge: 'doge' },
    },
    {
      id: '8',
      title: 'Daniel Chasey',
      online: false,
      time: '19:25',
      unreadCount: 0,
      muted: false,
      out: false,
      read: true,
      fromName: '',
      text: 'Sounds like a plan for tomorrow!',
      mediaPreview: null,
      status: 'last seen 15 minutes ago',
      avatar: { bg: 'linear-gradient(135deg, #a1887f, #4e342e)', initials: 'DC', badge: 'photo' },
    },
    {
      id: '9',
      title: 'BotFather',
      online: false,
      time: '18:10',
      unreadCount: 0,
      muted: false,
      out: false,
      read: true,
      fromName: '',
      text: 'Use /newbot to create a new bot.',
      mediaPreview: null,
      status: 'bot',
      hiddenInAll: true,
      avatar: { bg: 'linear-gradient(135deg, #4fc3f7, #0277bd)', initials: 'BF', badge: 'bot' },
    },
  ];

  const messages = {
    '1': [
      { id: 101, sender: 'Jessica Flowers', text: 'Hey Alex! Did you check the new Telegram Web A mockups?', time: '19:21', out: false, read: true },
      { id: 102, sender: 'Alex Morgan', text: 'Yes, the vertical folder rail and emoji picker look great.', time: '19:23', out: true, read: true },
      { id: 103, sender: 'Jessica Flowers', text: 'Wait, my views have...', time: '19:25', out: false, read: false },
    ],
    '2': [
      { id: 201, sender: 'Patrick Rose', text: 'Are we still meeting at the coffee shop?', time: '19:20', out: false, read: true },
      { id: 202, sender: 'Alex Morgan', text: 'Will be there soon, 1h or so', time: '19:25', out: true, read: true },
    ],
    '3': [
      { id: 301, sender: 'Maya', text: 'Any coworking recommendations in Lisbon for next week?', time: '19:18', out: false, read: true },
      { id: 302, sender: 'Leo', text: 'Cool, give this a try.', time: '19:25', out: false, read: false },
    ],
    '4': [
      { id: 401, sender: 'Alex Morgan', text: 'Coastline reference photo for the desktop theme.', time: '19:25', out: true, read: true, media: { type: 'photo', title: 'Sunset Coastline', emoji: '🌅' } },
    ],
    '5': [
      { id: 501, sender: 'Sam', text: 'Who is joining the co-op session tonight?', time: '19:19', out: false, read: true },
      { id: 502, sender: 'Leo', text: 'Cool, give this a try.', time: '19:25', out: false, read: false },
    ],
    '6': [
      { id: 601, sender: 'Emma Richards', text: 'The new SvelteKit fake server makes end-to-end testing super fast.', time: '19:22', out: false, read: true },
      { id: 602, sender: 'Alex Morgan', text: 'I, for one, welcome our new...', time: '19:25', out: true, read: true },
    ],
    '7': [
      { id: 701, sender: 'Doge memes', text: 'Much wow, very Svelte 5!', time: '19:25', out: false, read: false, media: { type: 'photo', title: 'Royal Doge', emoji: '🐕👑' } },
    ],
    '8': [
      { id: 801, sender: 'Daniel Chasey', text: 'Sounds like a plan for tomorrow!', time: '19:25', out: false, read: true },
    ],
    '9': [
      { id: 901, sender: 'BotFather', text: 'Use /newbot to create a new bot.', time: '18:10', out: false, read: true },
    ],
  };

  const stickerPacks = [
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
        { id: 'lf-3', emoji: '🔥🪵', label: 'Campfire', bg: '#fbe9e7' },
        { id: 'lf-4', emoji: '🔥😵', label: 'Dizzy Flame', bg: '#ffebee' },
        { id: 'lf-5', emoji: '🔥🙌', label: 'Hi Flame', bg: '#fff8e1' },
      ],
    },
  ];

  const gifs = [
    { id: 'gif-1', title: 'Homer Backing Into Hedges', tags: ['funny', 'reaction', 'hide', '😮'], gradient: 'linear-gradient(135deg, #33691e, #fdd835)', emoji: '🌳😮' },
    { id: 'gif-2', title: 'Nyan Cat Rainbow', tags: ['cat', 'rainbow', 'party', '🥳'], gradient: 'linear-gradient(135deg, #0d47a1, #f50057)', emoji: '🌈🐱' },
    { id: 'gif-3', title: 'SpongeBob Typing Fast', tags: ['work', 'typing', 'computer', '😂'], gradient: 'linear-gradient(135deg, #795548, #ffee58)', emoji: '🧽💻' },
    { id: 'gif-4', title: 'Computer Kid Thumbs Up', tags: ['approve', 'thumbs', '👍', '😎'], gradient: 'linear-gradient(135deg, #546e7a, #3949ab)', emoji: '👦👍' },
    { id: 'gif-5', title: 'Color Spectrum Burst', tags: ['rainbow', 'colors', '😍', '🥳'], gradient: 'conic-gradient(#ff1744, #ffea00, #00e676, #00e5ff, #2979ff, #d500f9, #ff1744)', emoji: '✨🎨' },
    { id: 'gif-6', title: 'Burger Table Waiting', tags: ['food', 'burger', '🙄', '😡'], gradient: 'linear-gradient(135deg, #039be5, #fb8c00)', emoji: '🍔🐟' },
  ];

  return { folders, chats, messages, stickerPacks, gifs, nextMessageId: 1000 };
}

function createInstanceState() {
  return {
    signedIn: false,
    user: { ...defaultUser },
    sentChallenge: { type: 'app', phoneCodeHash: 'sample-code-hash', nextType: 'sms', timeout: 1, length: 5 },
    chatState: createInitialChatState(),
  };
}

const instances = new Map();

export function getInstance(instanceId = 'default') {
  if (!instances.has(instanceId)) {
    instances.set(instanceId, createInstanceState());
  }
  return instances.get(instanceId);
}

export function resetInstance(instanceId = 'default') {
  const fresh = createInstanceState();
  instances.set(instanceId, fresh);
  return fresh;
}

const rpcError = (text, extra = {}) => Object.assign(new Error(text), { text, ...extra });

export async function handleFakeTelegramRpc(action, payload = {}, instanceId = 'default') {
  const state = getInstance(instanceId);
  const { chatState } = state;

  switch (action) {
    case 'reset': {
      resetInstance(instanceId);
      return { ok: true };
    }
    case 'prepare': {
      return { ok: true };
    }
    case 'qrStart': {
      const scenario = payload.scenario || '';
      return {
        tokenUrl: 'tg://login?token=sample-preview-not-a-real-login',
        refreshedUrl: scenario === 'refresh' ? 'tg://login?token=sample-preview-refreshed-not-a-real-login' : '',
        expiresAt: Date.now() + 60000,
      };
    }
    case 'qrScan': {
      const scenario = payload.scenario || '';
      if (scenario === 'password') throw rpcError('SESSION_PASSWORD_NEEDED');
      state.signedIn = true;
      return { ...state.user };
    }
    case 'sendCode': {
      const { phone } = payload;
      if (phone === '+447700900000') throw rpcError('PHONE_NUMBER_INVALID');
      if (phone === '+447700900001') throw rpcError('FLOOD_WAIT_%d', { seconds: 30 });
      return { ...state.sentChallenge };
    }
    case 'resendCode': {
      return { ...state.sentChallenge, type: 'sms', phoneCodeHash: 'sample-resend-hash' };
    }
    case 'signIn': {
      const { code } = payload;
      if (code === '11111') throw rpcError('PHONE_CODE_INVALID');
      if (code === '33333') throw rpcError('PHONE_CODE_EXPIRED');
      if (code === '22222') {
        state.signedIn = true;
        return { ...state.user };
      }
      throw rpcError('SESSION_PASSWORD_NEEDED');
    }
    case 'checkPassword': {
      const { password } = payload;
      if (password !== 'preview-password') throw rpcError('PASSWORD_HASH_INVALID');
      state.signedIn = true;
      return { ...state.user };
    }
    case 'getPasswordHint': {
      return 'Use preview-password in this sample flow';
    }
    case 'getMe': {
      if (!state.signedIn) throw rpcError('AUTH_KEY_UNREGISTERED');
      return { ...state.user };
    }
    case 'importSession': {
      const { session } = payload;
      if (session === 'sample-expired-session') throw rpcError('SESSION_REVOKED');
      state.signedIn = session === 'sample-session';
      return { ok: state.signedIn };
    }
    case 'exportSession': {
      return 'sample-session';
    }
    case 'logOut': {
      state.signedIn = false;
      return { ok: true };
    }
    case 'getBootstrap': {
      return {
        user: state.user,
        folders: chatState.folders,
        chats: chatState.chats,
        archivedSummary: { count: 120, preview: 'Digital Trends, Design Systems, Tech News' },
        messages: chatState.messages,
        stickerPacks: chatState.stickerPacks,
        gifs: chatState.gifs,
      };
    }
    case 'openChat': {
      const chatId = String(payload.chatId);
      const chat = chatState.chats.find(item => item.id === chatId);
      if (!chat) throw rpcError('CHAT_NOT_FOUND');
      chat.unreadCount = 0;
      const list = chatState.messages[chatId] || [];
      list.forEach(msg => { msg.read = true; });
      return {
        chat: { ...chat },
        messages: list.map(item => ({ ...item })),
      };
    }
    case 'sendMessage': {
      const chatId = String(payload.chatId);
      const text = String(payload.text || '').trim();
      const media = payload.media || null;
      if (!text && !media) throw rpcError('MESSAGE_EMPTY');
      const chat = chatState.chats.find(item => item.id === chatId);
      if (!chat) throw rpcError('CHAT_NOT_FOUND');
      if (!chatState.messages[chatId]) chatState.messages[chatId] = [];
      const created = {
        id: ++chatState.nextMessageId,
        sender: state.user.displayName,
        text,
        time: '19:26',
        out: true,
        read: true,
        media,
      };
      chatState.messages[chatId].push(created);
      chat.text = media?.type === 'sticker' ? `${media.emoji || '😊'} Sticker` : media?.type === 'gif' ? 'GIF' : text;
      chat.mediaPreview = media?.type === 'gif' ? { type: 'gif', label: 'GIF', gradient: media.gradient } : null;
      chat.fromName = '';
      chat.out = true;
      chat.read = true;
      chat.time = '19:26';
      chat.unreadCount = 0;
      return {
        message: { ...created },
        chat: { ...chat },
      };
    }
    case 'saveFolder': {
      const folderData = payload.folder || {};
      const id = String(folderData.id || `folder-${Date.now()}`);
      const title = String(folderData.title || '').trim() || 'Untitled Folder';
      const existing = chatState.folders.find(item => item.id === id);
      if (existing) {
        existing.title = title;
        if (folderData.icon) existing.icon = folderData.icon;
        if (folderData.customEmoji !== undefined) existing.customEmoji = folderData.customEmoji;
        if (Array.isArray(folderData.includedIds)) existing.includedIds = folderData.includedIds.map(String);
        if (Array.isArray(folderData.excludedIds)) existing.excludedIds = folderData.excludedIds.map(String);
        if (Array.isArray(folderData.inviteLinks)) existing.inviteLinks = folderData.inviteLinks.map(String);
      } else {
        chatState.folders.push({
          id,
          title,
          icon: folderData.icon || 'folder',
          customEmoji: folderData.customEmoji || '',
          system: false,
          includedIds: Array.isArray(folderData.includedIds) ? folderData.includedIds.map(String) : [],
          excludedIds: Array.isArray(folderData.excludedIds) ? folderData.excludedIds.map(String) : [],
          inviteLinks: Array.isArray(folderData.inviteLinks) ? folderData.inviteLinks.map(String) : [],
        });
      }
      return { folders: chatState.folders.map(item => ({ ...item })) };
    }
    case 'createInviteLink': {
      const folderId = String(payload.folderId || '');
      const folder = chatState.folders.find(item => item.id === folderId);
      if (!folder) throw rpcError('FOLDER_NOT_FOUND');
      const link = `https://t.me/addlist/${folder.id}-${folder.inviteLinks.length + 1}`;
      folder.inviteLinks = [...folder.inviteLinks, link];
      return { link, folder: { ...folder } };
    }
    case 'toggleStickerPack': {
      const packId = String(payload.packId || '');
      const pack = chatState.stickerPacks.find(item => item.id === packId);
      if (!pack) throw rpcError('STICKER_PACK_NOT_FOUND');
      pack.added = !pack.added;
      return {
        pack: { ...pack },
        stickerPacks: chatState.stickerPacks.map(item => ({ ...item })),
      };
    }
    default:
      throw rpcError(`UNKNOWN_ACTION_${action}`);
  }
}
