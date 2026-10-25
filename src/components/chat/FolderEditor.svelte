<script>
  let {
    folder,
    chats = [],
    onClose = () => {},
    onSave = () => {},
    onCreateInviteLink = () => {},
  } = $props();

  let title = $state('');
  let icon = $state('folder');
  let customEmoji = $state('');
  let includedIds = $state([]);
  let excludedIds = $state([]);
  let inviteLinks = $state([]);
  let iconPickerOpen = $state(false);
  let emojiQuery = $state('');
  let showAddIncluded = $state(false);
  let showAddExcluded = $state(false);

  let initializedId = '';

  $effect(() => {
    if (folder && folder.id !== initializedId) {
      initializedId = folder.id;
      title = folder.title || 'Other';
      icon = folder.icon || 'folder';
      customEmoji = folder.customEmoji || '';
      includedIds = [...(folder.includedIds || [])];
      excludedIds = [...(folder.excludedIds || [])];
      inviteLinks = [...(folder.inviteLinks || [])];
    }
  });

  const standardIcons = [
    { id: 'chats', label: 'All chats icon' },
    { id: 'chat', label: 'Single chat icon' },
    { id: 'user', label: 'Person icon' },
    { id: 'group', label: 'Groups icon' },
    { id: 'star', label: 'Favorites icon' },
    { id: 'channel', label: 'Channels icon' },
    { id: 'bot', label: 'Bots icon' },
    { id: 'folder', label: 'Folder icon' },
  ];

  const packStrip = ['😀', '🅰️', '😂', '🐸', '🤣', '🌚', '🐱', '😜'];

  const folderEmojis = [
    { char: '😀', name: 'grinning face smile' },
    { char: '😃', name: 'grinning face big eyes' },
    { char: '😄', name: 'grinning squinting face' },
    { char: '😁', name: 'beaming face' },
    { char: '🥹', name: 'holding back tears' },
    { char: '😅', name: 'grinning sweat' },
    { char: '🤣', name: 'rolling on the floor laughing' },
    { char: '🥲', name: 'smiling tear' },
    { char: '😇', name: 'smiling halo angel' },
    { char: '🙂', name: 'slightly smiling' },
    { char: '🙃', name: 'upside down face' },
    { char: '😉', name: 'winking face' },
    { char: '😌', name: 'relieved face' },
    { char: '😍', name: 'heart eyes love' },
    { char: '🥰', name: 'smiling face with hearts' },
    { char: '😘', name: 'face blowing a kiss' },
    { char: '😗', name: 'kissing face' },
    { char: '😋', name: 'face savoring food' },
    { char: '😛', name: 'face with tongue' },
    { char: '😝', name: 'squinting face with tongue' },
    { char: '😜', name: 'winking face with tongue' },
    { char: '🤪', name: 'zany face' },
    { char: '🤨', name: 'raised eyebrow' },
    { char: '🧐', name: 'monocle face' },
    { char: '🤓', name: 'nerd face glasses' },
    { char: '🤩', name: 'star struck' },
    { char: '🥳', name: 'partying face celebration' },
    { char: '⛏️', name: 'pickaxe work' },
    { char: '💎', name: 'gem diamond nft' },
    { char: '🎮', name: 'video game controller' },
    { char: '🤖', name: 'robot bot' },
    { char: '🔥', name: 'fire flame hot' },
  ];

  let filteredEmojis = $derived.by(() => {
    const q = emojiQuery.trim().toLowerCase();
    if (!q) return folderEmojis;
    return folderEmojis.filter(item => item.name.includes(q) || item.char.includes(q));
  });

  function toggleChatInList(list, chatId) {
    return list.includes(chatId) ? list.filter(id => id !== chatId) : [...list, chatId];
  }

  function handleSave() {
    onSave({
      id: folder?.id || 'other',
      title: title.trim() || 'Other',
      icon,
      customEmoji,
      includedIds,
      excludedIds,
      inviteLinks,
    });
  }
</script>

