import './styles/app.css';
import App from './App.svelte';

// Ask the browser not to evict our storage (bundles + GNAT credentials);
// iOS/Safari eviction of idle PWAs is a documented project risk.
navigator.storage?.persist?.().catch(() => {});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
