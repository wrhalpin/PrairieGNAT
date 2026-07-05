<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { saveBundleAsync } from '$lib/storage/db';
  import { parseBundle } from '$lib/stix/parser';
  import type { Bundle } from '$lib/stix/types';

  const dispatch = createEventDispatcher();

  let jsonText = '';
  let loading = false;
  let error: string | null = null;

  async function handlePaste() {
    if (!jsonText.trim()) {
      error = 'Please paste valid JSON';
      return;
    }

    try {
      error = null;
      loading = true;

      const { bundle: bundleData } = parseBundle(jsonText);

      await saveBundleAsync(
        bundleData.id,
        `Bundle ${new Date().toLocaleString()}`,
        bundleData as Bundle,
        'paste'
      );

      dispatch('navigate', {
        route: 'bundle',
        params: { bundleId: bundleData.id },
      });
    } catch (e) {
      error = `Invalid STIX bundle: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="p-4 pb-20">
  <button
    on:click={() => dispatch('navigate', { route: 'library' })}
    class="text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-4 block"
  >
    ← Back to Library
  </button>

  <h1 class="text-2xl font-bold mb-4">📋 Paste STIX Bundle</h1>

  {#if error}
    <div class="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
      {error}
    </div>
  {/if}

  <div class="space-y-4">
    <div>
      <label for="json-textarea" class="block font-semibold mb-2">STIX Bundle JSON:</label>
      <textarea
        id="json-textarea"
        bind:value={jsonText}
        placeholder={'{\n  "type": "bundle",\n  "id": "bundle--...",\n  "objects": [...]\n}'}
        class="w-full h-64 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
        disabled={loading}
      />
    </div>

    <button
      on:click={handlePaste}
      disabled={loading || !jsonText.trim()}
      class="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold"
    >
      {loading ? 'Loading...' : 'Load Bundle'}
    </button>

    <p class="text-xs text-slate-600 dark:text-slate-400">
      Paste a valid STIX 2.1 bundle in JSON format. The bundle will be saved to your device for offline access.
    </p>
  </div>
</div>
