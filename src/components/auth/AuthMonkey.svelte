<script>
  import { onMount } from 'svelte';
  import lottie from 'lottie-web';
  import monkeyIdle from '../../assets/animations/monkey-idle.json';
  import monkeyTracking from '../../assets/animations/monkey-tracking.json';
  import monkeyClose from '../../assets/animations/monkey-close.json';
  import monkeyPeek from '../../assets/animations/monkey-peek.json';

  let {
    step = 'code',
    codeLength = 0,
    maxCodeLength = 5,
    showPassword = false,
  } = $props();

  let container = $state();
  let anim = null;
  let currentClip = '';
  let lastTrackFrame = 20;
  let hadPeeked = false;

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function mountClip(name, data, loop = false, autoplay = false) {
    if (!container) return null;
    if (anim && currentClip === name) return anim;
    if (anim) {
      anim.destroy();
      anim = null;
    }
    currentClip = name;
    anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop,
      autoplay,
      animationData: cloneData(data),
    });
    return anim;
  }

  onMount(() => {
    return () => {
      if (anim) {
        anim.destroy();
        anim = null;
      }
    };
  });

  $effect(() => {
    if (!container) return;

    if (step === 'code') {
      hadPeeked = false;
      if (codeLength > 0) {
        const ratio = Math.min(1, codeLength / Math.max(1, maxCodeLength));
        const targetFrame = Math.round(20 + ratio * 140);
        const wasTracking = currentClip === 'tracking';
        const instance = mountClip('tracking', monkeyTracking, false, false);
        if (instance) {
          const fromFrame = wasTracking ? lastTrackFrame : 0;
          if (fromFrame === targetFrame) {
            instance.goToAndStop(targetFrame, true);
          } else {
            instance.playSegments([fromFrame, targetFrame], true);
          }
          lastTrackFrame = targetFrame;
        }
      } else {
        lastTrackFrame = 20;
        mountClip('idle', monkeyIdle, true, true);
      }
    } else if (step === 'password') {
      if (showPassword) {
        hadPeeked = true;
        const instance = mountClip('peek', monkeyPeek, false, false);
        instance?.playSegments([0, 15], true);
      } else if (hadPeeked) {
        const instance = mountClip('peek', monkeyPeek, false, false);
        instance?.playSegments([15, 32], true);
      } else {
        const instance = mountClip('close', monkeyClose, false, false);
        instance?.playSegments([0, 50], true);
      }
    }
  });
</script>

<div
  class="auth-monkey"
  bind:this={container}
  role="img"
  aria-label={step === 'password'
    ? showPassword
      ? 'Animated monkey peeking at password'
      : 'Animated monkey covering eyes'
    : 'Animated monkey watching code input'}
></div>

<style>
  .auth-monkey {
    width: 160px;
    height: 160px;
    margin: 0 auto 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    user-select: none;
  }
  .auth-monkey :global(svg) {
    width: 100% !important;
    height: 100% !important;
    transition: none !important;
    display: block;
  }
  @media (max-width: 480px) {
    .auth-monkey {
      width: 128px;
      height: 128px;
      margin-bottom: 20px;
    }
  }
</style>
