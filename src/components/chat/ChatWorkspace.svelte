<script>
  import { onMount, tick } from 'svelte';
  import { callFakeTelegram } from '../../services/fake-rpc.mjs';
  import TgIcon from '../icons/TgIcon.svelte';
  import FolderRail from './FolderRail.svelte';
  import FolderEditor from './FolderEditor.svelte';
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
  let sending = $state(false);
  let messageInputEl = $state();
  let messagesContainerEl = $state();

  async function bootstrap() {
    loading = true;
    error = '';
    try {
      const data = await callBackend('getBootstrap');
      folders = data.folders || [];
      chats = data.chats || [];
      messagesByChat = data.messages || {};
      stickerPacks = data.stickerPacks || [];
      gifs = data.gifs || [];
    } catch {
      error = 'Could not load conversations from the server.';
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

<div class="workspace-shell" class:dark={theme === 'dark'} class:chat-open={Boolean(activeChatId)}>
  <FolderRail
    {folders}
    {activeFolderId}
    {iconStyle}
    {chats}
    {user}
    {theme}
    onSelectFolder={id => {
      activeFolderId = id;
      editingFolderId = '';
    }}
    onEditFolder={id => {
      editingFolderId = id;
    }}
    onChangeIconStyle={style => {
      iconStyle = style;
    }}
    {onToggleTheme}
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
        </div>
      </div>

      <div class="dialog-list" role="list" aria-label="Chat list">
        {#if loading}
          <p class="list-status" role="status">Loading conversations…</p>
        {:else if error}
          <p class="list-status" role="alert">{error}</p>
        {:else if !visibleChats.length}
          <p class="list-status">No conversations found</p>
        {:else}
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
                  {#if chat.saved}
                    <TgIcon name="savedmessages" size={28} />
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
                  <span class="dialog-title">{chat.title}</span>
                  <span class="dialog-meta">
                    {#if chat.out}
                      <span class="read-ticks" aria-label="Read">
                        <TgIcon name="checks" size={18} />
                      </span>
                    {/if}
                    <span class="dialog-time">{chat.time}</span>
                  </span>
                </div>

                <div class="dialog-bottom">
                  <span class="dialog-preview">
                    {#if chat.fromName}
                      <strong class="sender-prefix">{chat.fromName}:</strong>
                    {/if}
                    {#if chat.mediaPreview}
                      <span class="media-thumb" style={`background: ${chat.mediaPreview.gradient}`}></span>
                    {/if}
                    <span class="preview-text">{chat.text}</span>
                  </span>

                  {#if chat.unreadCount > 0}
                    <span class="unread-pill" class:muted={chat.muted}>
                      {chat.unreadCount}
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
        <div class="header-avatar" style={`background: ${activeChat.avatar?.bg || '#3390ec'}`}>
          {activeChat.avatar?.initials || activeChat.title[0]}
        </div>
        <div class="header-info">
          <h2 class="header-title">{activeChat.title}</h2>
          <div class="header-status">{activeChat.status}</div>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="header-signout-btn"
            onclick={onLogout}
            disabled={busy}
          >
            Sign out
          </button>
        </div>
      </header>

      <div class="messages-viewport" bind:this={messagesContainerEl} aria-label="Message history">
        <div class="messages-inner">
          {#each activeMessages as msg (msg.id)}
            <article class="message-bubble" class:outgoing={msg.out}>
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
                <div class="message-photo">
                  <span class="photo-big">{msg.media.emoji || '🖼️'}</span>
                  <span class="photo-title">{msg.media.title}</span>
                </div>
              {/if}
              {#if msg.text}
                <div class="message-text">{msg.text}</div>
              {/if}
              <div class="message-meta">
                <span class="message-time">{msg.time}</span>
                {#if msg.out}
                  <span class="message-check" aria-label="Read">
                    <TgIcon name="checks" size={16} />
                  </span>
                {/if}
              </div>
            </article>
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

        <div class="composer-pill">
          <button
            type="button"
            class="composer-emoji-btn"
            class:active={mediaPanelOpen}
            aria-label="Open emoji, stickers and GIFs"
            aria-expanded={mediaPanelOpen}
            onclick={() => (mediaPanelOpen = !mediaPanelOpen)}
          >
            <TgIcon name="smile" size={24} />
          </button>

          <textarea
            bind:this={messageInputEl}
            rows="1"
            aria-label="Message"
            placeholder="Message"
            value={currentDraft}
            oninput={e => setCurrentDraft(e.currentTarget.value)}
            onkeydown={handleKeydown}
          ></textarea>
        </div>

        <button
          type="submit"
          class="composer-send-btn"
          aria-label="Send message"
          disabled={!currentDraft.trim() || sending}
        >
          <TgIcon name="send2" size={22} />
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
</div>

<style>
  .workspace-shell {
    --panel-bg: #ffffff;
    --panel-text: #111111;
    --panel-muted: #707579;
    --panel-hover: #f4f4f5;
    --panel-border: #e6ebee;
    display: flex;
    width: 100%;
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
    background: var(--panel-bg);
    color: var(--panel-text);
    font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .workspace-shell.dark {
    --panel-bg: #212121;
    --panel-text: #ffffff;
    --panel-muted: #aaaaaa;
    --panel-hover: #2c2c2c;
    --panel-border: #303030;
  }
  .sidebar-column {
    position: relative;
    width: clamp(300px, 32vw, 380px);
    flex: 0 0 clamp(300px, 32vw, 380px);
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--panel-bg);
    border-right: 1px solid var(--panel-border);
    z-index: 10;
  }
  .search-header {
    padding: 10px 14px 8px;
  }
  .search-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 42px;
    padding: 0 14px;
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
  .dialog-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 8px 80px;
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
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
  }
  .dialog-row:hover {
    background: var(--panel-hover);
  }
  .dialog-row.active {
    background: #3390ec;
    color: #fff;
  }
  .dialog-row.active .dialog-time,
  .dialog-row.active .dialog-preview,
  .dialog-row.active .sender-prefix,
  .dialog-row.active .read-ticks {
    color: rgba(255, 255, 255, 0.9);
  }
  .read-ticks {
    color: #4dcd5e;
    display: inline-flex;
    align-items: center;
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
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.18), transparent 45%),
      linear-gradient(135deg, #c7dca7 0%, #99be8e 50%, #b5d39c 100%);
    position: relative;
  }
  .chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 60px;
    padding: 0 18px;
    background: var(--panel-bg);
    border-bottom: 1px solid var(--panel-border);
    flex-shrink: 0;
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
  .header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #fff;
    font-weight: 600;
    display: grid;
    place-items: center;
  }
  .header-info {
    flex: 1;
    min-width: 0;
  }
  .header-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  .header-status {
    font-size: 13px;
    color: var(--panel-muted);
  }
  .header-signout-btn {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--panel-text);
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 13px;
    cursor: pointer;
  }
  .messages-viewport {
    flex: 1;
    overflow-y: auto;
    padding: 18px 20px;
  }
  .messages-inner {
    width: min(100%, 720px);
    min-height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 8px;
  }
  .message-bubble {
    align-self: flex-start;
    max-width: min(78%, 480px);
    background: #ffffff;
    color: #111111;
    border-radius: 16px 16px 16px 4px;
    padding: 8px 12px 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  .message-bubble.outgoing {
    align-self: flex-end;
    background: #eeffde;
    border-radius: 16px 16px 4px 16px;
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
  }
  .message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    font-size: 11px;
    color: #688860;
    margin-top: 2px;
  }
  .composer-bar {
    position: relative;
    width: min(100% - 28px, 720px);
    margin: 6px auto 14px;
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
  .composer-pill {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--panel-bg);
    border-radius: 24px;
    padding: 6px 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  .composer-emoji-btn {
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
  .composer-emoji-btn:hover {
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
    padding: 6px 0;
    max-height: 120px;
  }
  .composer-send-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 0;
    background: #3390ec;
    color: #fff;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(51, 144, 236, 0.35);
  }
  .composer-send-btn:disabled {
    opacity: 0.55;
    cursor: default;
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
    .sidebar-column {
      flex: 1;
      width: auto;
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
    .back-to-list-btn {
      display: inline-grid;
      place-items: center;
    }
  }
</style>
