<script>
  import { onMount, tick } from 'svelte';
  import { auth, initializeAuth, isPreview } from '../services/auth';
  import logo from 'images/logo.png';
  let apiId = $state('');
  let apiHash = $state('');
  let phone = $state('');
  let code = $state('');
  let password = $state('');
  let remember = $state(true);
  let showPassword = $state(false);
  let clock = $state(Date.now());
  let focusTarget = $state();
  const titles = { setup: 'Connect your Telegram app', phone: 'Sign in to Telegram', code: 'Check your Telegram', password: 'Two-step verification', account: 'You’re signed in', restore: 'Welcome back' };
  const delivery = { app: 'Telegram sent a code to your Telegram app on another device.', sms: 'Telegram sent a code by SMS.', call: 'Telegram will call you with the code.', email: 'Telegram sent a code to your registered email address.', fragment: 'Check Fragment for your login code.', sms_word: 'Enter the word from Telegram’s SMS.', sms_phrase: 'Enter the phrase from Telegram’s SMS.', flash_call: 'Enter the requested digits from the incoming phone number.', missed_call: 'Enter the requested digits from the missed call number.' };
  let remaining = $derived(Math.max(0, Math.ceil(($auth.resendAt - clock) / 1000)));
  let rateLimited = $derived(clock < $auth.retryAt);
  let numericCode = $derived(!['sms_word', 'sms_phrase'].includes($auth.delivery));
  onMount(() => {
    initializeAuth();
    const timer = setInterval(() => { clock = Date.now(); }, 1000);
    return () => { clearInterval(timer); auth.destroy(); };
  });
  $effect(() => {
    const step = $auth.step;
    // Drop passwords and verification codes whenever a challenge changes.
    code = ''; password = ''; showPassword = false;
    tick().then(() => focusTarget?.focus());
  });
  async function submit() {
    if ($auth.busy || rateLimited) return;
    if ($auth.step === 'setup') auth.configure({ apiId, apiHash }, remember);
    else if ($auth.step === 'phone') await auth.sendCode(phone, remember);
    else if ($auth.step === 'code') { await auth.verifyCode(code); code = ''; }
    else if ($auth.step === 'password') { const value = password; password = ''; await auth.verifyPassword(value); }
  }
</script>

