<script>
  import { onMount, tick } from 'svelte';
  import { auth, initializeAuth, isPreview } from '../services/auth';
  import logo from 'images/logo.png';
  import countries from '../stores/countries.json';
  import { renderQr } from '../services/auth/qr-code.mjs';
  let theme = $state('dark');
  let selectedCountry = $state('');
  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const preferred = ['GB', 'US', 'RU', 'NO', 'AU', 'FI'];
  const countryPrefixes = [...countries].sort((a, b) => b.code.length - a.code.length || Number(preferred.includes(b.alpha)) - Number(preferred.includes(a.alpha)));
  let country = $derived.by(() => {
    const digits = phone.replace(/\D/g, '');
    const match = countryPrefixes.find(item => digits.startsWith(item.code));
    const selected = countries.find(item => item.alpha === selectedCountry);
    return selected && digits.startsWith(selected.code) && selected.code.length === match?.code.length ? selected.alpha : match?.alpha || '';
  });
  function selectCountry(event) {
    const selected = countries.find(item => item.alpha === event.currentTarget.value);
    if (selected) { selectedCountry = selected.alpha; phone = `+${selected.code} `; tick().then(() => focusTarget?.focus()); }
  }
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('telegram-svelte:theme', theme); } catch {}
  }
  let apiId = $state('');
  let apiHash = $state('');
  let phone = $state('');
  let code = $state('');
  let password = $state('');
  let remember = $state(true);
  let showPassword = $state(false);
  let qrImage = $state('');
  let qrImageError = $state(false);
  let lastStep;
  let clock = $state(Date.now());
  let focusTarget = $state();
  const titles = { qr: 'Log in to Telegram by QR Code', setup: 'Connect your Telegram app', phone: 'Telegram', code: 'Check your Telegram', password: 'Two-step verification', account: 'You’re signed in', restore: 'Welcome back' };
  const delivery = { app: 'Telegram sent a code to your Telegram app on another device.', sms: 'Telegram sent a code by SMS.', call: 'Telegram will call you with the code.', email: 'Telegram sent a code to your registered email address.', fragment: 'Check Fragment for your login code.', sms_word: 'Enter the word from Telegram’s SMS.', sms_phrase: 'Enter the phrase from Telegram’s SMS.', flash_call: 'Enter the requested digits from the incoming phone number.', missed_call: 'Enter the requested digits from the missed call number.' };
  let remaining = $derived(Math.max(0, Math.ceil(($auth.resendAt - clock) / 1000)));
  let rateLimited = $derived(clock < $auth.retryAt);
  let numericCode = $derived(!['sms_word', 'sms_phrase'].includes($auth.delivery));
  onMount(() => {
    try { if (localStorage.getItem('telegram-svelte:theme') === 'light') theme = 'light'; } catch {}
    initializeAuth();
    const timer = setInterval(() => { clock = Date.now(); }, 1000);
    return () => { clearInterval(timer); auth.destroy(); };
  });
  $effect(() => {
    const step = $auth.step;
    if (step === lastStep) return;
    lastStep = step;
    // Drop passwords and verification codes whenever a challenge changes.
    code = ''; password = ''; showPassword = false;
    tick().then(() => focusTarget?.focus());
  });
  $effect(() => {
    if ($auth.step === 'qr' && $auth.qrStatus === 'idle' && !$auth.busy) auth.startQr(remember);
  });
  $effect(() => {
    const url = $auth.qrUrl;
    let active = true;
    qrImage = ''; qrImageError = false;
    if (url) import('qrcode').then(module => renderQr(module.default, url))
      .then(value => { if (active) qrImage = value; })
      .catch(() => { if (active) qrImageError = true; });
    return () => { active = false; };
  });
  async function submit() {
    if ($auth.busy || rateLimited) return;
    if ($auth.step === 'setup') auth.configure({ apiId, apiHash }, remember);
    else if ($auth.step === 'phone') await auth.sendCode(phone, remember);
    else if ($auth.step === 'code') { await auth.verifyCode(code); code = ''; }
    else if ($auth.step === 'password') { const value = password; password = ''; await auth.verifyPassword(value); }
  }
