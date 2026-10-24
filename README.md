# Telegram Svelte

An open-source Telegram web client written in Svelte.

## Development

Requires Node.js 22.15 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Build the production files with `npm run build`; output is written to `build/`.

## Try the UI without a Telegram account

```sh
npm run dev:ui
```

Open http://127.0.0.1:5174. This runs the existing login screens against the same fake API used by the browser tests. Enter a sample phone number to move to the code screen. No SMS is sent and this mode cannot sign into a real account.

Use `npm run dev` on port 5173 for the original Telegram integration. Live authentication has not been validated against the current API.

## Svelte 5 migration

The app uses Svelte 5.57.2 and the `mount` API. Existing components retain their legacy syntax, including stores, reactive statements, slots and component events. Svelte 5 supports these APIs, so converting components to runes can happen separately. See the [official migration guide](https://svelte.dev/docs/svelte/v5-migration-guide).

The build now uses Webpack 5, the current Svelte loader and preprocessor, and Dart Sass instead of the unsupported native `node-sass` dependency. SMUI Ripple is updated to its Svelte 5 generation. The committed npm lockfile records the resolved dependency versions.

## Validation

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
```

The component check reports existing accessibility and unused CSS warnings. It does not type-check the legacy JavaScript Telegram implementation.

Browser tests run the actual login components, styles, stores and routing against a test-only API replacement on port 5174. They cover initial mounting, checkbox changes, phone input, the code-screen transition, and opening and closing the country popup. They do not sign into Telegram or validate current MTProto compatibility.

Browser tests also save desktop screenshots and short videos. `npx playwright show-report` opens the local report. Pull requests run the same checks in GitHub Actions and publish the report, recordings and production build as downloadable artifacts.

The existing Telegram service and its configuration are unchanged by this migration. Live authentication, API modernization and chat improvements are separate work.
