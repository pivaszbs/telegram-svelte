# Telegram Svelte

An independent Telegram browser client built with Svelte 5.

## Run real login locally

Requires Node.js 22.15 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Register your own Telegram application at [my.telegram.org/apps](https://my.telegram.org/apps), then enter its API ID and API hash in the setup screen. Keep authentication codes and passwords in the app, never in GitHub issues or chat.

You can also load app credentials from an ignored local file:

```sh
cp .env.example .env.local
```

Fill in `TELEGRAM_API_ID` and `TELEGRAM_API_HASH`, then restart the development server. A browser client necessarily exposes app credentials in its delivered code; this file keeps them out of version control, rather than hiding them from the browser.

The client uses [@mtcute/web](https://mtcute.dev/guide/intro/sign-in) to connect directly to Telegram over WebSocket. The active login flow does not use the old bundled protocol implementation or its shared app credentials.

Supported flows:

- QR login by default, with automatic token refresh and a phone-login fallback. Scan with Telegram → Settings → Devices → Link Desktop Device.
- Existing-account phone login with the delivery method selected by Telegram, including Telegram app, SMS, call and existing email codes.
- Two-step verification passwords, with optional password hints.
- Invalid and expired codes, resend delays, duplicate-submission protection and Telegram rate limits.
- Session restore and server-side logout.

Passkey login is unavailable to unofficial clients under [Telegram’s current passkey rules](https://core.telegram.org/api/passkeys).

New-account registration, email-address setup, Firebase verification, payment and CAPTCHA challenges are not implemented. Such challenges show an explanation instead of an unusable code screen.

After authorization, the app displays the account confirmed by Telegram and a sign-out button. The legacy chat screens are retained in source but are not connected to the new session yet. This PR is the authentication milestone.

## Session storage

The protocol client uses in-memory storage. After successful authorization, the app explicitly exports its session into this browser's localStorage when "Keep me signed in" is checked, or sessionStorage when unchecked. QR login remembers the session by default. Phone login offers a “Keep me signed in” checkbox. Codes and passwords are never persisted. Treat a saved session as an account credential: scripts on the same origin can read browser storage.

App credentials entered in the setup screen follow the same storage preference. Offline restore preserves saved sessions; revoked or invalid sessions are cleared. Sign out revokes the current session on Telegram and clears both browser session locations. If server logout fails, the UI retains the session and lets you retry. When offline during restore, "Remove saved session" only removes the local copy; revoke it separately under Telegram Settings → Devices.

## Try the recorded sample flow

```sh
npm run dev:ui
```

Open http://127.0.0.1:5174. The page is marked as a preview and uses a test-only transport. No SMS is sent and no account is accessed.

1. Choose “Log in by phone number”, then enter `+447700900123` and request a code.
2. Enter `12345` to reach the password screen.
3. Enter `preview-password` to view the sample account confirmation.
4. Sign out, or reload to test session restore.

Other sample codes are `11111` for an invalid code, `33333` for an expired code, and `22222` for sign-in without a password.

## Validation

```sh
npm test
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests exercise the real authentication state machine with an injected transport. Browser tests exercise the actual screens and session storage with the sample transport, and initialize the real @mtcute/web client, WebCrypto and bundled WASM without contacting Telegram. These tests do not claim a verified production-account sign-in.

The login layout follows Telegram Web A, with dark and light themes, a country picker and layouts checked down to 320px wide. The supplied contest mockups cover chat folders and media panels; those will guide the chat milestone.

Browser tests also decode the styled QR with its logo to catch rendering changes that make it unscannable. They save screenshots and short recordings. `npx playwright show-report` opens the report. GitHub Actions uploads that report, recordings, screenshots and the production build as downloadable artifacts for 14 days.

The component check still reports warnings in legacy screens that are not part of the active login UI. It does not type-check the legacy JavaScript Telegram implementation.

## Build and migration

`npm run build` writes production assets to `build/`. Serve them over HTTPS outside localhost because authentication uses WebCrypto. With environment credentials supplied, the build includes those app credentials and should be distributed only as intended for that application.

The Svelte migration uses Svelte 5.57.2 and `mount`. New authentication components use runes. Older screens retain the syntax supported by Svelte 5. See the [Svelte migration guide](https://svelte.dev/docs/svelte/v5-migration-guide).
