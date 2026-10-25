<script>
  let {
    folders = [],
    activeFolderId = 'all',
    iconStyle = 'standard',
    chats = [],
    user = null,
    theme = 'light',
    onSelectFolder = () => {},
    onEditFolder = () => {},
    onChangeIconStyle = () => {},
    onToggleTheme = () => {},
    onLogout = () => {},
  } = $props();

  let menuOpen = $state(false);

  const minimalLabels = {
    all: 'All Chats',
    personal: 'Work',
    channels: 'Games',
    groups: 'Crypto',
    bots: 'Bots',
    other: 'Other',
  };

  const emojiLabels = {
    all: 'All Chats',
    personal: 'Work',
    channels: 'NFT',
    groups: 'Crypto',
    bots: 'Bots',
    other: 'Other',
  };

  function displayTitle(folder) {
    if (folder.title && !['Personal', 'Channels', 'Groups'].includes(folder.title)) {
      return folder.title;
    }
    if (iconStyle === 'emoji') return emojiLabels[folder.id] || folder.title;
    if (iconStyle === 'minimal') return minimalLabels[folder.id] || folder.title;
    return folder.title;
  }

  function folderBadge(folder) {
    if (folder.id === 'all') return 0;
    if (typeof folder.badgeCount === 'number') return folder.badgeCount;
    const ids = new Set(folder.includedIds || []);
    const excluded = new Set(folder.excludedIds || []);
    let count = 0;
    for (const chat of chats) {
      if (ids.has(chat.id) && !excluded.has(chat.id) && !chat.muted && chat.unreadCount > 0) {
        count += chat.unreadCount;
      }
    }
    return count;
  }
</script>

