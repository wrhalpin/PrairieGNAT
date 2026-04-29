<script lang="ts">
  import { onMount } from 'svelte';
  import Library from '$lib/pages/Library.svelte';
  import BundleDetail from '$lib/pages/BundleDetail.svelte';
  import ObjectDetail from '$lib/pages/ObjectDetail.svelte';
  import SearchPage from '$lib/pages/SearchPage.svelte';
  import SettingsPage from '$lib/pages/SettingsPage.svelte';

  type Route = 'library' | 'search' | 'settings' | 'bundle' | 'object';

  let currentRoute: Route = 'library';
  let routeParams: Record<string, string> = {};
  let isDarkMode = false;

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

  onMount(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else if (!savedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    }

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
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
      <SettingsPage />
    {:else if currentRoute === 'bundle'}
      <BundleDetail bundleId={routeParams.bundleId} on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {:else if currentRoute === 'object'}
      <ObjectDetail bundleId={routeParams.bundleId} objectId={routeParams.objectId} on:navigate={(e) => navigate(e.detail.route, e.detail.params)} />
    {/if}
  </main>

  <nav class="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-1 px-2 py-2">
    <button
      on:click={() => navigate('library')}
      class={`flex-1 py-2 px-3 text-center rounded transition ${currentRoute === 'library' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      📚 Library
    </button>
    <button
      on:click={() => navigate('search')}
      class={`flex-1 py-2 px-3 text-center rounded transition ${currentRoute === 'search' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      🔍 Search
    </button>
    <button
      on:click={() => navigate('settings')}
      class={`flex-1 py-2 px-3 text-center rounded transition ${currentRoute === 'settings' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      ⚙️ Settings
    </button>
    <button
      on:click={toggleDarkMode}
      class="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
