<script>
  import TgIcon from '../icons/TgIcon.svelte';

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
      <TgIcon name="menu" size={24} />
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
          class:selected={theme === 'light'}
          onclick={() => { onToggleTheme('light'); menuOpen = false; }}
        >
          Switch to Light Theme
        </button>
        <button
          type="button"
          role="menuitem"
          class:selected={theme === 'dark'}
          onclick={() => { onToggleTheme('dark'); menuOpen = false; }}
        >
          Switch to Dark Theme
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
              <TgIcon name="work" size={26} />
            {:else if folder.id === 'channels'}
              <TgIcon name="cloud" size={26} />
            {:else if folder.id === 'groups'}
              <TgIcon name="tag_alt_filled" size={26} />
            {:else if folder.id === 'bots'}
              <TgIcon name="bot_filled" size={26} />
            {:else}
              <TgIcon name="lamp" size={26} />
            {/if}
          {:else if folder.customEmoji && !['⛏️', '💎', '₿', '🤖', '👾'].includes(folder.customEmoji)}
            <span class="emoji-glyph">{folder.customEmoji}</span>
          {:else if folder.icon === 'chats'}
            <TgIcon name="round_chats_filled" size={28} />
          {:else if folder.icon === 'chat'}
            <TgIcon name="message_filled" size={26} />
          {:else if folder.icon === 'user'}
            <TgIcon name="person_filled" size={26} />
          {:else if folder.icon === 'channel'}
            <TgIcon name="channel_filled" size={26} />
          {:else if folder.icon === 'group'}
            <TgIcon name="group_filled" size={26} />
          {:else if folder.icon === 'bot'}
            <TgIcon name="bot_filled" size={26} />
          {:else if folder.icon === 'star'}
            <TgIcon name="star_filled" size={26} />
          {:else if folder.icon === 'heart'}
            <TgIcon name="stories_like" size={26} />
          {:else if folder.icon === 'lamp'}
            <TgIcon name="lamp_filled" size={26} />
          {:else if folder.icon === 'animals'}
            <TgIcon name="animals" size={26} />
          {:else}
            <TgIcon name="folder_filled" size={27} />
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
    <TgIcon name="equalizer" size={24} />
  </button>
</nav>

<style>
  .folder-rail {
    width: 68px;
    flex: 0 0 68px;
    margin: 12px 0 12px 12px;
    border-radius: 26px;
    background: var(--rail-bg, rgba(116, 136, 98, 0.76));
    backdrop-filter: blur(18px);
    color: rgba(255, 255, 255, 0.72);
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
    color: rgba(255, 255, 255, 0.85);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .rail-menu-btn:hover {
    background: rgba(255, 255, 255, 0.12);
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
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .folder-tab:hover {
    color: rgba(255, 255, 255, 0.92);
    background: rgba(255, 255, 255, 0.06);
  }
  .folder-tab.active {
    color: #ffffff;
  }
  .folder-icon-wrap {
    position: relative;
    width: 34px;
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
    color: #141d26;
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
    min-width: 19px;
    height: 19px;
    padding: 0 5px;
    border-radius: 999px;
    background: #e2ecd8;
    color: #5b6e52;
    font-size: 11px;
    font-weight: 700;
    display: grid;
    place-items: center;
    border: 2px solid #889a78;
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
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    display: grid;
    place-items: center;
    cursor: pointer;
    margin-top: 8px;
  }
  .edit-folders-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
  }
</style>
