<script>
  import App from '../App.svelte';
  import '@fontsource/roboto/latin-400.css';
  import '@fontsource/roboto/latin-500.css';
  import '@fontsource/roboto/latin-700.css';
  import 'Source/assets/global.css';
  import 'Source/assets/global.scss';
  import { isPreview } from '../services/auth';

  if (typeof window !== 'undefined' && isPreview) {
    import('../../tests/fixtures/transport-smoke.js');
  }
</script>

<App />
