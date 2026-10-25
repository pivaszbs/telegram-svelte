<script>
  import TgIcon from '../icons/TgIcon.svelte';

  let {
    stickerPacks = [],
    gifs = [],
    onInsertEmoji = () => {},
    onBackspace = () => {},
    onSendSticker = () => {},
    onSendGif = () => {},
    onToggleStickerPack = () => {},
  } = $props();

  let activeTab = $state('emoji'); // 'emoji' | 'stickers' | 'gifs'
  let standardExpanded = $state(false);
  let emojiQuery = $state('');
  let reactionFilter = $state('');
  let stickerQuery = $state('');
  let stickerCatalogMode = $state(false);
  let gifQuery = $state('');

  const customEmojis = [
    '🤩', '😱', '🐸', '🫣', '🥶', '🦊', '😫', '😭',
    '🦉', '😎', '😴', '🤬', '😈', '😬', '😳', '🎃',
    '🔥', '🧊', '🙄', '😮', '😭', '🥳', '😋', '🙅',
  ];

  const partyEmojis = [
    '🎉', '🎊', '🪩', '🎈', '🥳', '🤩', '🎁', '🪅',
    '🌟', '🧸', '🍪', '🤩', '🐻', '🦌', '🎅', '🤪',
  ];

  const standardEmojis = [
    { char: '😀', tags: 'smile happy face' },
    { char: '😃', tags: 'smile happy open' },
    { char: '😄', tags: 'smile grin happy' },
    { char: '😁', tags: 'beaming grin' },
    { char: '🥹', tags: 'tears happy proud' },
    { char: '😅', tags: 'sweat laugh' },
    { char: '🤣', tags: 'rofl laugh' },
    { char: '🥲', tags: 'smile tear' },
    { char: '😇', tags: 'angel halo' },
    { char: '🙂', tags: 'smile slight' },
    { char: '🙃', tags: 'upside down' },
    { char: '😉', tags: 'wink' },
    { char: '😌', tags: 'relieved calm' },
    { char: '😍', tags: 'heart eyes love' },
    { char: '🥰', tags: 'hearts love' },
    { char: '😘', tags: 'kiss love' },
    { char: '😗', tags: 'kiss' },
    { char: '😋', tags: 'yum tongue' },
    { char: '😛', tags: 'tongue' },
    { char: '😝', tags: 'squint tongue' },
    { char: '😜', tags: 'wink tongue' },
    { char: '🤪', tags: 'zany crazy' },
    { char: '🤨', tags: 'eyebrow skeptical' },
    { char: '🧐', tags: 'monocle' },
    { char: '🥸', tags: 'disguise glasses' },
    { char: '🤩', tags: 'star struck party' },
    { char: '🥳', tags: 'party celebrate' },
    { char: '😏', tags: 'smirk' },
    { char: '😒', tags: 'unamused' },
    { char: '😞', tags: 'sad' },
    { char: '😔', tags: 'pensive sad' },
    { char: '😟', tags: 'worried' },
    { char: '😕', tags: 'confused' },
    { char: '😣', tags: 'persevere' },
    { char: '😖', tags: 'confounded' },
    { char: '😫', tags: 'tired' },
    { char: '😩', tags: 'weary' },
    { char: '🥺', tags: 'pleading puppy' },
    { char: '😢', tags: 'cry tear sad' },
    { char: '😭', tags: 'sob cry' },
    { char: '😡', tags: 'angry mad' },
    { char: '🤬', tags: 'swear angry' },
    { char: '🤯', tags: 'mind blown' },
    { char: '😳', tags: 'flushed' },
    { char: '🥵', tags: 'hot sweat' },
    { char: '🥶', tags: 'cold frozen' },
    { char: '😶‍🌫️', tags: 'clouds fog' },
    { char: '😱', tags: 'scream fear' },
  ];

  const quickReactions = [
    { id: 'heart', label: 'Heart filter', tgIcon: 'favourites', emojis: ['❤️', '😍', '🥰', '😘', '💕', '💖', '💗', '💓'] },
    { id: 'up', label: 'Thumbs up filter', tgIcon: 'like', emojis: ['👍', '🙌', '👏', '🤝', '💪', '🔥', '✨', '💯'] },
    { id: 'down', label: 'Thumbs down filter', tgIcon: 'dislike', emojis: ['👎', '😒', '🙄', '😐', '😑', '🤦', '🤷', '😬'] },
    { id: 'party', label: 'Party filter', tgIcon: 'party', emojis: partyEmojis },
    { id: 'happy', label: 'Happy filter', tgIcon: 'emoji_happy', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂'] },
    { id: 'sad', label: 'Sad filter', tgIcon: 'emoji_sad', emojis: ['😢', '😭', '🥺', '😞', '😔', '😟', '💔', '🥲'] },
  ];

  let filteredStandardEmojis = $derived.by(() => {
    const q = emojiQuery.trim().toLowerCase();
    if (!q) return standardEmojis;
    return standardEmojis.filter(item => item.tags.includes(q) || item.char.includes(q));
  });

  let activeReactionEmojis = $derived.by(() => {
    const found = quickReactions.find(r => r.id === reactionFilter);
    return found ? found.emojis : [];
  });

  let catalogPacks = $derived.by(() => {
    const q = stickerQuery.trim().toLowerCase();
    const list = stickerPacks.filter(pack => pack.id !== 'featured-top');
    if (!q) return list;
    return list.filter(pack => pack.title.toLowerCase().includes(q));
  });

  let filteredGifs = $derived.by(() => {
    const q = gifQuery.trim().toLowerCase();
    if (!q) return gifs;
    return gifs.filter(g => g.title.toLowerCase().includes(q) || g.tags.some(t => t.toLowerCase().includes(q)));
  });
</script>

<section class="media-panel" aria-label="Emoji, stickers and GIFs panel">
  {#if activeTab === 'emoji'}
    <div class="top-strip">
      <button type="button" class="strip-clock" aria-label="Recent emojis" onclick={() => { standardExpanded = false; reactionFilter = ''; }}>
        <TgIcon name="recent" size={20} />
      </button>

      {#if standardExpanded}
        <div class="standard-cat-pill" role="group" aria-label="Standard emoji categories">
          <button type="button" class="cat-btn active" aria-label="Smileys & People" onclick={() => (standardExpanded = false)}><TgIcon name="smile" size={18} /></button>
          <button type="button" class="cat-btn" aria-label="Animals & Nature"><TgIcon name="animals" size={18} /></button>
          <button type="button" class="cat-btn" aria-label="Food & Drink"><TgIcon name="eats" size={18} /></button>
          <button type="button" class="cat-btn" aria-label="Activity"><TgIcon name="sport" size={18} /></button>
          <button type="button" class="cat-btn" aria-label="Travel & Places"><TgIcon name="car" size={18} /></button>
          <button type="button" class="cat-btn" aria-label="Objects"><TgIcon name="lamp" size={18} /></button>
          <button type="button" class="cat-btn" aria-label="Flags"><TgIcon name="flag" size={18} /></button>
        </div>
      {:else}
        <button
          type="button"
          class="strip-std-toggle"
          aria-label="Expand standard emoji categories"
          onclick={() => { standardExpanded = true; reactionFilter = ''; }}
        >
          <TgIcon name="smile" size={20} />
        </button>
      {/if}

      {#each ['😄', '😂', '🐸', '🤣', '🌚', '🐱', '😜'] as packIcon}
        <button
          type="button"
          class="strip-pack-btn"
          onclick={() => { standardExpanded = false; reactionFilter = ''; }}
        >
          {packIcon}
        </button>
      {/each}
    </div>

    {#if !standardExpanded}
      <div class="search-filter-bar">
        {#if reactionFilter}
          <button
            type="button"
            class="back-filter-btn"
            aria-label="Clear reaction filter"
            onclick={() => (reactionFilter = '')}
          >
            <TgIcon name="back" size={18} />
          </button>
        {:else}
          <TgIcon class="search-icon" name="search" size={18} />
          <input
            type="search"
            aria-label="Search Emoji"
            placeholder="Search Emoji"
            bind:value={emojiQuery}
          />
        {/if}

        <div class="reaction-strip">
          {#each quickReactions as react (react.id)}
            <button
              type="button"
              class="reaction-chip"
              class:active={reactionFilter === react.id}
              aria-label={react.label}
              onclick={() => (reactionFilter = reactionFilter === react.id ? '' : react.id)}
            >
              <TgIcon name={react.tgIcon} size={18} />
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="panel-scroll">
      {#if reactionFilter}
        <div class="emoji-grid">
          {#each activeReactionEmojis as emoji, idx (`${emoji}-${idx}`)}
            <button type="button" class="emoji-item" aria-label={`Insert ${emoji}`} onclick={() => onInsertEmoji(emoji)}>
              {emoji}
            </button>
          {/each}
        </div>
      {:else if standardExpanded}
        <div class="emoji-grid">
          {#each standardEmojis as item, idx (`std-${idx}`)}
            <button type="button" class="emoji-item" aria-label={`Insert ${item.char}`} onclick={() => onInsertEmoji(item.char)}>
              {item.char}
            </button>
          {/each}
        </div>
      {:else}
        {#if !emojiQuery.trim()}
          <div class="emoji-grid custom-grid">
            {#each customEmojis as emoji, idx (`cust-${idx}`)}
              <button type="button" class="emoji-item" aria-label={`Insert ${emoji}`} onclick={() => onInsertEmoji(emoji)}>
                {emoji}
              </button>
            {/each}
          </div>
        {/if}
        <div class="section-heading">Smileys &amp; People</div>
        <div class="emoji-grid">
          {#each filteredStandardEmojis as item, idx (`filt-${idx}`)}
            <button type="button" class="emoji-item" aria-label={`Insert ${item.char}`} onclick={() => onInsertEmoji(item.char)}>
              {item.char}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {:else if activeTab === 'stickers'}
    {#if !stickerCatalogMode}
      <div class="top-strip">
        <button type="button" class="strip-clock active" aria-label="Recent stickers">
          <TgIcon name="recent" size={20} />
        </button>
        {#each ['😂', '🐸', '🦄', '🐕', '🐹', '🐱', '🦉', '🥶'] as icon}
          <button type="button" class="strip-pack-btn">{icon}</button>
        {/each}
      </div>
    {/if}

    <div class="search-filter-bar">
      <TgIcon class="search-icon" name="search" size={18} />
      <input
        type="search"
        aria-label="Search Stickers"
        placeholder="Search Stickers"
        bind:value={stickerQuery}
        onfocus={() => (stickerCatalogMode = true)}
      />
      {#if stickerCatalogMode}
        <button
          type="button"
          class="clear-catalog-btn"
          aria-label="Close sticker catalog"
          onclick={() => { stickerCatalogMode = false; stickerQuery = ''; }}
        >
          <TgIcon name="close" size={18} />
        </button>
      {:else}
        <div class="reaction-strip">
          {#each quickReactions.slice(0, 5) as react (react.id)}
            <button
              type="button"
              class="reaction-chip"
              onclick={() => (stickerCatalogMode = true)}
            >
              <TgIcon name={react.tgIcon} size={18} />
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="panel-scroll">
      {#if stickerCatalogMode}
        <div class="sticker-catalog" aria-label="Sticker pack catalog">
          {#each catalogPacks as pack (pack.id)}
            <div class="catalog-pack">
              <div class="catalog-pack-header">
                <div>
                  <div class="catalog-pack-title">{pack.title}</div>
                  <div class="catalog-pack-sub">{pack.count} stickers</div>
                </div>
                <button
                  type="button"
                  class="pack-toggle-btn"
                  class:added={pack.added}
                  aria-label={`${pack.added ? 'Remove' : 'Add'} ${pack.title} sticker pack`}
                  onclick={() => onToggleStickerPack(pack.id)}
                >
                  {pack.added ? 'ADDED' : 'ADD'}
                </button>
              </div>
              <div class="sticker-row-5">
                {#each pack.stickers.slice(0, 5) as sticker (sticker.id)}
                  <button
                    type="button"
                    class="sticker-tile"
                    style={`--tile-bg: ${sticker.bg}`}
                    aria-label={`Send sticker ${sticker.label}`}
                    onclick={() => onSendSticker(sticker)}
                  >
                    <span class="sticker-art">{sticker.emoji}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        {@const featured = stickerPacks.find(p => p.id === 'featured-top')}
        {@const hotCherry = stickerPacks.find(p => p.id === 'hot-cherry')}
        {#if featured}
          <div class="sticker-grid-5">
            {#each featured.stickers as sticker (sticker.id)}
              <button
                type="button"
                class="sticker-tile"
                style={`--tile-bg: ${sticker.bg}`}
                aria-label={`Send sticker ${sticker.label}`}
                onclick={() => onSendSticker(sticker)}
              >
                <span class="sticker-art">{sticker.emoji}</span>
              </button>
            {/each}
          </div>
        {/if}
        {#if hotCherry}
          <div class="section-heading">{hotCherry.title}</div>
          <div class="sticker-grid-5">
            {#each hotCherry.stickers as sticker (sticker.id)}
              <button
                type="button"
                class="sticker-tile"
                style={`--tile-bg: ${sticker.bg}`}
                aria-label={`Send sticker ${sticker.label}`}
                onclick={() => onSendSticker(sticker)}
              >
                <span class="sticker-art">{sticker.emoji}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {:else if activeTab === 'gifs'}
    <div class="top-strip">
      <button type="button" class="strip-clock active" aria-label="Trending GIFs" onclick={() => (gifQuery = '')}>
        <TgIcon name="recent" size={20} />
      </button>
      {#each ['👍', '😍', '😘', '😡', '🥳', '😂', '😮', '🙄', '😎'] as trendEmoji}
        <button type="button" class="strip-pack-btn" onclick={() => (gifQuery = trendEmoji)}>
          {trendEmoji}
        </button>
      {/each}
    </div>

    <div class="search-filter-bar gif-search-bar">
      <TgIcon class="search-icon" name="search" size={18} />
      <input
        type="search"
        aria-label="Search GIFs"
        placeholder="Search GIFs"
        bind:value={gifQuery}
      />
    </div>

    <div class="panel-scroll gif-scroll">
      <div class="gif-grid-3">
        {#each filteredGifs as gif (gif.id)}
          <button
            type="button"
            class="gif-cell"
            style={`background: ${gif.gradient}`}
            aria-label={`Send GIF ${gif.title}`}
            onclick={() => onSendGif(gif)}
          >
            <span class="gif-emoji">{gif.emoji}</span>
            <span class="gif-caption">{gif.title}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if !(activeTab === 'stickers' && stickerCatalogMode)}
    <footer class="panel-bottom-bar">
      <button
        type="button"
        class="bottom-icon-btn"
        aria-label="Toggle media search"
        onclick={() => {
          if (activeTab === 'stickers') stickerCatalogMode = !stickerCatalogMode;
        }}
      >
        <TgIcon name="search" size={20} />
      </button>

      <div class="bottom-tabs" role="tablist" aria-label="Media type">
        <button
          type="button"
          role="tab"
          class="bottom-tab"
          class:active={activeTab === 'emoji'}
          aria-selected={activeTab === 'emoji'}
          aria-label="Emoji tab"
          onclick={() => (activeTab = 'emoji')}
        >
          <TgIcon name="smile" size={22} />
        </button>
        <button
          type="button"
          role="tab"
          class="bottom-tab"
          class:active={activeTab === 'stickers'}
          aria-selected={activeTab === 'stickers'}
          aria-label="Stickers tab"
          onclick={() => { activeTab = 'stickers'; stickerCatalogMode = false; }}
        >
          <TgIcon name="stickers_face" size={22} />
        </button>
        <button
          type="button"
          role="tab"
          class="bottom-tab"
          class:active={activeTab === 'gifs'}
          aria-selected={activeTab === 'gifs'}
          aria-label="GIFs tab"
          onclick={() => (activeTab = 'gifs')}
        >
          <TgIcon name="gifs" size={22} />
        </button>
      </div>

      <button
        type="button"
        class="bottom-icon-btn"
        aria-label="Backspace"
        onclick={onBackspace}
      >
        <TgIcon name="deleteleft" size={22} />
      </button>
    </footer>
  {/if}
</section>

<style>
  .media-panel {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    width: min(392px, calc(100vw - 24px));
    height: 430px;
    background: rgba(235, 243, 232, 0.96);
    backdrop-filter: blur(18px);
    border-radius: 22px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.22);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #3f5342;
    z-index: 30;
  }
  .top-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px 6px;
    overflow-x: auto;
  }
  .strip-clock,
  .strip-std-toggle,
  .strip-pack-btn {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #5b725e;
    font-size: 20px;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .strip-clock.active,
  .strip-std-toggle:hover,
  .strip-pack-btn:hover {
    background: rgba(91, 114, 94, 0.14);
  }
  .standard-cat-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(91, 114, 94, 0.14);
    border-radius: 999px;
    padding: 2px 6px;
  }
  .cat-btn {
    border: 0;
    background: transparent;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    color: #5b725e;
    display: grid;
    place-items: center;
  }
  .cat-btn.active {
    background: rgba(255, 255, 255, 0.7);
  }
  .search-filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 12px 8px;
    padding: 6px 10px;
    background: rgba(91, 114, 94, 0.12);
    border-radius: 14px;
  }
  .gif-search-bar {
    justify-content: center;
  }
  .search-icon {
    color: #6b806d;
    flex-shrink: 0;
  }
  .search-filter-bar input,
  .search-filter-bar input:focus {
    border: 0 !important;
    background: transparent;
    width: 100%;
    height: auto;
    min-width: 80px;
    font-size: 14px;
    color: #2f4032;
    outline: none;
  }
  .reaction-strip {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .reaction-chip,
  .back-filter-btn,
  .clear-catalog-btn {
    border: 0;
    background: transparent;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 15px;
    color: #5b725e;
    display: grid;
    place-items: center;
  }
  .reaction-chip.active,
  .reaction-chip:hover {
    background: rgba(91, 114, 94, 0.2);
  }
  .panel-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 4px 12px 10px;
  }
  .gif-scroll {
    padding: 2px 8px 8px;
  }
  .section-heading {
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: #6b806d;
    margin: 8px 0 6px;
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  .emoji-item {
    border: 0;
    background: transparent;
    height: 38px;
    font-size: 25px;
    border-radius: 10px;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .emoji-item:hover {
    background: rgba(91, 114, 94, 0.14);
  }
  .sticker-grid-5,
  .sticker-row-5 {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  .sticker-tile {
    border: 0;
    background: var(--tile-bg, rgba(255, 255, 255, 0.6));
    border-radius: 14px;
    aspect-ratio: 1;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: transform 0.12s ease;
  }
  .sticker-tile:hover {
    transform: scale(1.06);
  }
  .sticker-art {
    font-size: 26px;
  }
  .catalog-pack {
    margin-bottom: 14px;
  }
  .catalog-pack-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .catalog-pack-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d21;
  }
  .catalog-pack-sub {
    font-size: 12px;
    color: #6b806d;
  }
  .pack-toggle-btn {
    border: 0;
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    background: #3390ec;
    color: #fff;
    cursor: pointer;
  }
  .pack-toggle-btn.added {
    background: rgba(91, 114, 94, 0.16);
    color: #6b806d;
  }
  .gif-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .gif-cell {
    border: 0;
    aspect-ratio: 1;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 10px 6px;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    overflow: hidden;
  }
  .gif-emoji {
    font-size: 30px;
    margin-top: 8px;
  }
  .gif-caption {
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
  }
  .panel-bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-top: 1px solid rgba(91, 114, 94, 0.14);
  }
  .bottom-tabs {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .bottom-tab,
  .bottom-icon-btn {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #5b725e;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .bottom-tab.active {
    background: rgba(91, 114, 94, 0.18);
    color: #2c4a30;
  }
  .gif-badge-icon {
    border: 1.8px solid currentColor;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 800;
    padding: 2px 3px;
    line-height: 1;
  }
</style>
