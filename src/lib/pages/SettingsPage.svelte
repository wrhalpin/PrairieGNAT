<script lang="ts">
  import { onMount } from 'svelte';
  import { loadSettingsAsync, saveSettingsAsync, clearAllAsync } from '$lib/storage/db';

  let mode: 'standalone' | 'gnat' = 'standalone';
  let gnatUrl = '';
  let gnatApiKey = '';
  let showApiKey = false;

  onMount(async () => {
    try {
      const settings = await loadSettingsAsync();
      mode = settings.mode;
      gnatUrl = settings.gnatInstanceUrl || '';
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  });

  async function handleSaveSettings() {
    try {
      await saveSettingsAsync({
        mode,
        gnatInstanceUrl: gnatUrl,
      });
      alert('Settings saved');
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleClearCache() {
    if (confirm('Clear all cached bundles?')) {
      try {
        await clearAllAsync();
        alert('Cache cleared. Reload the app.');
      } catch (e) {
        alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
</script>

<div class="p-4 pb-20">
  <h1 class="text-2xl font-bold mb-6">⚙️ Settings</h1>

  <div class="space-y-6">
    <div>
      <h2 class="font-semibold mb-2">Mode</h2>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" bind:group={mode} value="standalone" />
          <span>Standalone (offline, no server)</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" bind:group={mode} value="gnat" />
          <span>GNAT-aware (Phase 3)</span>
        </label>
      </div>
    </div>

    {#if mode === 'gnat'}
      <div class="space-y-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
        <div>
          <label for="gnat-url" class="block font-semibold mb-2">GNAT Instance URL</label>
          <input
            id="gnat-url"
            type="url"
            bind:value={gnatUrl}
            placeholder="https://gnat.example.com"
            class="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label for="api-key" class="block font-semibold mb-2">API Key</label>
          <div class="flex gap-2">
            {#if showApiKey}
              <input
                id="api-key"
                type="text"
                bind:value={gnatApiKey}
                placeholder="sk-..."
                class="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            {:else}
              <input
                id="api-key"
                type="password"
                bind:value={gnatApiKey}
                placeholder="sk-..."
                class="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            {/if}
            <button
              on:click={() => (showApiKey = !showApiKey)}
              class="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button
          on:click={handleSaveSettings}
          class="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          Save Settings
        </button>
      </div>
    {/if}

    <div>
      <h2 class="font-semibold mb-2">Cache</h2>
      <button
        on:click={handleClearCache}
        class="w-full py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
      >
        Clear All Bundles
      </button>
    </div>

    <div class="text-xs text-slate-500 dark:text-slate-400 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
      <p><strong>PrairieGNAT</strong> v0.0.1</p>
      <p>Apache 2.0 License</p>
      <p class="mt-2">Phase 0 Spike - STIX 2.1 Parser MVP</p>
    </div>
  </div>
</div>