<section class="folder-editor" aria-label="Edit Folder">
  <header class="editor-header">
    <button type="button" class="icon-btn" aria-label="Close folder editor" onclick={onClose}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
    <h2>Edit Folder</h2>
    <button type="button" class="icon-btn save-btn" aria-label="Save folder" onclick={handleSave}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </button>
  </header>

  <div class="editor-body">
    <div class="folder-hero" aria-hidden="true">
      <svg viewBox="0 0 120 100" width="96" height="82">
        <defs>
          <linearGradient id="folderBack" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8a96a3" />
            <stop offset="100%" stop-color="#5d6975" />
          </linearGradient>
          <linearGradient id="folderFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f2f5f8" />
            <stop offset="100%" stop-color="#cfd6de" />
          </linearGradient>
        </defs>
        <path d="M18 22h28l8 8h44a6 6 0 0 1 6 6v44a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6Z" fill="url(#folderBack)" />
        <path d="M22 40h84l-10 44a6 6 0 0 1-6 4H18a6 6 0 0 1-6-6l10-42Z" fill="url(#folderFront)" stroke="#9aa5b1" stroke-width="1.5" />
      </svg>
    </div>

    <div class="folder-name-box">
      <label for="folder-name-input">Folder Name</label>
      <input
        id="folder-name-input"
        type="text"
        bind:value={title}
        placeholder="Folder Name"
      />
      <button
        type="button"
        class="folder-icon-trigger"
        aria-label="Choose folder icon"
        aria-expanded={iconPickerOpen}
        onclick={() => (iconPickerOpen = !iconPickerOpen)}
      >
        {#if customEmoji && icon === 'custom'}
          <span class="trigger-emoji">{customEmoji}</span>
        {:else}
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2Z" />
          </svg>
        {/if}
      </button>

      {#if iconPickerOpen}
        <div class="folder-emoji-popover" role="dialog" aria-label="Folder icon and emoji picker">
          <div class="pack-strip">
            <span class="strip-icon active">☺</span>
            {#each packStrip as packEmoji}
              <button
                type="button"
                class="strip-emoji-btn"
                onclick={() => { customEmoji = packEmoji; icon = 'custom'; iconPickerOpen = false; }}
              >
                {packEmoji}
              </button>
            {/each}
          </div>

          <div class="emoji-search-row">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              aria-label="Search Emoji"
              placeholder="Search Emoji"
              bind:value={emojiQuery}
            />
          </div>

          <div class="standard-folder-icons" role="radiogroup" aria-label="Standard folder icons">
            {#each standardIcons as std (std.id)}
              <button
                type="button"
                class="std-icon-btn"
                class:selected={icon === std.id}
                aria-label={std.label}
                onclick={() => { icon = std.id; iconPickerOpen = false; }}
              >
                {#if std.id === 'chats'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 3C6.5 3 2 6.58 2 11c0 2.13 1.05 4.07 2.75 5.5L4 21l4.75-2.25c1.03.32 2.12.5 3.25.5 5.5 0 10-3.58 10-8.25S17.5 3 12 3Z"/></svg>
                {:else if std.id === 'chat'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/></svg>
                {:else if std.id === 'user'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.25c-3.34 0-10 1.68-10 5v1.75h20v-1.75c0-3.32-6.66-5-10-5Z"/></svg>
                {:else if std.id === 'group'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Z"/></svg>
                {:else if std.id === 'star'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                {:else if std.id === 'channel'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18 4 8 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1l2 5h2.5l-1.8-5H8l10 4V4Z"/></svg>
                {:else if std.id === 'bot'}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2v1h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2Z"/></svg>
                {:else}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2Z"/></svg>
                {/if}
              </button>
            {/each}
          </div>

          <div class="emoji-section-title">Smileys &amp; People</div>
          <div class="emoji-grid">
            {#each filteredEmojis as item (item.char)}
              <button
                type="button"
                class="emoji-cell"
                aria-label={`Select ${item.char}`}
                onclick={() => {
                  customEmoji = item.char;
                  icon = 'custom';
                  iconPickerOpen = false;
                }}
              >
                {item.char}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="folder-section">
      <h3>Included Chats</h3>
      <button type="button" class="action-row" onclick={() => (showAddIncluded = !showAddIncluded)}>
        <span class="plus-icon">+</span>
        <span>Add Chats</span>
      </button>
      {#if showAddIncluded}
        <div class="chat-selector">
          {#each chats as chat (chat.id)}
            <label class="chat-check-item">
              <input
                type="checkbox"
                checked={includedIds.includes(chat.id)}
                onchange={() => (includedIds = toggleChatInList(includedIds, chat.id))}
              />
              <span>{chat.title}</span>
            </label>
          {/each}
        </div>
      {/if}
      {#each chats.filter(c => includedIds.includes(c.id)) as chat (chat.id)}
        <div class="selected-chat-pill">{chat.title}</div>
      {/each}
    </div>

    <div class="folder-section">
      <h3>Excluded Chats</h3>
      <button type="button" class="action-row" onclick={() => (showAddExcluded = !showAddExcluded)}>
        <span class="plus-icon">+</span>
        <span>Exclude Chats</span>
      </button>
      {#if showAddExcluded}
        <div class="chat-selector">
          {#each chats as chat (chat.id)}
            <label class="chat-check-item">
              <input
                type="checkbox"
                checked={excludedIds.includes(chat.id)}
                onchange={() => (excludedIds = toggleChatInList(excludedIds, chat.id))}
              />
              <span>{chat.title}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <div class="folder-section">
      <h3>Share Folder</h3>
      <button
        type="button"
        class="action-row"
        onclick={async () => {
          const link = await onCreateInviteLink(folder?.id || 'other');
          if (link) inviteLinks = [...inviteLinks, link];
        }}
      >
        <span class="plus-icon">+</span>
        <span>Create an Invite Link</span>
      </button>
      {#each inviteLinks as link (link)}
        <div class="invite-link-item">{link}</div>
      {/each}
    </div>
  </div>
</section>

<style>
  .folder-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--panel-bg, #fff);
    color: var(--panel-text, #111);
    overflow-y: auto;
  }
  .editor-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    position: sticky;
    top: 0;
    background: var(--panel-bg, #fff);
    z-index: 5;
  }
  .editor-header h2 {
    flex: 1;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  .icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: #707579;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .icon-btn:hover {
    background: rgba(0, 0, 0, 0.06);
  }
  .save-btn {
    color: #3390ec;
  }
  .editor-body {
    padding: 8px 16px 28px;
  }
  .folder-hero {
    display: grid;
    place-items: center;
    padding: 16px 0 24px;
  }
  .folder-hero svg {
    width: 96px;
    height: 82px;
  }
  .folder-name-box {
    position: relative;
    margin-bottom: 24px;
  }
  .folder-name-box label {
    position: absolute;
    top: -8px;
    left: 14px;
    background: var(--panel-bg, #fff);
    padding: 0 5px;
    font-size: 12px;
    color: #707579;
    z-index: 1;
  }
  .folder-name-box > input {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    border: 1px solid var(--panel-border, #dadce0);
    border-radius: 12px;
    padding: 12px 48px 12px 16px;
    font-size: 16px;
    background: transparent;
    color: inherit;
  }
  .folder-name-box > input:focus {
    outline: none;
    border: 1.5px solid #3390ec;
  }
  .folder-icon-trigger {
    position: absolute;
    right: 8px;
    top: 7px;
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #8a929a;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .folder-icon-trigger:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  .trigger-emoji {
    font-size: 22px;
  }
  .folder-emoji-popover {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background: #fff;
    color: #111;
    border-radius: 18px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
    padding: 12px;
    z-index: 30;
  }
  .pack-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  .strip-icon {
    font-size: 20px;
    color: #8a929a;
    padding: 4px;
  }
  .strip-emoji-btn {
    border: 0;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
  }
  .strip-emoji-btn:hover {
    background: #f1f3f5;
  }
  .emoji-search-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f1f3f5;
    border-radius: 12px;
    padding: 8px 12px;
    color: #8a929a;
    margin-bottom: 10px;
  }
  .emoji-search-row input,
  .emoji-search-row input:focus {
    border: 0 !important;
    background: transparent;
    width: 100%;
    height: auto;
    font-size: 14px;
    outline: none;
    color: #111;
  }
  .standard-folder-icons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 4px 0 10px;
  }
  .std-icon-btn {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #8a929a;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .std-icon-btn.selected,
  .std-icon-btn:hover {
    background: #eceff2;
    color: #5f666d;
  }
  .emoji-section-title {
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: #8a929a;
    margin: 4px 0 8px;
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    max-height: 180px;
    overflow-y: auto;
  }
  .emoji-cell {
    border: 0;
    background: transparent;
    font-size: 23px;
    height: 34px;
    border-radius: 8px;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .emoji-cell:hover {
    background: #f1f3f5;
  }
  .folder-section {
    border-top: 8px solid var(--panel-hover, #f4f4f5);
    margin: 0 -16px;
    padding: 14px 16px;
  }
  .folder-section h3 {
    margin: 0 0 10px;
    font-size: 15px;
    font-weight: 600;
    color: #707579;
  }
  .action-row {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    border: 0;
    background: transparent;
    color: #3390ec;
    font-size: 15px;
    padding: 10px 4px;
    cursor: pointer;
    border-radius: 8px;
  }
  .action-row:hover {
    background: rgba(51, 144, 236, 0.08);
  }
  .plus-icon {
    font-size: 22px;
    line-height: 1;
    font-weight: 400;
  }
  .chat-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 4px;
  }
  .chat-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    cursor: pointer;
  }
  .selected-chat-pill,
  .invite-link-item {
    font-size: 13px;
    color: var(--panel-text, #52575c);
    padding: 6px 8px;
    background: var(--panel-hover, #f4f6f8);
    border-radius: 8px;
    margin-top: 6px;
    word-break: break-all;
  }
</style>
