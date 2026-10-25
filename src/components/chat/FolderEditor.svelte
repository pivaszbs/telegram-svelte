<script>
  import TgIcon from '../icons/TgIcon.svelte';

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
      <TgIcon name="close" size={22} />
    </button>
    <h2>Edit Folder</h2>
    <button type="button" class="icon-btn save-btn" aria-label="Save folder" onclick={handleSave}>
      <TgIcon name="check" size={22} />
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
        {:else if icon === 'chats'}
          <TgIcon name="round_chats_filled" size={24} />
        {:else if icon === 'chat'}
          <TgIcon name="message" size={24} />
        {:else if icon === 'user'}
          <TgIcon name="user" size={24} />
        {:else if icon === 'group'}
          <TgIcon name="group" size={24} />
        {:else if icon === 'star'}
          <TgIcon name="favourites" size={24} />
        {:else if icon === 'channel'}
          <TgIcon name="channel" size={24} />
        {:else if icon === 'bot'}
          <TgIcon name="bots" size={24} />
        {:else}
          <TgIcon name="folder" size={24} />
        {/if}
      </button>

      {#if iconPickerOpen}
        <div class="folder-emoji-popover" role="dialog" aria-label="Folder icon and emoji picker">
          <div class="pack-strip">
            <span class="strip-icon active"><TgIcon name="smile" size={20} /></span>
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
            <TgIcon name="search" size={18} />
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
                  <TgIcon name="round_chats_filled" size={22} />
                {:else if std.id === 'chat'}
                  <TgIcon name="message" size={22} />
                {:else if std.id === 'user'}
                  <TgIcon name="user" size={22} />
                {:else if std.id === 'group'}
                  <TgIcon name="group" size={22} />
                {:else if std.id === 'star'}
                  <TgIcon name="favourites" size={22} />
                {:else if std.id === 'channel'}
                  <TgIcon name="channel" size={22} />
                {:else if std.id === 'bot'}
                  <TgIcon name="bots" size={22} />
                {:else}
                  <TgIcon name="folder" size={22} />
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
        <span class="plus-icon"><TgIcon name="add" size={20} /></span>
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
        <span class="plus-icon"><TgIcon name="add" size={20} /></span>
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
        <span class="plus-icon"><TgIcon name="add" size={20} /></span>
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
