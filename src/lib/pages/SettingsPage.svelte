<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    loadSettingsAsync,
    saveSettingsAsync,
    clearAllAsync,
  } from '$lib/storage/db';
  import { TAXIIClient } from '$lib/taxii/client';

  const dispatch = createEventDispatcher();

  let mode: 'standalone' | 'gnat' = 'standalone';
  let gnatUrl = '';
  let gnatApiKey = '';
  let hasStoredKey = false;
  let showApiKey = false;
  let testingConnection = false;
  let testMessage = '';
  let testError = false;
  let saveLoading = false;
  let saveMessage = '';
  let saveError = false;

  onMount(async () => {
    try {
      const settings = await loadSettingsAsync();
      mode = settings.mode;
      gnatUrl = settings.gnatInstanceUrl || '';
      // The key itself is never shown in the UI; we only track that one exists
      // so saves and tests don't force re-entry.
      hasStoredKey = !!settings.gnatApiKey;
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  });

  async function resolveApiKey(): Promise<string> {
    if (gnatApiKey.trim()) return gnatApiKey.trim();
    if (hasStoredKey) {
      const settings = await loadSettingsAsync();
      return settings.gnatApiKey || '';
    }
    return '';
  }

  async function handleTestConnection() {
    const key = await resolveApiKey();
    if (!gnatUrl.trim() || !key) {
      testError = true;
      testMessage = 'Please enter both URL and API key';
      return;
    }

    testingConnection = true;
    testError = false;
    testMessage = 'Testing connection...';

    try {
      const client = new TAXIIClient(gnatUrl, key);
      await client.getDiscovery();
      testError = false;
      testMessage = '✓ Connection successful!';
    } catch (e) {
      testError = true;
      testMessage = `Error: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      testingConnection = false;
    }
  }

  async function handleSaveSettings() {
    saveMessage = '';
    saveError = false;

    if (mode === 'gnat') {
      if (!gnatUrl.trim()) {
        saveError = true;
        saveMessage = 'Please enter the GNAT instance URL';
        return;
      }
      if (!gnatApiKey.trim() && !hasStoredKey) {
        saveError = true;
        saveMessage = 'Please enter an API key';
        return;
      }
    }

    saveLoading = true;
    try {
      // Only overwrite the stored key when a new one was typed; a blank field
      // means "keep the existing key". Switching to standalone keeps the key
      // stored so switching back doesn't require re-entry.
      const update: Record<string, unknown> = {
        mode,
        gnatInstanceUrl: gnatUrl,
      };
      if (gnatApiKey.trim()) {
        update.gnatApiKey = gnatApiKey.trim();
      }
      await saveSettingsAsync(update);
      if (gnatApiKey.trim()) {
        hasStoredKey = true;
        gnatApiKey = '';
      }
      testMessage = '';
      saveMessage = '✓ Settings saved';
      dispatch('modechange', { gnat: mode === 'gnat' });
    } catch (e) {
      saveError = true;
      saveMessage = `Error: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      saveLoading = false;
    }
  }

  async function handleClearCache() {
    if (confirm('Clear all cached bundles and feed?')) {
      try {
        await clearAllAsync();
        saveError = false;
        saveMessage = '✓ All cached bundles and feed data cleared';
      } catch (e) {
        saveError = true;
        saveMessage = `Error: ${e instanceof Error ? e.message : String(e)}`;
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
          <label for="gnat-url" class="block font-semibold mb-2"
            >GNAT Instance URL</label
          >
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
                placeholder={hasStoredKey
                  ? '•••••••• (saved — leave blank to keep)'
                  : 'sk-...'}
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

        {#if testMessage}
          <div
            class={`p-3 rounded-lg text-sm ${testError ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}`}
          >
            {testMessage}
          </div>
        {/if}

        <button
          on:click={handleTestConnection}
          disabled={testingConnection}
          class="w-full py-2 px-4 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-semibold disabled:opacity-50"
        >
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    {/if}

    <!-- Save lives outside the GNAT block so switching back to standalone
         can actually be persisted -->
    {#if saveMessage}
      <div
        class={`p-3 rounded-lg text-sm ${saveError ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}`}
      >
        {saveMessage}
      </div>
    {/if}

    <button
      on:click={handleSaveSettings}
      disabled={saveLoading}
      class="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50"
    >
      {saveLoading ? 'Saving...' : 'Save Settings'}
    </button>

    <div>
      <h2 class="font-semibold mb-2">Cache</h2>
      <button
        on:click={handleClearCache}
        class="w-full py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
      >
        Clear All Bundles
      </button>
    </div>

    <div
      class="text-xs text-slate-500 dark:text-slate-400 p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
    >
      <p><strong>PrairieGNAT</strong> v0.0.1</p>
      <p>Apache 2.0 License</p>
    </div>
  </div>
</div>
