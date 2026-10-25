import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { sveltePreprocess } from 'svelte-preprocess';
import { sveltekit } from '@sveltejs/kit/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local'), quiet: true });

const isPreview = Boolean(process.env.UI_PREVIEW);
const isSetupTest = Boolean(process.env.UI_SETUP_TEST);

function inlineSvgPlugin() {
  const inlineDir = path.resolve(__dirname, 'src/assets/inline') + path.sep;
  return {
    name: 'telegram-svelte-inline-svg',
    enforce: 'pre',
    load(id) {
      const cleanId = id.split('?')[0];
      if (cleanId.startsWith(inlineDir) && cleanId.endsWith('.svg')) {
        const raw = fs.readFileSync(cleanId, 'utf8');
        return `export default ${JSON.stringify(raw)};`;
      }
      return null;
    },
  };
}

function fakeTransportPlugin() {
  return {
    name: 'telegram-svelte-fake-transport',
    enforce: 'pre',
    resolveId(source) {
      if ((isPreview || isSetupTest) && source === './telegram-transport.js') {
        return path.resolve(__dirname, 'tests/fixtures/auth-transport.js');
      }
      return null;
    },
  };
}

export default {
  cacheDir: isSetupTest
    ? 'node_modules/.vite-setup'
    : isPreview
      ? 'node_modules/.vite-preview'
      : 'node_modules/.vite',
  plugins: [
    inlineSvgPlugin(),
    fakeTransportPlugin(),
    sveltekit({
      preprocess: sveltePreprocess({ scss: true, typescript: false }),
      files: {
        assets: 'public',
      },
      adapter: {
        name: 'telegram-svelte-build-adapter',
        async adapt(builder) {
          const out = path.resolve(__dirname, 'build');
          builder.rimraf(out);
          builder.mkdirp(out);
          builder.writeClient(out);
          builder.writePrerendered(out);
          await builder.generateFallback(path.join(out, 'index.html'));
        },
      },
    }),
  ],
  define: {
    __UI_PREVIEW__: JSON.stringify(isPreview),
    __TELEGRAM_API_ID__: JSON.stringify(
      isPreview ? '123456' : isSetupTest ? '' : process.env.TELEGRAM_API_ID || ''
    ),
    __TELEGRAM_API_HASH__: JSON.stringify(
      isPreview
        ? '0123456789abcdef0123456789abcdef'
        : isSetupTest
          ? ''
          : process.env.TELEGRAM_API_HASH || ''
    ),
  },
  resolve: {
    alias: {
      Source: path.resolve(__dirname, 'src'),
      images: path.resolve(__dirname, 'src/assets/images'),
      inline: path.resolve(__dirname, 'src/assets/inline'),
      'real-auth-transport': path.resolve(__dirname, 'src/services/auth/telegram-transport.js'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, 'src/theme'), path.resolve(__dirname, 'node_modules')],
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mtcute/web', '@mtcute/wasm'],
  },
  ssr: {
    noExternal: ['cookie'],
  },
  server: {
    host: '127.0.0.1',
    port: isSetupTest ? 5175 : isPreview ? 5174 : 5173,
    strictPort: true,
    fs: {
      allow: [__dirname],
    },
  },
};