<nav class="folder-rail" aria-label="Chat folders">
  <div class="menu-anchor">
    <button
      type="button"
      class="rail-menu-btn"
      aria-label="Main menu"
      aria-expanded={menuOpen}
      onclick={() => (menuOpen = !menuOpen)}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    {#if menuOpen}
      <div class="main-menu" role="menu" aria-label="Account and appearance">
        <div class="menu-account">
          <div class="menu-avatar">{user?.displayName?.[0] || 'A'}</div>
          <div class="menu-user-info">
            <div class="menu-user-name">{user?.displayName || 'Alex Morgan'}</div>
            {#if user?.username}<div class="menu-user-handle">@{user.username}</div>{/if}
          </div>
        </div>
        <hr />
        <div class="menu-section-label">Folder Icons (Contest R1)</div>
        <button
          type="button"
          role="menuitem"
          class:selected={iconStyle === 'standard'}
          onclick={() => { onChangeIconStyle('standard'); menuOpen = false; }}
        >
          Standard Icons
        </button>
        <button
          type="button"
          role="menuitem"
          class:selected={iconStyle === 'emoji'}
          onclick={() => { onChangeIconStyle('emoji'); menuOpen = false; }}
        >
          Rich Emoji Icons
        </button>
        <button
          type="button"
          role="menuitem"
          class:selected={iconStyle === 'minimal'}
          onclick={() => { onChangeIconStyle('minimal'); menuOpen = false; }}
        >
          Custom Monochrome Icons
        </button>
        <hr />
        <button
          type="button"
          role="menuitem"
          onclick={() => {
            const target = folders.find(item => item.id === (activeFolderId === 'all' ? 'other' : activeFolderId)) || folders.at(-1);
            menuOpen = false;
            if (target) onEditFolder(target.id);
          }}
        >
          Edit Folder…
        </button>
        <button
          type="button"
          role="menuitem"
          onclick={() => { onToggleTheme(); menuOpen = false; }}
        >
          {theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        </button>
        <button
          type="button"
          role="menuitem"
          class="danger"
          onclick={() => { menuOpen = false; onLogout(); }}
        >
          Sign out
        </button>
      </div>
    {/if}
  </div>

  <div class="folder-items" role="tablist" aria-label="Folders">
    {#each folders as folder (folder.id)}
      {@const badge = folderBadge(folder)}
      {@const active = activeFolderId === folder.id}
      <button
        type="button"
        role="tab"
        class="folder-tab"
        class:active
        aria-selected={active}
        aria-label={`${displayTitle(folder)} folder`}
        onclick={() => onSelectFolder(folder.id)}
        ondblclick={() => { if (!folder.system) onEditFolder(folder.id); }}
      >
        <span class="folder-icon-wrap">
          {#if iconStyle === 'emoji' && folder.customEmoji && folder.id !== 'all'}
            {#if folder.id === 'other' && folder.customEmoji === '👾'}
              <span class="wat-badge">WAT</span>
            {:else if folder.id === 'groups' && folder.customEmoji === '₿'}
              <span class="btc-badge">₿</span>
            {:else}
              <span class="emoji-glyph">{folder.customEmoji}</span>
            {/if}
          {:else if iconStyle === 'minimal' && folder.id !== 'all'}
            {#if folder.id === 'personal'}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M10 4h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h4V6a2 2 0 0 1 2-2Zm0 4h4V6h-4v2Z"/></svg>
            {:else if folder.id === 'channels'}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M14.5 4a3.5 3.5 0 0 0-3.46 3h2.06a1.5 1.5 0 1 1 1.4 2h-3a3.5 3.5 0 0 0-3.5 3.5V15H6a2 2 0 1 0 0 4h11a3 3 0 0 0 3-3v-2.5A4.5 4.5 0 0 0 15.5 9h-.1A3.5 3.5 0 0 0 14.5 4Z"/></svg>
            {:else if folder.id === 'groups'}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82ZM7 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>
            {:else if folder.id === 'bots'}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2v1h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2Zm-3 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-6 8h6v2H9v-2Z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9v8l3-2 3 2 3-2 3 2 3-2 3 2v-8c0-4.97-4.03-9-9-9Zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>
            {/if}
          {:else if folder.customEmoji && !['⛏️', '💎', '₿', '🤖', '👾'].includes(folder.customEmoji)}
            <span class="emoji-glyph">{folder.customEmoji}</span>
          {:else if folder.icon === 'chats'}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 3C6.5 3 2 6.58 2 11c0 2.13 1.05 4.07 2.75 5.5L4 21l4.75-2.25c1.03.32 2.12.5 3.25.5 5.5 0 10-3.58 10-8.25S17.5 3 12 3Z"/></svg>
          {:else if folder.icon === 'user'}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.25c-3.34 0-10 1.68-10 5v1.75h20v-1.75c0-3.32-6.66-5-10-5Z"/></svg>
          {:else if folder.icon === 'channel'}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M18 4 8 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1l2 5h2.5l-1.8-5H8l10 4V4Zm2 4v8a4 4 0 0 0 0-8Z"/></svg>
          {:else if folder.icon === 'group'}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"/></svg>
          {:else if folder.icon === 'bot'}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2v1h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2Zm-3 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
          {:else if folder.icon === 'star'}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2Z"/></svg>
          {/if}
          {#if badge > 0}
            <span class="folder-badge">{badge}</span>
          {/if}
        </span>
        <span class="folder-label">{displayTitle(folder)}</span>
      </button>
    {/each}
  </div>

  <button
    type="button"
    class="edit-folders-btn"
    aria-label="Edit current folder"
    title="Edit folder"
    onclick={() => {
      const target = folders.find(item => item.id === (activeFolderId === 'all' ? 'other' : activeFolderId)) || folders.at(-1);
      if (target) onEditFolder(target.id);
    }}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  </button>
</nav>

<style>
  .folder-rail {
    width: 72px;
    flex: 0 0 72px;
    background: #1c1c1e;
    color: #8e8e93;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 12px;
    box-sizing: border-box;
    user-select: none;
    z-index: 15;
    position: relative;
  }
  .menu-anchor {
    position: relative;
    margin-bottom: 10px;
  }
  .rail-menu-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: #9e9ea3;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .rail-menu-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .main-menu {
    position: absolute;
    top: 48px;
    left: 10px;
    width: 240px;
    background: #2c2c2e;
    color: #fff;
    border-radius: 14px;
    padding: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    z-index: 40;
    text-align: left;
  }
  .menu-account {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
  }
  .menu-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #3390ec;
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 600;
  }
  .menu-user-name {
    font-size: 14px;
    font-weight: 600;
  }
  .menu-user-handle {
    font-size: 12px;
    color: #aaa;
  }
  .main-menu hr {
    border: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 6px 0;
  }
  .menu-section-label {
    font-size: 11px;
    text-transform: uppercase;
    color: #9e9ea3;
    padding: 4px 10px;
    letter-spacing: 0.4px;
  }
  .main-menu button {
    width: 100%;
    text-align: left;
    border: 0;
    background: transparent;
    color: #fff;
    padding: 9px 10px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
  }
  .main-menu button:hover,
  .main-menu button.selected {
    background: rgba(51, 144, 236, 0.22);
  }
  .main-menu button.danger {
    color: #ff6b6b;
  }
  .folder-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    flex: 1;
    overflow-y: auto;
  }
  .folder-tab {
    width: 100%;
    border: 0;
    background: transparent;
    color: #8e8e93;
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .folder-tab:hover {
    color: #d1d1d6;
    background: rgba(255, 255, 255, 0.04);
  }
  .folder-tab.active {
    color: #3da5ff;
  }
  .folder-icon-wrap {
    position: relative;
    width: 32px;
    height: 30px;
    display: grid;
    place-items: center;
  }
  .emoji-glyph {
    font-size: 24px;
    line-height: 1;
  }
  .btc-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #f7931a;
    color: #1c1c1e;
    font-weight: 800;
    font-size: 17px;
    display: grid;
    place-items: center;
  }
  .wat-badge {
    background: #6c5ce7;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    padding: 4px 5px;
    border-radius: 8px;
    letter-spacing: -0.3px;
  }
  .folder-badge {
    position: absolute;
    top: -4px;
    right: -7px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #3390ec;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: grid;
    place-items: center;
    border: 2px solid #1c1c1e;
    box-sizing: border-box;
  }
  .folder-label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.15;
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .edit-folders-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 0;
    background: rgba(255, 255, 255, 0.06);
    color: #9e9ea3;
    display: grid;
    place-items: center;
    cursor: pointer;
    margin-top: 8px;
  }
  .edit-folders-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.14);
  }
</style>
