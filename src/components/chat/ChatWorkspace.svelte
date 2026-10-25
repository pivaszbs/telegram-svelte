<script>
  import { onMount, tick } from 'svelte';
  import { callFakeTelegram } from '../../services/fake-rpc.mjs';
  import TgIcon from '../icons/TgIcon.svelte';
  import FolderRail from './FolderRail.svelte';
  import FolderEditor from './FolderEditor.svelte';
  import SettingsDrawer from './SettingsDrawer.svelte';
  import MediaPanel from './MediaPanel.svelte';

  let {
    user = null,
    isPreview = false,
    busy = false,
    theme = 'light',
    onToggleTheme = () => {},
    onLogout = () => {},
    onCallChat = null,
  } = $props();

  const callBackend = (action, payload = {}) =>
    onCallChat ? onCallChat(action, payload) : callFakeTelegram(action, payload);

  let loading = $state(true);
  let error = $state('');
  let folders = $state([]);
  let chats = $state([]);
  let messagesByChat = $state({});
  let stickerPacks = $state([]);
  let gifs = $state([]);

  let activeFolderId = $state('all');
  let editingFolderId = $state('');
  let iconStyle = $state('standard');
  let searchQuery = $state('');
  let activeChatId = $state('');
  let drafts = $state({});
  let mediaPanelOpen = $state(false);
  let attachMenuOpen = $state(false);
  let rightSidebarOpen = $state(false);
  let sharedMediaTab = $state('media');
  let notificationsEnabled = $state(true);
  let notifBannerDismissed = $state(false);
  let archivedSummary = $state(null);
  let meProfile = $state(null);
  let settingsOpen = $state(false);
  let chatTheme = $state('light');
  let sending = $state(false);
  let messageInputEl = $state();
  let messagesContainerEl = $state();

  async function hydrateAvatars() {
    const pending = chats.filter(c => c.avatar?.hasPhoto && !c.avatar?.hiRes);
    const batchSize = 4;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async item => {
          try {
            const res = await callBackend('downloadAvatar', { chatId: item.id });
            if (res?.photoUrl) {
              chats = chats.map(c =>
                c.id === item.id
                  ? { ...c, avatar: { ...c.avatar, photoUrl: res.photoUrl, hiRes: true } }
                  : c
              );
            }
          } catch {}
        })
      );
    }
  }

  async function bootstrap() {
    loading = true;
    error = '';
    try {
      try {
        const cached = await callBackend('getCachedBootstrap');
        if (cached && Array.isArray(cached.chats) && cached.chats.length > 0) {
          folders = cached.folders || [];
          chats = cached.chats || [];
          archivedSummary = cached.archivedSummary || null;
          meProfile = cached.meProfile || null;
          messagesByChat = cached.messages || {};
          stickerPacks = cached.stickerPacks || [];
          gifs = cached.gifs || [];
          loading = false;
        }
      } catch {}

      const data = await callBackend('getBootstrap');
      folders = data.folders || [];
      chats = data.chats || [];
      archivedSummary = data.archivedSummary || null;
      meProfile = data.meProfile || null;
      messagesByChat = { ...messagesByChat, ...(data.messages || {}) };
      stickerPacks = data.stickerPacks || [];
      gifs = data.gifs || [];
      hydrateAvatars();
    } catch {
      if (!chats.length) {
        error = 'Could not load conversations from the server.';
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    bootstrap();
  });

  let editingFolder = $derived(folders.find(item => item.id === editingFolderId) || null);

  let visibleChats = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    const folder = folders.find(item => item.id === activeFolderId);
    return chats.filter(chat => {
      if (folder && folder.id !== 'all') {
        const included = folder.includedIds || [];
        const excluded = folder.excludedIds || [];
        if (!included.includes(chat.id) || excluded.includes(chat.id)) return false;
      } else if (!q && chat.hiddenInAll) {
        return false;
      }
      if (!q) return true;
      return (
        chat.title.toLowerCase().includes(q) ||
        chat.text.toLowerCase().includes(q) ||
        (chat.fromName && chat.fromName.toLowerCase().includes(q))
      );
    });
  });

  let activeChat = $derived(chats.find(item => item.id === activeChatId) || null);
  let activeMessages = $derived(activeChatId ? messagesByChat[activeChatId] || [] : []);
  let currentDraft = $derived(activeChatId ? drafts[activeChatId] || '' : '');

  function setCurrentDraft(value) {
    if (!activeChatId) return;
    drafts = { ...drafts, [activeChatId]: value };
  }

  async function openChat(chatId) {
    activeChatId = chatId;
    mediaPanelOpen = false;
    try {
      const data = await callBackend('openChat', { chatId });
      chats = chats.map(item => (item.id === chatId ? data.chat : item));
      messagesByChat = { ...messagesByChat, [chatId]: data.messages };
      await tick();
      if (messagesContainerEl) {
        messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
      }
    } catch {
      // Keep local messages if the server call fails.
    }
  }

  async function submitTextMessage() {
    if (!activeChatId || sending) return;
    const text = (drafts[activeChatId] || '').trim();
    if (!text) return;
    const chatId = activeChatId;
    sending = true;
    try {
      const data = await callBackend('sendMessage', { chatId, text });
      drafts = { ...drafts, [chatId]: '' };
      mediaPanelOpen = false;
      chats = chats.map(item => (item.id === chatId ? data.chat : item));
      messagesByChat = {
        ...messagesByChat,
        [chatId]: [...(messagesByChat[chatId] || []), data.message],
      };
      await tick();
      if (messagesContainerEl) {
        messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
      }
      messageInputEl?.focus();
    } finally {
      sending = false;
    }
  }

  async function sendMediaMessage(media) {
    if (!activeChatId || sending) return;
    const chatId = activeChatId;
    sending = true;
    try {
      const data = await callBackend('sendMessage', {
        chatId,
        text: media.type === 'sticker' ? `${media.emoji} ${media.label}` : media.title,
        media,
      });
      chats = chats.map(item => (item.id === chatId ? data.chat : item));
      messagesByChat = {
        ...messagesByChat,
        [chatId]: [...(messagesByChat[chatId] || []), data.message],
      };
      mediaPanelOpen = false;
      await tick();
      if (messagesContainerEl) {
        messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
      }
    } finally {
      sending = false;
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submitTextMessage();
    }
  }

  function insertEmoji(emoji) {
    if (!activeChatId) return;
    const current = drafts[activeChatId] || '';
    setCurrentDraft(current + emoji);
  }

  function backspaceDraft() {
    if (!activeChatId) return;
    const current = Array.from(drafts[activeChatId] || '');
    current.pop();
    setCurrentDraft(current.join(''));
  }

  async function saveFolder(updated) {
    const data = await callBackend('saveFolder', { folder: updated });
    folders = data.folders;
    editingFolderId = '';
  }

  async function createInviteLink(folderId) {
    const data = await callBackend('createInviteLink', { folderId });
    folders = folders.map(item => (item.id === folderId ? data.folder : item));
    return data.link;
  }

  async function toggleStickerPack(packId) {
    const data = await callBackend('toggleStickerPack', { packId });
    stickerPacks = data.stickerPacks;
  }