</script>

<main class="auth-shell" class:light={theme === 'light'}>
  <button class="theme-toggle" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onclick={toggleTheme}>
    {#if theme === 'dark'}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>{:else}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/></svg>{/if}
  </button>
  <section class="auth-card" class:qr-card={$auth.step === 'qr'} class:phone-card={$auth.step === 'phone'} aria-labelledby="auth-title" aria-busy={$auth.busy}>
    {#if isPreview}<div class="preview-badge">Preview · sample data · no SMS is sent</div>{/if}
    {#if $auth.step === 'qr'}
      <div class="qr-frame" aria-label="Telegram login QR code">
        {#if qrImage && clock < $auth.qrExpires}
          <img class="qr-image" src={qrImage} alt="Scan this QR code with Telegram on your phone" />
          <img class="qr-logo" src={logo} alt="" />
        {:else}
          <div class="qr-placeholder" role="status">{qrImageError ? 'Could not display the QR code. Try phone login.' : $auth.qrStatus === 'scanned' ? 'Confirming your login…' : $auth.qrStatus === 'error' ? 'Unable to load a QR code' : 'Loading a fresh QR code…'}</div>
        {/if}
      </div>
    {:else}<img class="auth-logo" src={logo} alt="" width="88" height="88" />{/if}
    <h1 id="auth-title">{titles[$auth.step]}</h1>
    {#if $auth.notice}<p class="notice" role="status">{$auth.notice}</p>{/if}
    {#if $auth.step === 'qr'}
      <ol class="qr-steps">
        <li><span>1</span><div>Open Telegram on your phone</div></li>
        <li><span>2</span><div>Go to <strong>Settings</strong> &gt; <strong>Devices</strong> &gt; <strong>Add Device</strong></div></li>
        <li><span>3</span><div>Point your phone at this screen to confirm login</div></li>
      </ol>

      {#if $auth.qrStatus === 'error'}<button class="primary" disabled={$auth.busy || rateLimited} onclick={() => auth.startQr(remember)}>Try QR login again</button>{/if}
      <button class="qr-fallback" disabled={$auth.busy} onclick={() => auth.usePhone()}>Log in by phone number</button>
      <details class="login-options"><summary aria-label="Login options"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="15" cy="17" r="3" fill="var(--bg)"/></svg></summary><label class="remember"><input type="checkbox" bind:checked={remember} disabled={$auth.busy} onchange={() => auth.setRemember(remember)} /> Keep me signed in on this device</label>{#if !isPreview}<button class="link" disabled={$auth.busy} onclick={() => auth.changeApp()}>Change API credentials</button>{/if}</details>
    {:else if $auth.step === 'account'}
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
          <p class="muted">Please confirm your country code and enter your phone number.</p>
          <div class="country-field"><label for="auth-country">Country</label><select id="auth-country" value={country} onchange={selectCountry} disabled={$auth.busy}><option value="" disabled>Select your country</option>{#each countries as item}<option value={item.alpha}>{String.fromCodePoint(...[...item.alpha].map(char => 127397 + char.charCodeAt(0)))} {countryNames.of(item.alpha) || item.name}</option>{/each}</select><span aria-hidden="true">⌄</span></div>
          <div class="phone-field"><label for="auth-phone">Phone number</label>
          <input bind:this={focusTarget} id="auth-phone" type="tel" bind:value={phone} placeholder="+" autocomplete="tel" required disabled={$auth.busy} /></div>
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
        {#if $auth.step !== 'phone' || phone.replace(/\D/g, '').length >= 7}<button class="primary" type="submit" disabled={$auth.busy || rateLimited}>{$auth.busy ? 'Connecting…' : $auth.step === 'setup' ? 'Continue' : $auth.step === 'phone' ? 'Send login code' : 'Sign in'}</button>{/if}
      </form>
      {#if $auth.step === 'phone'}<button class="link" disabled={$auth.busy} onclick={() => auth.useQr(remember)}>Log in by QR code</button>{/if}
      {#if $auth.step === 'phone' && !isPreview}
        <details class="login-options"><summary aria-label="Login options"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="15" cy="17" r="3" fill="var(--bg)"/></svg></summary><button class="link" disabled={$auth.busy} onclick={() => auth.changeApp()}>Change API credentials</button></details>
      {/if}
      {#if ['code', 'password'].includes($auth.step)}
        <button class="link" disabled={$auth.busy} onclick={() => auth.back()}>Use another phone number</button>
      {/if}
      {#if $auth.step === 'code'}
        <button class="link" disabled={$auth.busy || rateLimited || remaining > 0 || $auth.nextType === 'none'} onclick={() => auth.resend()}>{remaining > 0 ? `Request another code in ${remaining}s` : $auth.nextType === 'none' ? 'No other delivery method available yet' : 'Request another code'}</button>
      {/if}
    {/if}
    {#if $auth.error}<p class="error" role="alert">{$auth.error}</p>{/if}
  </section>
</main>

<style>
  .auth-shell { --bg: #212121; --text: #fff; --muted: #aaa; --accent: #8774e1; --border: #545454; --hover: #2c2c2c; --error: #ff8d8d; height: 100dvh; min-height: 100dvh; background: var(--bg); color: var(--text); padding: 108px 24px 32px; box-sizing: border-box; overflow: auto; color-scheme: dark; }
  .auth-shell :global(*) { font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .auth-shell.light { --bg: #fff; --text: #000; --muted: #707579; --accent: #3390ec; --border: #dadce0; --hover: #f4f4f5; --error: #c53939; color-scheme: light; }
  .auth-shell:has(.qr-card) { padding-top: 64px; }
  .auth-card { width: min(100%, 360px); margin: 0 auto; text-align: center; }
  .qr-card { width: min(100%, 304px); }
  .qr-frame { width: min(280px, 100%); aspect-ratio: 1; margin: 0 auto 28px; position: relative; border-radius: 26px; background: #fff; overflow: hidden; }
  .qr-image { width: 100%; height: 100%; display: block; }
  .qr-logo { position: absolute; width: 22%; height: 22%; left: 39%; top: 39%; border: 5px solid white; background: white; border-radius: 50%; box-sizing: border-box; }
  .qr-placeholder { height: 100%; display: grid; place-items: center; padding: 28px; box-sizing: border-box; color: #707579; font-size: 14px; line-height: 1.5; }
  .qr-steps { list-style: none; text-align: left; margin: 20px 0 40px; padding: 0; }
  .qr-steps li { display: flex; align-items: start; gap: 14px; font-size: 16px; line-height: 21px; margin: 18px 0; }
  .qr-steps li > span { display: grid; place-items: center; background: var(--accent); color: white; width: 22px; height: 22px; font-size: 14px; border-radius: 50%; flex-shrink: 0; }
  .qr-steps strong { font-weight: 500; }
  .qr-fallback { width: 100%; min-height: 48px; border-radius: 10px; background: transparent; color: var(--accent); padding: 12px 8px; font-size: 14px; font-weight: 500; text-transform: uppercase; }
  .qr-fallback:hover, .link:hover, .theme-toggle:hover { background: var(--hover); }
  .auth-logo { background: white; border-radius: 50%; width: 160px; height: 160px; margin-bottom: 44px; }
  h1 { color: var(--text); font-size: 30px; font-weight: 500; line-height: 1.25; margin: 0 0 14px; }
  .qr-card h1 { font-size: 20px; font-weight: 500; white-space: nowrap; }
  h2 { font-size: 24px; font-weight: 500; color: var(--text); }
  .muted { font-size: 16px; line-height: 22px; color: var(--muted); margin-bottom: 32px; }
  a { color: var(--accent); }
  form { margin-top: 12px; }
  label:not(.remember) { display: block; text-align: left; color: var(--muted); font-size: 13px; margin: 18px 0 7px; }
  input:not([type='checkbox']), select { width: 100%; height: 54px; box-sizing: border-box; border: 1px solid var(--border); padding: 14px 16px; border-radius: 12px; font: inherit; font-size: 16px; background: var(--bg); color: var(--text); transition: border-color .15s; }
  input:not([type='checkbox']):focus { border: 2px solid var(--accent); padding: 13px 15px; outline: none; }
  input:focus-visible, select:focus-visible, button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .country-field, .phone-field { position: relative; margin-top: 24px; }
  .country-field { margin-top: 48px; }
  .country-field label, .phone-field label { position: absolute; z-index: 1; top: -9px; left: 16px; background: var(--bg); padding: 0 5px; margin: 0; font-weight: 400; }
  .phone-field:focus-within label { color: var(--accent); }
  select { appearance: none; cursor: pointer; padding-right: 40px; }
  .country-field > span { pointer-events: none; position: absolute; right: 16px; top: 12px; font-size: 24px; color: var(--muted); }
  .remember { display: flex; gap: 24px; align-items: center; text-align: left; font-size: 16px; color: var(--text); margin: 18px 0 0; padding: 14px 18px; border-radius: 12px; line-height: 22px; cursor: pointer; }
  .remember:hover { background: var(--hover); }
  input[type='checkbox'] { width: 20px; height: 20px; accent-color: var(--accent); flex-shrink: 0; cursor: pointer; }
  button { cursor: pointer; font: inherit; border: 0; }
  button:disabled { opacity: .5; cursor: default; }
  .primary { width: 100%; min-height: 54px; background: var(--accent); color: white; border-radius: 12px; padding: 16px; font-size: 14px; font-weight: 500; text-transform: uppercase; margin-top: 24px; }
  .primary:hover:not(:disabled) { filter: brightness(1.08); }
  .link { display: block; width: 100%; min-height: 48px; border-radius: 10px; background: transparent; color: var(--accent); font-size: 14px; padding: 12px 8px; margin: 12px auto 0; }
  .phone-card form + .link { text-transform: uppercase; margin-top: 40px; }
  .phone-number { font-size: 20px; color: var(--text); font-weight: 500; margin: 12px 0 32px; }
  .error { margin-top: 20px; padding: 12px; border: 1px solid var(--error); border-radius: 12px; color: var(--error); font-size: 14px; line-height: 1.5; }
  .notice { margin: 16px 0; padding: 12px; border-radius: 12px; background: var(--hover); font-size: 14px; line-height: 1.5; color: var(--muted); }
  .hint { color: var(--muted); font-size: 14px; margin: 12px 0; }
  .password-row { position: relative; }
  .password-row input { padding-right: 68px; }
  .password-row input:focus { padding-right: 67px; }
  .show { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--accent); background: var(--bg); font-size: 13px; padding: 8px; }
  .preview-badge { position: fixed; top: 12px; left: 12px; max-width: calc(100% - 80px); font-size: 11px; color: var(--muted); background: var(--hover); border-radius: 20px; padding: 7px 10px; z-index: 2; }
  .account-avatar { width: 80px; height: 80px; margin: 32px auto 20px; display: grid; place-items: center; border-radius: 50%; color: white; background: var(--accent); font-size: 36px; }
  .connected { color: #4fbd95; font-size: 14px; margin: 24px 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .connected span { width: 8px; height: 8px; border-radius: 50%; background: #4fbd95; }
  .account-note { font-size: 14px; }
  .login-options { margin-top: 20px; color: var(--muted); font-size: 12px; }
  summary { display: inline-grid; place-items: center; cursor: pointer; padding: 10px; border-radius: 50%; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary:hover { background: var(--hover); }
  summary svg { width: 22px; height: 22px; }
  .login-options .remember { font-size: 14px; gap: 12px; }
  .login-options .link { font-size: 12px; }
  .theme-toggle { position: fixed; z-index: 3; right: 16px; top: 12px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; color: var(--muted); background: transparent; }
  .theme-toggle svg { width: 24px; height: 24px; }
  @media (max-width: 480px) { .auth-shell { padding-top: 72px; } .auth-logo { width: 120px; height: 120px; margin-bottom: 28px; } .qr-steps { margin-bottom: 32px; } }
  @media (max-width: 350px) { .qr-card h1 { font-size: 18px; white-space: normal; } .qr-steps li { font-size: 15px; } }
  @media (prefers-reduced-motion: reduce) { .auth-shell :global(*) { transition: none; } }
</style>
