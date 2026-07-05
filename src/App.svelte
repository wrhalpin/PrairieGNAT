<script lang="ts">
  import { onMount } from 'svelte';
  import { saveBundleAsync, loadSettingsAsync } from '$lib/storage/db';
  import { parseBundle } from '$lib/stix/parser';
  import Library from '$lib/pages/Library.svelte';
  import BundleDetail from '$lib/pages/BundleDetail.svelte';
  import ObjectDetail from '$lib/pages/ObjectDetail.svelte';
  import SearchPage from '$lib/pages/SearchPage.svelte';
  import SettingsPage from '$lib/pages/SettingsPage.svelte';
  import PasteJsonPage from '$lib/pages/PasteJsonPage.svelte';
  import UrlFetchPage from '$lib/pages/UrlFetchPage.svelte';
  import FeedPage from '$lib/pages/FeedPage.svelte';

  type Route = 'library' | 'search' | 'settings' | 'bundle' | 'object' | 'paste' | 'url' | 'feed';

  let currentRoute: Route = 'library';
  let routeParams: Record<string, string> = {};
  let isDarkMode = false;
  let gnatMode = false;

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
  }

  function navigate(route: Route, params: Record<string, string> = {}) {
    currentRoute = route;
    routeParams = params;
    window.scrollTo(0, 0);
  }

  async function handleSharedFile(fileName: string, fileContent: string) {
    try {
      const bundleData = JSON.parse(fileContent);
      parseBundle(fileContent);
      if (typeof bundleData.id !== 'string' || !bundleData.id) {
        throw new Error('Bundle is missing its required "id" field');
      }
      await saveBundleAsync(bundleData.id, fileName, bundleData, 'share');
      navigate('bundle', { bundleId: bundleData.id });
    } catch (e) {
      console.error('Error processing shared file:', e);
      alert(`Error loading shared file: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // The service worker stashes share-target POSTs in a cache (see src/sw.ts),
  // because the POST is handled before this page exists to receive a message.
  async function consumeSharedBundle() {
    try {
      const cache = await caches.open('share-target');
      const response = await cache.match('/shared-bundle');
      if (!response) return;
      await cache.delete('/shared-bundle');
      const fileName = decodeURIComponent(response.headers.get('X-File-Name') || 'shared-bundle.json');
      await handleSharedFile(fileName, await response.text());
    } catch (e) {
      console.error('Error reading shared bundle:', e);
    }
  }

  onMount(async () => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else if (!savedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    }

    // Check if app was launched as share target
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') === '1') {
      window.history.replaceState(null, '', '/');
      await consumeSharedBundle();
    }

    // Load settings to check mode
    try {
      const settings = await loadSettingsAsync();
      gnatMode = settings.mode === 'gnat';
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  });
</script>

<svelte:window
  on:popstate={() => {
    const path = window.location.pathname;
    if (path === '/') navigate('library');
    else if (path.startsWith('/search')) navigate('search');
    else if (path.startsWith('/settings')) navigate('settings');
  }}
/>

<div class="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
  <main class="flex-1 overflow-auto">
    {#if currentRoute === 'library'}
      <Library on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {:else if currentRoute === 'search'}
      <SearchPage />
    {:else if currentRoute === 'settings'}
      <SettingsPage on:modechange={(e) => (gnatMode = e.detail.gnat)} />
    {:else if currentRoute === 'feed' && gnatMode}
      <FeedPage on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {:else if currentRoute === 'paste'}
      <PasteJsonPage on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {:else if currentRoute === 'url'}
      <UrlFetchPage on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {:else if currentRoute === 'bundle'}
      <BundleDetail bundleId={routeParams.bundleId} on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {:else if currentRoute === 'object'}
      <ObjectDetail bundleId={routeParams.bundleId} objectId={routeParams.objectId} on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {/if}
  </main>

  <nav class="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-1 px-2 py-2">
    <button
      on:click={() => navigate('library')}
      class={`flex-1 py-2 px-3 text-center rounded transition text-sm ${currentRoute === 'library' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      📚 Library
    </button>
    {#if gnatMode}
      <button
        on:click={() => navigate('feed')}
        class={`flex-1 py-2 px-3 text-center rounded transition text-sm ${currentRoute === 'feed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        📡 Feed
      </button>
    {/if}
    <button
      on:click={() => navigate('search')}
      class={`flex-1 py-2 px-3 text-center rounded transition text-sm ${currentRoute === 'search' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      🔍 Search
    </button>
    <button
      on:click={() => navigate('settings')}
      class={`flex-1 py-2 px-3 text-center rounded transition text-sm ${currentRoute === 'settings' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      ⚙️ Settings
    </button>
    <button
      on:click={toggleDarkMode}
      class="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  </nav>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  :global(html) {
    color-scheme: light dark;
  }
</style>
