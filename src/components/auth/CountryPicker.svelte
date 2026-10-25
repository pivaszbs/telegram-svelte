<script>
  import { tick } from 'svelte';
  import countries from '../../stores/countries.json';
  let { value = '', disabled = false, onselect } = $props();
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const flag = alpha => String.fromCodePoint(...[...alpha].map(char => 127397 + char.charCodeAt(0)));
  const items = countries.filter(item => /^[1-9]\d*$/.test(item.code)).map(item => ({ ...item, label: names.of(item.alpha) || item.name, flag: flag(item.alpha) })).sort((a, b) => a.label.localeCompare(b.label, 'en'));
  const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  let root = $state();
  let input = $state();
  let open = $state(false);
  let query = $state(null);
  let active = $state(-1);
  let above = $state(false);
  let menuHeight = $state(380);
  function positionMenu() {
    const rect = root?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - 16;
    const availableAbove = rect.top - 16;
    above = below < 160 && availableAbove > below;
    menuHeight = Math.max(80, Math.min(380, above ? availableAbove : below));
  }
  const selected = $derived(items.find(item => item.alpha === value));
  const text = $derived(query ?? (selected ? `${selected.flag} ${selected.label}` : ''));
  const matches = $derived(items.filter(item => {
    const search = normalize(query || '');
    return !search || normalize(`${item.label} ${item.name} ${item.alpha}`).includes(search) || `+${item.code}`.startsWith(search) || item.code.startsWith(search);
  }));
  function close() { open = false; query = null; active = -1; }
  function show() { if (disabled) return; positionMenu(); open = true; query = null; active = -1; input?.select(); }
  function choose(item) { close(); onselect(item); }
  function outside(event) { if (open && !root?.contains(event.target)) close(); }
  function blur(event) { if (!root?.contains(event.relatedTarget)) close(); }
  async function keydown(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Tab') close();
    else if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      if (!open) { positionMenu(); open = true; query = null; }
      const count = matches.length;
      active = count ? (active + (event.key === 'ArrowDown' ? 1 : active < 0 ? 0 : -1) + count) % count : -1;
      await tick(); root?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      const item = matches[active] || (matches.length === 1 ? matches[0] : null);
      if (item) choose(item);
    }
  }
</script>

<svelte:window onpointerdown={outside} />
<div class="country-picker" bind:this={root} onfocusout={blur}>
  <label for="auth-country" class:focused={open}>Country</label>
  <input bind:this={input} id="auth-country" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="country-options" aria-activedescendant={open && active >= 0 ? `country-${matches[active]?.alpha}` : undefined} value={text} placeholder="" autocomplete="off" spellcheck="false" {disabled} onfocus={show} onclick={() => { if (!open) show(); }} onkeydown={keydown} oninput={event => { query = event.currentTarget.value; open = true; active = -1; }} />
  <button class="toggle" type="button" aria-label={open ? 'Close country list' : 'Open country list'} aria-expanded={open} tabindex="-1" {disabled} onpointerdown={event => event.preventDefault()} onclick={() => { if (open) close(); else { input?.focus(); show(); } }}><svg class:up={open} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg></button>
  {#if open}
    <div class="country-menu" class:above style:max-height={`${menuHeight}px`} id="country-options" role="listbox" aria-label="Countries">
      {#each matches as item, i (item.alpha)}
        <button id={`country-${item.alpha}`} class="country-option" type="button" role="option" aria-selected={item.alpha === value} data-active={i === active} tabindex="-1" onpointerdown={event => event.preventDefault()} onclick={() => choose(item)}><span class="flag" aria-hidden="true">{item.flag}</span><span class="name">{item.label}</span><span class="dial-code">+{item.code}</span></button>
      {:else}<p class="empty" role="status">No countries found</p>{/each}
    </div>
  {/if}
</div>

<style>
  .country-picker { position: relative; margin-top: 48px; text-align: left; }
  label { position: absolute; z-index: 1; top: -8px; left: 16px; background: var(--bg); padding: 0 5px; color: var(--muted); font-size: 12px; line-height: 16px; pointer-events: none; }
  label.focused { color: var(--accent); }
  .country-picker input { width: 100%; height: 48px; border: 1px solid var(--border); border-radius: 16px; padding: 12px 48px 12px 18px; background: var(--bg); color: var(--text); font: inherit; font-size: 16px; cursor: text; user-select: text; caret-color: var(--accent); }
  .country-picker input:hover { border-color: var(--muted); }
  .country-picker input:focus { outline: none; border: 2px solid var(--accent); padding: 11px 47px 11px 17px; }
  .country-picker input::placeholder { color: var(--muted); }
  .toggle { position: absolute; right: 4px; top: 4px; width: 40px; height: 40px; border: 0; border-radius: 50%; padding: 8px; cursor: pointer; background: transparent; color: var(--muted); }
  .toggle svg { width: 24px; height: 24px; display: block; transition: transform .15s; }
  .toggle svg.up { transform: rotate(180deg); }
  .country-menu { position: absolute; z-index: 10; top: calc(100% + 8px); width: 100%; max-height: min(380px, 45dvh); overflow: auto; overscroll-behavior: contain; padding: 8px 0; border-radius: 12px; background: var(--bg); box-shadow: 0 4px 12px #0005; }
  .country-menu.above { top: auto; bottom: calc(100% + 8px); }
  .country-option { display: flex; align-items: center; gap: 16px; width: 100%; min-height: 54px; border: 0; padding: 12px 16px; text-align: left; cursor: pointer; color: var(--text); background: transparent; font-size: 16px; line-height: 22px; }
  .country-option:hover, .country-option[data-active='true'] { background: var(--hover); }
  .flag { font-size: 24px; width: 28px; text-align: center; flex-shrink: 0; }
  .name { min-width: 0; flex: 1; }
  .dial-code { color: var(--muted); flex-shrink: 0; font-size: 14px; }
  .empty { padding: 18px 16px; margin: 0; color: var(--muted); font-size: 14px; }
  @media (max-height: 700px) { .country-picker { margin-top: 32px; } }
  @media (prefers-reduced-motion: reduce) { .toggle svg { transition: none; } }
</style>
