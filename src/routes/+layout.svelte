<script lang="ts">
  import '../styles/app.css';

  export let data;

  let isDarkMode = false;

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
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
  });

  onMount(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js');
    }
  });

  import { onMount } from 'svelte';
</script>

<div class="flex flex-col h-screen bg-white dark:bg-slate-950">
  <main class="flex-1 overflow-auto">
    <slot />
  </main>

  <nav class="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-1 px-2 py-2">
    <a href="/" class="flex-1 py-2 px-3 text-center rounded hover:bg-slate-100 dark:hover:bg-slate-800">
      📚 Library
    </a>
    <a href="/search" class="flex-1 py-2 px-3 text-center rounded hover:bg-slate-100 dark:hover:bg-slate-800">
      🔍 Search
    </a>
    <a href="/settings" class="flex-1 py-2 px-3 text-center rounded hover:bg-slate-100 dark:hover:bg-slate-800">
      ⚙️ Settings
    </a>
    <button
      on:click={toggleDarkMode}
      class="px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
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
</style>
