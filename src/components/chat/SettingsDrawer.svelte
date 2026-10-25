<script>
  import TgIcon from '../icons/TgIcon.svelte';

  let {
    user = null,
    meProfile = null,
    onClose = () => {},
    onOpenChat = () => {},
    onOpenFolders = () => {},
    onLogout = () => {},
  } = $props();

  let moreMenuOpen = $state(false);

  let displayName = $derived(meProfile?.displayName || user?.displayName || 'Telegram User');
  let username = $derived(meProfile?.username || user?.username || '');
  let phone = $derived(meProfile?.phone || '');
  let bio = $derived(meProfile?.bio || '');
  let birthday = $derived(meProfile?.birthday || '');
  let photoUrl = $derived(meProfile?.photoUrl || '');
  let personalChannel = $derived(meProfile?.personalChannel || null);

  const settingsCategories = [
    { id: 'notifications', label: 'Notifications and Sounds', icon: 'bell_filled', bg: '#ff595a' },
    { id: 'data', label: 'Data and Storage', icon: 'data_filled', bg: '#4dcd5e' },
    { id: 'privacy', label: 'Privacy and Security', icon: 'key_filled', bg: '#7f91a4' },
    { id: 'general', label: 'General Settings', icon: 'settings_filled', bg: '#7f91a4' },
    { id: 'folders', label: 'Chat Folders', icon: 'folder_filled', bg: '#3390ec' },
    { id: 'stickers', label: 'Stickers and Emoji', icon: 'favorite_filled', bg: '#ff4b82' },
    { id: 'speakers', label: 'Speakers and Camera', icon: 'volume_up_filled', bg: '#4dcd5e' },
    { id: 'devices', label: 'Devices', icon: 'devices', bg: '#3390ec', rightValue: '11' },
    { id: 'language', label: 'Language', icon: 'language', bg: '#9b67e6', rightValue: 'English' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard_filled', bg: '#ff9500' },
  ];

  const premiumItems = [
    { id: 'premium', label: 'Telegram Premium', icon: 'star_filled', bg: 'linear-gradient(135deg, #9b67e6, #6c7af2)' },
    { id: 'business', label: 'Telegram Business', icon: 'business_filled', bg: '#4dcd5e' },
    { id: 'gift', label: 'Send a Gift', icon: 'gift_filled', bg: '#ff9500' },
  ];
</script>

<section class="settings-drawer" aria-label="Settings">
  <header class="settings-header">
    <button type="button" class="settings-icon-btn" aria-label="Back to conversations" onclick={onClose}>
      <TgIcon name="back" size={22} />
    </button>
    <h2 class="settings-title">Settings</h2>
    <div class="settings-header-actions">
      <button type="button" class="settings-icon-btn" aria-label="Search settings">
        <TgIcon name="search" size={20} />
      </button>
      <div class="settings-more-wrap">
        <button
          type="button"
          class="settings-icon-btn"
          aria-label="More settings options"
          onclick={() => (moreMenuOpen = !moreMenuOpen)}
        >
          <TgIcon name="more" size={20} />
        </button>
        {#if moreMenuOpen}
          <div class="settings-more-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              class="logout-item"
              onclick={() => {
                moreMenuOpen = false;
                onLogout();
              }}
            >
              <TgIcon name="logout" size={18} />
              <span>Log Out</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <div class="settings-scroll">
    <div class="settings-hero">
      <div class="settings-avatar-large">
        {#if photoUrl}
          <img class="settings-avatar-img" src={photoUrl} alt={displayName} />
        {:else}
          <span>{displayName[0] || 'A'}</span>
        {/if}
      </div>
      <div class="settings-user-name">{displayName}</div>
      <div class="settings-user-status">online</div>
    </div>

    {#if personalChannel}
      <div class="settings-card channel-card">
        <div class="channel-card-header">
          <span class="channel-label">Channel</span>
          {#if personalChannel.subscribers}
            <span class="channel-subs-pill">{personalChannel.subscribers}</span>
          {/if}
        </div>
        <button
          type="button"
          class="channel-row"
          onclick={() => {
            onClose();
            onOpenChat(personalChannel.id);
          }}
        >
          <div class="channel-avatar" style={`background: ${personalChannel.bg || '#3390ec'}`}>
            {#if personalChannel.photoUrl}
              <img class="settings-avatar-img" src={personalChannel.photoUrl} alt="" />
            {:else}
              <span>{personalChannel.initials || 'C'}</span>
            {/if}
          </div>
          <div class="channel-body">
            <div class="channel-top">
              <span class="channel-title">{personalChannel.title}</span>
              {#if personalChannel.time}
                <span class="channel-time">{personalChannel.time}</span>
              {/if}
            </div>
            <div class="channel-preview">
              {#if personalChannel.thumbUrl}
                <img class="channel-thumb" src={personalChannel.thumbUrl} alt="" />
              {/if}
              <span class="channel-preview-text">{personalChannel.text}</span>
            </div>
          </div>
        </button>
      </div>
    {/if}

    <div class="settings-card info-card">
      {#if phone}
        <div class="info-row">
          <span class="squircle-icon" style="background: #4dcd5e">
            <TgIcon name="phone_filled" size={20} />
          </span>
          <div class="info-row-body">
            <div class="info-row-val">{phone}</div>
            <div class="info-row-sub">Phone</div>
          </div>
        </div>
      {/if}
      {#if username}
        <div class="info-row">
          <span class="squircle-icon" style="background: #3390ec">
            <TgIcon name="mention" size={20} />
          </span>
          <div class="info-row-body">
            <div class="info-row-val">{username}</div>
            <div class="info-row-sub">Username</div>
          </div>
        </div>
      {/if}
      {#if bio}
        <div class="info-row">
          <span class="squircle-icon" style="background: #7f91a4">
            <TgIcon name="info" size={20} />
          </span>
          <div class="info-row-body">
            <div class="info-row-val">{bio}</div>
            <div class="info-row-sub">Bio</div>
          </div>
        </div>
      {/if}
      {#if birthday}
        <div class="info-row">
          <span class="squircle-icon" style="background: #9b67e6">
            <TgIcon name="cake" size={20} />
          </span>
          <div class="info-row-body">
            <div class="info-row-val">{birthday}</div>
            <div class="info-row-sub">Birthday</div>
          </div>
        </div>
      {/if}
    </div>

    <div class="settings-card">
      {#each settingsCategories as item (item.id)}
        <button
          type="button"
          class="settings-nav-row"
          onclick={() => {
            if (item.id === 'folders') {
              onOpenFolders();
            }
          }}
        >
          <span class="squircle-icon" style={`background: ${item.bg}`}>
            <TgIcon name={item.icon} size={20} />
          </span>
          <span class="settings-nav-label">{item.label}</span>
          {#if item.rightValue}
            <span class="settings-nav-right">{item.rightValue}</span>
          {/if}
        </button>
      {/each}
    </div>

    <div class="settings-card">
      {#each premiumItems as item (item.id)}
        <button type="button" class="settings-nav-row">
          <span class="squircle-icon" style={`background: ${item.bg}`}>
            <TgIcon name={item.icon} size={20} />
          </span>
          <span class="settings-nav-label">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>
</section>

<style>
  .settings-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--settings-bg, #f1f1f5);
    color: var(--panel-text, #11161d);
  }
  :global(.workspace-shell.dark) .settings-drawer {
    --settings-bg: #101921;
  }
  .settings-header {
    display: flex;
    align-items: center;
    gap: 14px;
    height: 56px;
    padding: 0 12px;
    background: var(--panel-bg, #ffffff);
    flex-shrink: 0;
  }
  .settings-title {
    flex: 1;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  .settings-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .settings-icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--panel-text, #11161d);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .settings-icon-btn:hover {
    background: var(--panel-hover, #f1f3f5);
  }
  .settings-more-wrap {
    position: relative;
  }
  .settings-more-menu {
    position: absolute;
    top: 42px;
    right: 0;
    min-width: 150px;
    background: var(--panel-bg, #ffffff);
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    z-index: 30;
  }
  .logout-item {
    width: 100%;
    border: 0;
    background: transparent;
    color: #e53935;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  .logout-item:hover {
    background: rgba(229, 57, 53, 0.08);
  }
  .settings-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings-hero {
    background: var(--panel-bg, #ffffff);
    margin: 0 -12px;
    padding: 12px 20px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .settings-avatar-large {
    width: 112px;
    height: 112px;
    border-radius: 50%;
    background: linear-gradient(135deg, #42a5f5, #1e88e5);
    color: #fff;
    font-size: 40px;
    font-weight: 600;
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .settings-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }
  .settings-user-name {
    margin-top: 14px;
    font-size: 20px;
    font-weight: 600;
  }
  .settings-user-status {
    margin-top: 3px;
    font-size: 14px;
    color: var(--panel-muted, #707579);
  }
  .settings-card {
    background: var(--panel-bg, #ffffff);
    border-radius: 16px;
    padding: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }
  .channel-card {
    padding: 12px 14px;
  }
  .channel-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .channel-label {
    color: #3390ec;
    font-size: 15px;
    font-weight: 600;
  }
  .channel-subs-pill {
    background: rgba(51, 144, 236, 0.12);
    color: #3390ec;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
  }
  .channel-row {
    width: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    padding: 4px 0;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    cursor: pointer;
  }
  .channel-avatar {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border-radius: 50%;
    color: #fff;
    font-weight: 600;
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .channel-body {
    flex: 1;
    min-width: 0;
  }
  .channel-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .channel-title {
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .channel-time {
    font-size: 12px;
    color: var(--panel-muted, #707579);
  }
  .channel-preview {
    margin-top: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--panel-muted, #707579);
  }
  .channel-thumb {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    object-fit: cover;
  }
  .channel-preview-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .info-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 9px 10px;
    border-radius: 12px;
  }
  .info-row:hover {
    background: var(--panel-hover, #f1f3f5);
  }
  .squircle-icon {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    border-radius: 9px;
    color: #fff;
    display: grid;
    place-items: center;
  }
  .info-row-body {
    flex: 1;
    min-width: 0;
  }
  .info-row-val {
    font-size: 15px;
    font-weight: 500;
    line-height: 1.25;
  }
  .info-row-sub {
    font-size: 13px;
    color: var(--panel-muted, #707579);
    margin-top: 2px;
  }
  .settings-nav-row {
    width: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px;
    border-radius: 12px;
    text-align: left;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }
  .settings-nav-row:hover {
    background: var(--panel-hover, #f1f3f5);
  }
  .settings-nav-label {
    flex: 1;
  }
  .settings-nav-right {
    font-size: 15px;
    color: var(--panel-muted, #707579);
  }
</style>