<main class="auth-shell">
  <section class="auth-card" aria-labelledby="auth-title" aria-busy={$auth.busy}>
    {#if isPreview}<div class="preview-badge">Preview · sample data · no SMS is sent</div>{/if}
    <img class="auth-logo" src={logo} alt="" width="88" height="88" />
    <h1 id="auth-title">{titles[$auth.step]}</h1>
    {#if $auth.notice}<p class="notice" role="status">{$auth.notice}</p>{/if}
    {#if $auth.step === 'account'}
      <div class="account-avatar" aria-hidden="true">{$auth.user.displayName?.[0] || 'T'}</div>
      <h2>{$auth.user.displayName}</h2>
      {#if $auth.user.username}<p class="muted">@{$auth.user.username}</p>{/if}
      <div class="connected"><span></span>{isPreview ? 'Sample account confirmed' : 'Telegram verified this account'}</div>
      <p class="muted account-note">Your login is ready. The chat screens will connect to this session in the next update.</p>
      <button class="primary" onclick={() => auth.logout()} disabled={$auth.busy}>{$auth.busy ? 'Signing out…' : 'Sign out'}</button>
    {:else if $auth.step === 'restore'}
      <p class="muted">Restoring your saved Telegram session.</p>
      {#if !$auth.busy}
        <button class="primary" onclick={() => auth.restore()}>Retry connection</button>
        <button class="link" onclick={() => auth.forget()}>Remove saved session from this browser</button>
      {:else}<p role="status" class="muted">Connecting…</p>{/if}
    {:else}
      <form onsubmit={event => { event.preventDefault(); submit(); }}>
        {#if $auth.step === 'setup'}
          <p class="muted">Create an application at <a href="https://my.telegram.org/apps" target="_blank" rel="noreferrer">my.telegram.org</a>, then enter its API credentials here. They are used here to connect directly to Telegram.</p>
          <label for="api-id">API ID</label>
          <input bind:this={focusTarget} id="api-id" bind:value={apiId} inputmode="numeric" required autocomplete="off" disabled={$auth.busy} />
          <label for="api-hash">API hash</label>
          <input id="api-hash" type="password" bind:value={apiHash} required autocomplete="off" spellcheck="false" disabled={$auth.busy} />
        {:else if $auth.step === 'phone'}
          <p class="muted">Enter the phone number linked to your existing Telegram account, including its country code.</p>
          <label for="auth-phone">Phone number</label>
          <input bind:this={focusTarget} id="auth-phone" type="tel" bind:value={phone} placeholder="+44 7700 900123" autocomplete="tel" required disabled={$auth.busy} />
        {:else if $auth.step === 'code'}
          <p class="muted">{delivery[$auth.delivery]}</p>
          <p class="phone-number">{$auth.phone}</p>
          <label for="auth-code">{$auth.codeLength ? `${$auth.codeLength}-character login code` : 'Login code'}</label>
          <input bind:this={focusTarget} id="auth-code" bind:value={code} inputmode={numericCode ? 'numeric' : 'text'} autocomplete="one-time-code" spellcheck="false" required disabled={$auth.busy} />
        {:else if $auth.step === 'password'}
          <p class="muted">Your account is protected with a two-step verification password.</p>
          {#if $auth.hint}<p class="hint">Hint: {$auth.hint}</p>{/if}
          <label for="auth-password">Password</label>
          <div class="password-row"><input bind:this={focusTarget} id="auth-password" type={showPassword ? 'text' : 'password'} bind:value={password} autocomplete="current-password" required disabled={$auth.busy} /><button class="show" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onclick={() => showPassword = !showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div>
        {/if}
        {#if ['setup', 'phone'].includes($auth.step)}<label class="remember"><input type="checkbox" bind:checked={remember} disabled={$auth.busy} /> Keep me signed in on this device</label>{/if}
        <button class="primary" type="submit" disabled={$auth.busy || rateLimited}>{$auth.busy ? 'Connecting…' : $auth.step === 'setup' ? 'Continue' : $auth.step === 'phone' ? 'Send login code' : 'Sign in'}</button>
      </form>
      {#if $auth.step === 'phone' && !isPreview}
        <button class="link" disabled={$auth.busy} onclick={() => auth.changeApp()}>Change API credentials</button>
      {/if}
      {#if ['code', 'password'].includes($auth.step)}
        <button class="link" disabled={$auth.busy} onclick={() => auth.back()}>Use another phone number</button>
      {/if}
      {#if $auth.step === 'code'}
        <button class="link" disabled={$auth.busy || rateLimited || remaining > 0 || $auth.nextType === 'none'} onclick={() => auth.resend()}>{remaining > 0 ? `Request another code in ${remaining}s` : $auth.nextType === 'none' ? 'No other delivery method available yet' : 'Request another code'}</button>
      {/if}
    {/if}
    {#if $auth.error}<p class="error" role="alert">{$auth.error}</p>{/if}
    <footer>Telegram Svelte · independent client</footer>
  </section>
</main>

<style>
  .auth-shell { min-height: 100dvh; display: grid; place-items: center; background: #f5f7fa; padding: 24px 16px; box-sizing: border-box; overflow: auto; }
  .auth-card { width: min(100%, 400px); box-sizing: border-box; padding: 32px; border-radius: 24px; background: white; box-shadow: 0 12px 48px #1a416b0b; text-align: center; }
  .auth-logo { width: 88px; height: 88px; margin-bottom: 24px; }
  h1 { color: #192e42; font-size: 26px; line-height: 1.25; letter-spacing: -.6px; margin-bottom: 14px; }
  h2 { font-size: 22px; color: #192e42; }
  .muted { font-size: 14px; line-height: 1.6; color: #697a8b; margin-bottom: 20px; }
  a { color: #2589dd; }
  label:not(.remember) { display: block; text-align: left; color: #41566b; font-size: 13px; font-weight: 600; margin: 18px 0 7px; }
  input:not([type='checkbox']) { width: 100%; box-sizing: border-box; border: 1px solid #dce3eb; padding: 14px; border-radius: 10px; font: inherit; font-size: 16px; background: white; color: #1c3146; }
  input:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid #389ff5; outline-offset: 3px; }
  .remember { display: flex; gap: 10px; align-items: center; text-align: left; font-size: 13px; color: #65768a; margin: 20px 0; line-height: 1.5; cursor: pointer; }
  input[type='checkbox'] { width: 18px; height: 18px; accent-color: #379ff5; flex-shrink: 0; }
  button { cursor: pointer; font: inherit; border: 0; }
  button:disabled { opacity: .55; cursor: default; }
  .primary { width: 100%; background: #379ff5; color: white; border-radius: 10px; padding: 14px; font-weight: 600; margin-top: 18px; }
  .link { display: block; background: transparent; color: #2589dd; font-size: 13px; margin: 18px auto 0; }
  .phone-number { font-size: 15px; color: #41566b; font-weight: 600; margin: 10px 0; }
  .error { margin-top: 20px; padding: 12px; background: #fff1f1; border-radius: 10px; color: #a93838; font-size: 14px; line-height: 1.5; }
  .notice { margin: 16px 0; padding: 12px; border-radius: 10px; background: #f0f7ff; font-size: 13px; line-height: 1.5; color: #416888; }
  .hint { color: #65768a; font-size: 14px; margin: 12px 0; }
  .password-row { position: relative; }
  .password-row input { padding-right: 68px; }
  .show { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #2589dd; background: white; font-size: 13px; }
  .preview-badge { font-size: 11px; color: #687c91; background: #f0f5fa; border-radius: 20px; padding: 7px 10px; margin-bottom: 24px; }
  .account-avatar { width: 64px; height: 64px; margin: 24px auto 14px; display: grid; place-items: center; border-radius: 50%; color: #248cda; background: #edf6fe; font-size: 28px; }
  .connected { color: #338b66; font-size: 13px; margin: 20px 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .connected span { width: 7px; height: 7px; border-radius: 50%; background: #3eb785; }
  .account-note { font-size: 13px; }
  footer { margin-top: 28px; color: #93a0ae; font-size: 11px; }
  @media (max-width: 480px) { .auth-shell { background: white; align-items: start; padding-top: 32px; } .auth-card { padding: 20px; box-shadow: none; } }
</style>
