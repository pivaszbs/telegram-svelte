<script>
  import { TGICO_PATHS } from './tgico-paths.mjs';

  let {
    name = 'folder',
    size = 24,
    class: className = '',
    title = '',
    ariaLabel = '',
  } = $props();

  let d = $derived(TGICO_PATHS[name] || TGICO_PATHS.folder);
</script>

<svg
  class={`tgico-svg tgico-${name} ${className}`.trim()}
  viewBox="0 0 1024 1024"
  width={size}
  height={size}
  aria-label={ariaLabel || undefined}
  aria-hidden={ariaLabel ? undefined : 'true'}
>
  {#if title}
    <title>{title}</title>
  {/if}
  <path transform="scale(1, -1) translate(0, -1024)" fill="currentColor" {d} />
</svg>

<style>
  .tgico-svg {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
    fill: currentColor;
  }
</style>
