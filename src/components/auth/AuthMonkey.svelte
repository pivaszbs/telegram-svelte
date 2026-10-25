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
  let currentFrame = 0;
  let targetFrame = 0;
  let rafId = 0;
  let hadPeeked = false;

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function stopStepper() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function animateToFrame(nextTarget, speed = 2.5) {
    targetFrame = nextTarget;
    if (!anim) return;
    if (Math.abs(currentFrame - targetFrame) < 0.5) {
      currentFrame = targetFrame;
      anim.goToAndStop(currentFrame, true);
      stopStepper();
      return;
    }
    if (rafId) return;
    const tickFrame = () => {
      if (!anim) {
        rafId = 0;
        return;
      }
      const diff = targetFrame - currentFrame;
      if (Math.abs(diff) <= speed) {
        currentFrame = targetFrame;
        anim.goToAndStop(currentFrame, true);
        rafId = 0;
        return;
      }
      currentFrame += Math.sign(diff) * speed;
      anim.goToAndStop(Math.round(currentFrame), true);
      rafId = requestAnimationFrame(tickFrame);
    };
    rafId = requestAnimationFrame(tickFrame);
  }

  function mountClip(name, data, loop = false, autoplay = false, initialFrame = 0) {
    if (!container) return null;
    if (anim && currentClip === name) return anim;
    stopStepper();
    if (anim) {
      anim.destroy();
      anim = null;
    }
    currentClip = name;
    currentFrame = initialFrame;
    targetFrame = initialFrame;
    anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop,
      autoplay,
      animationData: cloneData(data),
    });
    if (!autoplay) {
      anim.goToAndStop(initialFrame, true);
    }
    return anim;
  }

  onMount(() => {
    return () => {
      stopStepper();
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
        const span = Math.max(5, maxCodeLength || 5);
        const ratio = Math.min(1, codeLength / span);
        const nextFrame = Math.round(20 + ratio * 130);
        const wasTracking = currentClip === 'tracking';
        mountClip('tracking', monkeyTracking, false, false, wasTracking ? currentFrame : 15);
        animateToFrame(nextFrame, 3.5);
      } else {
        mountClip('idle', monkeyIdle, true, true, 0);
      }
    } else if (step === 'password') {
      if (showPassword) {
        hadPeeked = true;
        mountClip('peek', monkeyPeek, false, false, 0);
        animateToFrame(15, 2);
      } else if (hadPeeked) {
        mountClip('peek', monkeyPeek, false, false, 15);
        animateToFrame(32, 2);
      } else {
        mountClip('close', monkeyClose, false, false, 0);
        animateToFrame(50, 3);
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