</script>

<div class="workspace-shell" class:dark={chatTheme === 'dark'} class:chat-open={Boolean(activeChatId)}>
  <FolderRail
    {folders}
    {activeFolderId}
    {iconStyle}
    {chats}
    {user}
    {meProfile}
    archivedCount={archivedSummary?.count || 0}
    theme={chatTheme}
    onSelectFolder={id => {
      activeFolderId = id;
      editingFolderId = '';
      settingsOpen = false;
    }}
    onEditFolder={id => {
      settingsOpen = false;
      editingFolderId = id;
    }}
    onChangeIconStyle={style => {
      iconStyle = style;
    }}
    onToggleTheme={nextTheme => {
      chatTheme = typeof nextTheme === 'string' ? nextTheme : chatTheme === 'dark' ? 'light' : 'dark';
      onToggleTheme();
    }}
    onOpenSettings={() => {
      editingFolderId = '';
      settingsOpen = true;
    }}
    onOpenSavedMessages={() => {
      settingsOpen = false;
      editingFolderId = '';
      const saved = chats.find(c => c.saved);
      if (saved) openChat(saved.id);
    }}
    {onLogout}
  />

  <aside class="sidebar-column" aria-label="Conversations">
    {#if editingFolder}
      <FolderEditor
        folder={editingFolder}
        {chats}
        onClose={() => (editingFolderId = '')}
        onSave={saveFolder}
        onCreateInviteLink={createInviteLink}
      />
    {:else if settingsOpen}
      <SettingsDrawer
        {user}
        {meProfile}
        onClose={() => (settingsOpen = false)}
        onOpenChat={id => {
          settingsOpen = false;
          openChat(id);
        }}
        onOpenFolders={() => {
          settingsOpen = false;
          const target = folders.find(item => !item.system) || folders.at(-1);
          if (target) editingFolderId = target.id;
        }}
        {onLogout}
      />
    {:else}
      <div class="search-header">
        <div class="search-pill">
          <TgIcon class="search-svg" name="search" size={20} />
          <input
            type="search"
            aria-label="Search conversations"
            placeholder="Search"
            bind:value={searchQuery}
          />
          <div class="stories-Overlap" aria-hidden="true">
            <span class="story-ring tg-story"><TgIcon name="logo" size={16} /></span>
            <span class="story-ring user-story">
              {#if meProfile?.photoUrl}
                <img class="avatar-img" src={meProfile.photoUrl} alt="" />
              {:else}
                {(meProfile?.displayName || user?.displayName || 'A')[0]}
              {/if}
            </span>
          </div>
        </div>
      </div>

      {#if !notifBannerDismissed}
        <div class="notif-banner" role="region" aria-label="Notification prompt">
          <div class="notif-banner-body">
            <div class="notif-banner-title">Never miss a message! 🔔</div>
            <div class="notif-banner-sub">Enable notifications to stay updated.</div>
          </div>
          <button
            type="button"
            class="notif-banner-close"
            aria-label="Dismiss notification prompt"
            onclick={() => (notifBannerDismissed = true)}
          >
            <TgIcon name="close" size={18} />
          </button>
        </div>
      {/if}

      <div class="dialog-list" role="list" aria-label="Chat list">
        {#if loading}
          <p class="list-status" role="status">Loading conversations…</p>
        {:else if error}
          <p class="list-status" role="alert">{error}</p>
        {:else if !visibleChats.length}
          <p class="list-status">No conversations found</p>
        {:else}
          {#if activeFolderId === 'all' && !searchQuery.trim() && archivedSummary}
            <div class="dialog-row archived-row" aria-label="Archived chats">
              <div class="avatar-cell">
                <div class="archived-ring">
                  <div class="chat-avatar archived-avatar">
                    <TgIcon name="archive_filled" size={24} />
                  </div>
                </div>
              </div>
              <div class="dialog-body">
                <div class="dialog-top">
                  <span class="dialog-title">Archived Chats</span>
                </div>
                <div class="dialog-bottom">
                  <span class="dialog-preview">
                    <span class="preview-text">{archivedSummary.preview}</span>
                  </span>
                  {#if archivedSummary.count > 0}
                    <span class="unread-pill muted">{archivedSummary.count}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
          {#each visibleChats as chat (chat.id)}
            <button
              type="button"
              class="dialog-row"
              class:active={activeChatId === chat.id}
              aria-current={activeChatId === chat.id ? 'true' : undefined}
              onclick={() => openChat(chat.id)}
            >
              <div class="avatar-cell">
                <div class="chat-avatar" style={`background: ${chat.avatar?.bg || '#3390ec'}`}>
                  {#if chat.avatar?.photoUrl}
                    <img class="avatar-img" src={chat.avatar.photoUrl} alt="" />
                  {:else if chat.saved}
                    <TgIcon name="savedmessages" size={28} />
                  {:else if chat.isTelegram}
                    <TgIcon name="logo" size={28} />
                  {:else if chat.avatar?.badge === 'gamepad'}
                    <span class="avatar-emoji">🎮</span>
                  {:else if chat.avatar?.badge === 'doge'}
                    <span class="avatar-emoji">🐕</span>
                  {:else if chat.avatar?.badge === 'bot'}
                    <span class="avatar-emoji">🤖</span>
                  {:else}
                    <span>{chat.avatar?.initials || chat.title[0]}</span>
                  {/if}
                </div>
                {#if chat.online}
                  <span class="online-dot" aria-label="Online"></span>
                {/if}
              </div>

              <div class="dialog-body">
                <div class="dialog-top">
                  <span class="dialog-title-group">
                    <span class="dialog-title">{chat.title}</span>
                    {#if chat.verified}
                      <span class="verified-icon" title="Verified">
                        <TgIcon name="menu_verification" size={16} />
                      </span>
                    {/if}
                    {#if chat.muted}
                      <span class="muted-icon" title="Muted">
                        <TgIcon name="mute" size={15} />
                      </span>
                    {/if}
                  </span>
                  <span class="dialog-meta">
                    {#if chat.out}
                      <span class="read-ticks" aria-label="Read">
                        <TgIcon name="checks" size={17} />
                      </span>
                    {/if}
                    <span class="dialog-time">{chat.time}</span>
                  </span>
                </div>

                <div class="dialog-bottom">
                  <span class="dialog-preview">
                    {#if chat.forwarded}
                      <span class="preview-icon"><TgIcon name="forward_filled" size={15} /></span>
                    {:else if chat.docPreview}
                      <span class="preview-icon"><TgIcon name="document" size={15} /></span>
                    {/if}
                    {#if chat.fromName}
                      <strong class="sender-prefix">{chat.fromName}:</strong>
                    {/if}
                    {#if chat.mediaPreview}
                      {#if chat.mediaPreview.thumbUrl}
                        <img class="media-thumb" src={chat.mediaPreview.thumbUrl} alt="" />
                      {:else}
                        <span class="media-thumb" style={`background: ${chat.mediaPreview.gradient}`}></span>
                      {/if}
                    {/if}
                    <span class="preview-text">{chat.text}</span>
                  </span>

                  {#if chat.unreadCount > 0}
                    <span class="unread-pill" class:muted={chat.muted}>
                      {chat.unreadCount}
                    </span>
                  {:else if chat.pinned}
                    <span class="pinned-icon" title="Pinned">
                      <TgIcon name="pinnedchat" size={17} />
                    </span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <button
        type="button"
        class="compose-fab"
        aria-label="New message"
        onclick={() => {
          if (visibleChats[0]) openChat(visibleChats[0].id);
        }}
      >
        <TgIcon name="newchat_filled" size={24} />
      </button>
    {/if}
  </aside>

  <section class="conversation-column" aria-label="Conversation">
    {#if activeChat}
      <header class="chat-header">
        <button
          type="button"
          class="back-to-list-btn"
          aria-label="Back to conversations"
          onclick={() => (activeChatId = '')}
        >
          <TgIcon name="back" size={22} />
        </button>
        <div
          class="header-profile-trigger"
          role="button"
          tabindex="0"
          onclick={() => (rightSidebarOpen = !rightSidebarOpen)}
          onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') rightSidebarOpen = !rightSidebarOpen; }}
        >
          <div class="header-avatar" style={`background: ${activeChat.avatar?.bg || '#3390ec'}`}>
            {#if activeChat.avatar?.photoUrl}
              <img class="avatar-img" src={activeChat.avatar.photoUrl} alt="" />
            {:else if activeChat.saved}
              <TgIcon name="savedmessages" size={22} />
            {:else if activeChat.isTelegram}
              <TgIcon name="logo" size={22} />
            {:else}
              {activeChat.avatar?.initials || activeChat.title[0]}
            {/if}
          </div>
          <div class="header-info">
            <h2 class="header-title">
              <span>{activeChat.title}</span>
              {#if activeChat.verified}
                <span class="verified-icon"><TgIcon name="menu_verification" size={15} /></span>
              {/if}
            </h2>
            <div class="header-status" class:online={activeChat.online}>{activeChat.status}</div>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="header-icon-btn"
            aria-label="Discussions"
            title="Discussions"
          >
            <TgIcon name="comments" size={21} />
          </button>
          <button
            type="button"
            class="header-icon-btn"
            aria-label="Search in chat"
            title="Search in chat"
          >
            <TgIcon name="search" size={21} />
          </button>
          <button
            type="button"
            class="header-icon-btn"
            aria-label="Toggle chat info"
            title="Chat Info"
            onclick={() => (rightSidebarOpen = !rightSidebarOpen)}
          >
            <TgIcon name="more" size={21} />
          </button>
        </div>
      </header>

      <div class="messages-viewport" bind:this={messagesContainerEl} aria-label="Message history">
        <div class="messages-inner">
          {#each activeMessages as msg, idx (msg.id)}
            {#if idx === 0 || (msg.dateLabel || 'October 24') !== (activeMessages[idx - 1]?.dateLabel || 'October 24')}
              <div class="date-divider"><span>{msg.dateLabel || 'October 24'}</span></div>
            {/if}
            <div class="message-row" class:outgoing={msg.out}>
              <article class="message-bubble" class:outgoing={msg.out} class:has-photo={Boolean(msg.media?.photoUrl)}>
                {#if !msg.out && activeChat.status.includes('members')}
                  <div class="message-sender">{msg.sender}</div>
                {/if}
                {#if msg.media?.type === 'sticker'}
                  <div class="message-sticker" style={`background: ${msg.media.bg || '#fff8e1'}`}>
                    <span class="sticker-big">{msg.media.emoji}</span>
                    <span class="sticker-label">{msg.media.label}</span>
                  </div>
                {:else if msg.media?.type === 'gif'}
                  <div class="message-gif" style={`background: ${msg.media.gradient}`}>
                    <span class="gif-big">{msg.media.emoji}</span>
                    <span class="gif-label">{msg.media.title}</span>
                  </div>
                {:else if msg.media?.type === 'photo'}
                  {#if msg.media.photoUrl}
                    <div class="message-photo-bleed">
                      <img class="message-photo-img" src={msg.media.photoUrl} alt={msg.text || msg.media.title || 'Photo'} />
                    </div>
                  {:else}
                    <div class="message-photo">
                      <span class="photo-big">{msg.media.emoji || '🖼️'}</span>
                      <span class="photo-title">{msg.media.title}</span>
                    </div>
                  {/if}
                {/if}
                <div class="message-caption-row">
                  {#if msg.text}
                    <div class="message-text">{msg.text}</div>
                  {/if}
                  <div class="message-meta">
                    {#if msg.views}
                      <span class="message-views">{msg.views} <TgIcon name="channelviews_filled" size={14} /></span>
                    {/if}
                    <span class="message-time">{msg.time}</span>
                    {#if msg.out}
                      <span class="message-check" aria-label="Read">
                        <TgIcon name="checks" size={16} />
                      </span>
                    {/if}
                  </div>
                </div>
              </article>

              {#if msg.reactions?.length || (!msg.out && activeChat.status?.includes('subscriber'))}
                <div class="message-side-widgets" aria-hidden="true">
                  {#each msg.reactions || [] as react}
                    <span class="reaction-pill">{react.emoji}{react.count > 1 ? ` ${react.count}` : ''}</span>
                  {/each}
                  {#if activeChat.status?.includes('subscriber')}
                    <span class="share-circle-btn">
                      <TgIcon name="forward_filled" size={16} />
                    </span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <form
        class="composer-bar"
        onsubmit={event => {
          event.preventDefault();
          submitTextMessage();
        }}
      >
        {#if mediaPanelOpen}
          <MediaPanel
            {stickerPacks}
            {gifs}
            onInsertEmoji={insertEmoji}
            onBackspace={backspaceDraft}
            onSendSticker={sticker => sendMediaMessage({ type: 'sticker', ...sticker })}
            onSendGif={gif => sendMediaMessage({ type: 'gif', ...gif })}
            onToggleStickerPack={toggleStickerPack}
          />
        {/if}

        {#if attachMenuOpen}
          <div class="attach-popup" role="menu" aria-label="Attachment options">
            <button
              type="button"
              role="menuitem"
              class="attach-menu-item"
              onclick={() => {
                attachMenuOpen = false;
                sendMediaMessage({ type: 'photo', title: 'Party Balloons Photo', emoji: '🎈🎉' });
              }}
            >
              <TgIcon name="image" size={22} />
              <span>Photo or Video</span>
            </button>
            <button
              type="button"
              role="menuitem"
              class="attach-menu-item"
              onclick={() => {
                attachMenuOpen = false;
                sendMediaMessage({ type: 'photo', title: 'Design_Spec_v0.2.pdf', emoji: '📄' });
              }}
            >
              <TgIcon name="document" size={22} />
              <span>Document</span>
            </button>
            <button
              type="button"
              role="menuitem"
              class="attach-menu-item"
              onclick={() => {
                attachMenuOpen = false;
                sendMediaMessage({ type: 'photo', title: 'Poll: Weekend Meetup', emoji: '📊' });
              }}
            >
              <TgIcon name="poll" size={22} />
              <span>Poll</span>
            </button>
          </div>
        {/if}

        <div class="composer-pill">
          <button
            type="button"
            class="composer-attach-btn"
            class:active={attachMenuOpen}
            aria-label="Attach media"
            aria-expanded={attachMenuOpen}
            onclick={() => {
              attachMenuOpen = !attachMenuOpen;
              mediaPanelOpen = false;
            }}
          >
            <TgIcon name="attach" size={23} />
          </button>

          <textarea
            bind:this={messageInputEl}
            rows="1"
            aria-label="Message"
            placeholder={activeChat.status?.includes('subscriber') ? 'Broadcast' : 'Message'}
            value={currentDraft}
            oninput={e => setCurrentDraft(e.currentTarget.value)}
            onkeydown={handleKeydown}
          ></textarea>

          {#if activeChat.status?.includes('subscriber')}
            <span class="composer-bot-badge" aria-hidden="true">
              <TgIcon name="bot_filled" size={15} />
            </span>
          {/if}

          <button
            type="button"
            class="composer-emoji-btn"
            class:active={mediaPanelOpen}
            aria-label="Open emoji, stickers and GIFs"
            aria-expanded={mediaPanelOpen}
            onclick={() => {
              mediaPanelOpen = !mediaPanelOpen;
              attachMenuOpen = false;
            }}
          >
            <TgIcon name="smile" size={24} />
          </button>
        </div>

        <button
          type="submit"
          class="composer-send-btn"
          aria-label="Send message"
          disabled={!currentDraft.trim() || sending}
        >
          {#if currentDraft.trim()}
            <TgIcon name="send2" size={22} />
          {:else}
            <TgIcon name="microphone_filled" size={22} />
          {/if}
        </button>
      </form>
    {:else}
      <div class="empty-conversation-card">
        {#if isPreview}
          <div class="preview-chip">Preview · SvelteKit fake server</div>
        {/if}
        <div class="welcome-avatar" aria-hidden="true">{user?.displayName?.[0] || 'A'}</div>
        <h1>You’re signed in</h1>
        <h2>{user?.displayName || 'Alex Morgan'}</h2>
        {#if user?.username}
          <p class="welcome-handle">@{user.username}</p>
        {/if}
        <div class="verified-status">
          <span></span>
          {isPreview ? 'Sample account confirmed' : 'Telegram verified this account'}
        </div>
        <p class="welcome-hint">Select any conversation on the left to read messages, switch folders, or send stickers and GIFs.</p>
        <button
          type="button"
          class="signout-primary"
          onclick={onLogout}
          disabled={busy}
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    {/if}
  </section>

  {#if activeChat && rightSidebarOpen}
    <aside class="right-info-sidebar" aria-label="Chat Info">
      <header class="info-header">
        <button
          type="button"
          class="header-icon-btn"
          aria-label="Close chat info"
          onclick={() => (rightSidebarOpen = false)}
        >
          <TgIcon name="close" size={22} />
        </button>
        <h3>Info</h3>
        <button type="button" class="header-icon-btn" aria-label="More options">
          <TgIcon name="more" size={22} />
        </button>
      </header>

      <div class="info-profile-card">
        <div class="info-avatar-large" style={`background: ${activeChat.avatar?.bg || '#3390ec'}`}>
          {#if activeChat.saved}
            <TgIcon name="savedmessages" size={48} />
          {:else}
            {activeChat.avatar?.initials || activeChat.title[0]}
          {/if}
        </div>
        <div class="info-name">{activeChat.title}</div>
        <div class="info-status" class:online={activeChat.online}>{activeChat.status}</div>
      </div>

      <div class="info-details-list">
        {#if activeChat.bio}
          <div class="info-detail-row">
            <TgIcon name="info" size={22} />
            <div>
              <div class="info-detail-val">{activeChat.bio}</div>
              <div class="info-detail-sub">Bio</div>
            </div>
          </div>
        {/if}
        {#if activeChat.username}
          <div class="info-detail-row">
            <TgIcon name="username" size={22} />
            <div>
              <div class="info-detail-val">@{activeChat.username}</div>
              <div class="info-detail-sub">Username</div>
            </div>
          </div>
        {/if}
        {#if activeChat.phone}
          <div class="info-detail-row">
            <TgIcon name="phone" size={22} />
            <div>
              <div class="info-detail-val">{activeChat.phone}</div>
              <div class="info-detail-sub">Phone</div>
            </div>
          </div>
        {/if}
        <label class="info-detail-row clickable">
          <TgIcon name="unmute" size={22} />
          <div class="info-detail-grow">
            <div class="info-detail-val">Notifications</div>
            <div class="info-detail-sub">{notificationsEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <input type="checkbox" bind:checked={notificationsEnabled} />
        </label>
      </div>

      <div class="shared-media-tabs" role="tablist">
        {#each ['media', 'docs', 'links', 'audio'] as tab (tab)}
          <button
            type="button"
            role="tab"
            class="shared-tab-btn"
            class:active={sharedMediaTab === tab}
            aria-selected={sharedMediaTab === tab}
            onclick={() => (sharedMediaTab = tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        {/each}
      </div>

      <div class="shared-media-grid">
        {#each [
          'linear-gradient(135deg, #ffcc80, #ef6c00)',
          'linear-gradient(135deg, #80deea, #00838f)',
          'linear-gradient(135deg, #ce93d8, #6a1b9a)',
          'linear-gradient(135deg, #a5d6a7, #2e7d32)',
          'linear-gradient(135deg, #90caf9, #1565c0)',
          'linear-gradient(135deg, #f48fb1, #ad1457)',
        ] as bg, idx (idx)}
          <div class="shared-media-cell" style={`background: ${bg}`}></div>
        {/each}
      </div>
    </aside>
  {/if}
</div>

<style>
  .workspace-shell {
    --panel-bg: #ffffff;
    --panel-text: #111111;
    --panel-muted: #707579;
    --panel-hover: #f4f4f5;
    --panel-border: #e6ebee;
    --active-row-bg: #3390ec;
    --rail-bg: rgba(116, 136, 98, 0.78);
    display: flex;
    position: relative;
    gap: 10px;
    width: 100%;
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
    background-color: #a8c595;
    background-image:
      radial-gradient(circle at 18% 18%, #d7df9f 0%, transparent 55%),
      radial-gradient(circle at 82% 20%, #8ebc8b 0%, transparent 55%),
      radial-gradient(circle at 75% 82%, #d2dc9b 0%, transparent 55%),
      linear-gradient(135deg, #c7da9e 0%, #83b286 50%, #a9ca93 100%);
    color: var(--panel-text);
    font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .workspace-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/images/pattern.svg');
    background-size: 420px auto;
    background-repeat: repeat;
    opacity: 0.11;
    pointer-events: none;
    z-index: 0;
  }
  .workspace-shell.dark {
    --panel-bg: #17212b;
    --panel-text: #f5f5f5;
    --panel-muted: #7f91a4;
    --panel-hover: #202b36;
    --panel-border: #101921;
    --active-row-bg: #2b5278;
    --rail-bg: rgba(20, 29, 38, 0.85);
    background-color: #0e1621;
    background-image: linear-gradient(135deg, #0e1621 0%, #172331 50%, #0f1824 100%);
  }
  .workspace-shell.dark::before {
    filter: invert(1);
    opacity: 0.06;
  }
  .sidebar-column {
    position: relative;
    width: clamp(310px, 32vw, 390px);
    flex: 0 0 clamp(310px, 32vw, 390px);
    height: calc(100dvh - 24px);
    margin: 12px 0;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    background: var(--panel-bg);
    overflow: hidden;
    z-index: 10;
  }
  .search-header {
    padding: 12px 12px 8px;
  }
  .search-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 42px;
    padding: 0 6px 0 14px;
    border-radius: 22px;
    background: var(--panel-hover);
    color: var(--panel-muted);
  }
  .search-pill input,
  .search-pill input:focus {
    border: 0 !important;
    background: transparent;
    width: 100%;
    height: auto;
    font-size: 15px;
    color: var(--panel-text);
    outline: none;
  }
  .stories-Overlap {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .story-ring {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    border: 2px solid #34c759;
    box-sizing: border-box;
  }
  .story-ring.tg-story {
    background: #111;
    z-index: 2;
  }
  .story-ring.user-story {
    background: #3390ec;
    border-color: #3390ec;
    margin-left: -10px;
    z-index: 1;
  }
  .notif-banner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin: 0 10px 6px;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--panel-hover);
  }
  .notif-banner-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--panel-text);
  }
  .notif-banner-sub {
    font-size: 13px;
    color: var(--panel-muted);
    margin-top: 2px;
  }
  .notif-banner-close {
    border: 0;
    background: transparent;
    color: var(--panel-muted);
    padding: 2px;
    cursor: pointer;
    border-radius: 50%;
  }
  .dialog-list {
    flex: 1;
    overflow-y: auto;
    padding: 2px 8px 80px;
  }
  .list-status {
    text-align: center;
    color: var(--panel-muted);
    padding: 28px 16px;
    font-size: 14px;
  }
  .dialog-row {
    width: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 10px;
    border-radius: 16px;
    cursor: pointer;
    text-align: left;
  }
  .dialog-row:hover {
    background: var(--panel-hover);
  }
  .dialog-row.active {
    background: var(--active-row-bg);
    color: #fff;
  }
  .dialog-row.active .dialog-time,
  .dialog-row.active .dialog-preview,
  .dialog-row.active .sender-prefix,
  .dialog-row.active .read-ticks,
  .dialog-row.active .muted-icon,
  .dialog-row.active .pinned-icon,
  .dialog-row.active .verified-icon,
  .dialog-row.active .preview-icon {
    color: rgba(255, 255, 255, 0.92);
  }
  .read-ticks {
    color: #3390ec;
    display: inline-flex;
    align-items: center;
  }
  .archived-ring {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    padding: 2px;
    box-sizing: border-box;
    border: 2px solid #2ab69d;
    display: grid;
    place-items: center;
  }
  .archived-avatar {
    width: 46px !important;
    height: 46px !important;
    background: #3390ec;
  }
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }
  .dialog-title-group {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow: hidden;
  }
  .verified-icon {
    color: #3390ec;
    display: inline-flex;
    flex-shrink: 0;
  }
  .muted-icon,
  .pinned-icon,
  .preview-icon {
    color: #9aa3ab;
    display: inline-flex;
    flex-shrink: 0;
  }
  .avatar-cell {
    position: relative;
    flex: 0 0 54px;
    width: 54px;
    height: 54px;
  }
  .chat-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    color: #fff;
    font-weight: 600;
    font-size: 18px;
    display: grid;
    place-items: center;
  }
  .avatar-emoji {
    font-size: 26px;
  }
  .online-dot {
    position: absolute;
    right: 1px;
    bottom: 1px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4dcd5e;
    border: 2px solid var(--panel-bg);
  }
  .dialog-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .dialog-top,
  .dialog-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .dialog-title {
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dialog-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .dialog-time {
    font-size: 12px;
    color: var(--panel-muted);
  }
  .dialog-preview {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    color: var(--panel-muted);
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sender-prefix {
    color: var(--panel-text);
    font-weight: 500;
  }
  .media-thumb {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .preview-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .unread-pill {
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 999px;
    background: #4dcd5e;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .unread-pill.muted {
    background: #c4c9cc;
  }
  .compose-fab {
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    border: 0;
    background: #3390ec;
    color: #fff;
    box-shadow: 0 6px 18px rgba(51, 144, 236, 0.38);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .conversation-column {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    position: relative;
  }
  .chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: calc(100% - 14px);
    height: 54px;
    margin: 12px 12px 0 2px;
    padding: 0 14px 0 8px;
    border-radius: 28px;
    background: var(--panel-bg);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .back-to-list-btn {
    display: none;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
  }
  .header-profile-trigger {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: inherit;
    padding: 4px 0;
    text-align: left;
    cursor: pointer;
  }
  .header-avatar {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    border-radius: 50%;
    color: #fff;
    font-weight: 600;
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .header-info {
    flex: 1;
    min-width: 0;
  }
  .header-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .header-status {
    font-size: 12px;
    color: var(--panel-muted);
  }
  .header-status.online {
    color: #3390ec;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .header-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--panel-muted);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .header-icon-btn:hover {
    background: var(--panel-hover);
    color: var(--panel-text);
  }
  .header-signout-btn {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--panel-text);
    padding: 5px 10px;
    border-radius: 14px;
    font-size: 12px;
    cursor: pointer;
  }
  .messages-viewport {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px 12px 2px;
  }
  .messages-inner {
    width: 100%;
    min-height: 100%;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 8px;
  }
  .date-divider {
    align-self: center;
    margin: 6px 0;
  }
  .date-divider span {
    display: inline-block;
    background: rgba(74, 114, 68, 0.45);
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 999px;
  }
  .message-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    max-width: 100%;
  }
  .message-row.outgoing {
    justify-content: flex-end;
  }
  .message-bubble {
    align-self: flex-start;
    max-width: min(78%, 460px);
    background: #ffffff;
    color: #111111;
    border-radius: 16px 16px 16px 4px;
    padding: 8px 12px 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .message-bubble.has-photo {
    padding: 3px;
    max-width: 420px;
  }
  .message-bubble.has-photo .message-caption-row {
    padding: 6px 9px 4px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }
  .workspace-shell.dark .message-bubble {
    background: #182533;
    color: #f5f5f5;
  }
  .message-bubble.outgoing {
    align-self: flex-end;
    background: #eeffde;
    color: #111111;
    border-radius: 16px 16px 4px 16px;
  }
  .workspace-shell.dark .message-bubble.outgoing {
    background: #2b5278;
    color: #ffffff;
  }
  .message-photo-bleed {
    width: 100%;
    border-radius: 13px 13px 4px 4px;
    overflow: hidden;
  }
  .message-photo-img {
    width: 100%;
    max-width: 414px;
    max-height: 520px;
    height: auto;
    object-fit: cover;
    display: block;
  }
  .message-side-widgets {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 2px;
  }
  .reaction-pill {
    background: #ffffff;
    border-radius: 999px;
    padding: 4px 8px;
    font-size: 14px;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    display: inline-flex;
    align-items: center;
  }
  .share-circle-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(74, 114, 68, 0.42);
    color: #ffffff;
    display: grid;
    place-items: center;
  }
  .message-sender {
    font-size: 13px;
    font-weight: 600;
    color: #3390ec;
    margin-bottom: 2px;
  }
  .message-text {
    font-size: 15px;
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .message-sticker,
  .message-gif,
  .message-photo {
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .sticker-big,
  .gif-big,
  .photo-big {
    font-size: 42px;
  }
  .sticker-label,
  .gif-label,
  .photo-title {
    font-size: 12px;
    font-weight: 600;
  }
  .message-gif {
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  .message-photo {
    background: linear-gradient(135deg, #fff3e0, #e3f2fd);
    color: #111;
  }
  .message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    font-size: 11px;
    color: #707579;
    margin-top: 2px;
  }
  .message-views {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .workspace-shell.dark .message-meta {
    color: #7ea3c8;
  }
  .composer-bar {
    position: relative;
    width: calc(100% - 14px);
    margin: 4px 12px 12px 2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .attach-popup {
    position: absolute;
    left: 8px;
    bottom: calc(100% + 10px);
    width: 210px;
    background: var(--panel-bg);
    color: var(--panel-text);
    border-radius: 14px;
    padding: 6px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
    z-index: 30;
  }
  .attach-menu-item {
    width: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
  }
  .attach-menu-item:hover {
    background: var(--panel-hover);
  }
  .composer-pill {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 50px;
    background: var(--panel-bg);
    border-radius: 26px;
    padding: 5px 6px 5px 10px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    box-sizing: border-box;
  }
  .composer-emoji-btn,
  .composer-attach-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--panel-muted);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .composer-emoji-btn.active,
  .composer-emoji-btn:hover,
  .composer-attach-btn.active,
  .composer-attach-btn:hover {
    color: #3390ec;
  }
  .composer-pill textarea {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--panel-text);
    font: inherit;
    font-size: 15px;
    line-height: 1.4;
    resize: none;
    outline: none;
    padding: 6px 4px;
    max-height: 120px;
  }
  .composer-bot-badge {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #4dcd5e;
    color: #11161d;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .composer-send-btn {
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    border-radius: 50%;
    border: 0;
    background: #3390ec;
    color: #fff;
    box-shadow: 0 2px 10px rgba(51, 144, 236, 0.3);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .composer-send-btn:disabled {
    opacity: 0.85;
    cursor: default;
  }
  .right-info-sidebar {
    width: 340px;
    flex: 0 0 340px;
    height: calc(100dvh - 24px);
    margin: 12px 12px 12px 0;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: var(--panel-bg);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    z-index: 12;
  }
  .info-header {
    display: flex;
    align-items: center;
    gap: 14px;
    height: 60px;
    padding: 0 14px;
    flex-shrink: 0;
  }
  .info-header h3 {
    flex: 1;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  .info-profile-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 20px 20px;
    text-align: center;
  }
  .info-avatar-large {
    width: 112px;
    height: 112px;
    border-radius: 50%;
    color: #fff;
    font-size: 38px;
    font-weight: 600;
    display: grid;
    place-items: center;
    margin-bottom: 14px;
  }
  .info-name {
    font-size: 20px;
    font-weight: 600;
  }
  .info-status {
    font-size: 14px;
    color: var(--panel-muted);
    margin-top: 4px;
  }
  .info-status.online {
    color: #3390ec;
  }
  .info-details-list {
    padding: 6px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .info-detail-row {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 10px 12px;
    border-radius: 10px;
    color: var(--panel-muted);
  }
  .info-detail-row.clickable {
    cursor: pointer;
  }
  .info-detail-row.clickable:hover {
    background: var(--panel-hover);
  }
  .info-detail-grow {
    flex: 1;
  }
  .info-detail-val {
    font-size: 15px;
    color: var(--panel-text);
  }
  .info-detail-sub {
    font-size: 12px;
    color: var(--panel-muted);
    margin-top: 2px;
  }
  .shared-media-tabs {
    display: flex;
    border-bottom: 1px solid var(--panel-border);
    padding: 0 8px;
  }
  .shared-tab-btn {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--panel-muted);
    font-size: 14px;
    font-weight: 500;
    padding: 12px 4px;
    border-bottom: 2.5px solid transparent;
    cursor: pointer;
  }
  .shared-tab-btn.active {
    color: #3390ec;
    border-bottom-color: #3390ec;
  }
  .shared-media-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    padding: 2px;
  }
  .shared-media-cell {
    aspect-ratio: 1;
  }
  .empty-conversation-card {
    margin: auto;
    width: min(90%, 360px);
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(14px);
    color: #111;
    border-radius: 24px;
    padding: 28px 24px;
    text-align: center;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
  .preview-chip {
    display: inline-block;
    font-size: 11px;
    background: rgba(51, 144, 236, 0.12);
    color: #2472c8;
    border-radius: 999px;
    padding: 4px 10px;
    margin-bottom: 12px;
  }
  .welcome-avatar {
    width: 64px;
    height: 64px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: #3390ec;
    color: #fff;
    font-size: 28px;
    font-weight: 600;
    display: grid;
    place-items: center;
  }
  .empty-conversation-card h1 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 600;
  }
  .empty-conversation-card h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
  .welcome-handle {
    margin: 4px 0 0;
    font-size: 14px;
    color: #606770;
  }
  .verified-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #2e9e6b;
    font-size: 13px;
    font-weight: 500;
    margin: 14px 0;
  }
  .verified-status span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2e9e6b;
  }
  .welcome-hint {
    font-size: 13px;
    line-height: 1.45;
    color: #555c63;
    margin: 0 0 18px;
  }
  .signout-primary {
    width: 100%;
    min-height: 44px;
    border: 0;
    border-radius: 12px;
    background: #3390ec;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    cursor: pointer;
  }
  @media (max-width: 760px) {
    .workspace-shell {
      gap: 6px;
    }
    .sidebar-column {
      flex: 1;
      width: auto;
      margin-right: 6px;
    }
    .conversation-column {
      display: none;
    }
    .workspace-shell.chat-open .sidebar-column {
      display: none;
    }
    .workspace-shell.chat-open .conversation-column {
      display: flex;
    }
    .chat-header {
      width: calc(100% - 10px);
      gap: 6px;
      padding: 0 8px 0 6px;
    }
    .header-actions .header-icon-btn:not(:last-of-type) {
      display: none;
    }
    .back-to-list-btn {
      display: inline-grid;
      place-items: center;
    }
    .header-pinned-banner {
      display: none;
    }
    .right-info-sidebar {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: min(340px, 100vw);
    }
  }
</style>
