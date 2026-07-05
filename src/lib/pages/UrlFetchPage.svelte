<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { saveBundleAsync } from '$lib/storage/db';
  import { parseBundle } from '$lib/stix/parser';
  import { TAXIIClient } from '$lib/taxii/client';
  import type { Bundle } from '$lib/stix/types';

  const dispatch = createEventDispatcher();

  let url = '';
  let apiKey = '';
  let showApiKey = false;
  let loading = false;
  let error: string | null = null;

  async function handleFetch() {
    if (!url.trim()) {
      error = 'Please enter a URL';
      return;
    }

    try {
      error = null;
      loading = true;

      // One path for plain JSON URLs and TAXII endpoints: the client
      // enforces HTTPS, scopes the API key to this URL's origin, and
      // normalizes TAXII envelopes into bundles.
      const client = new TAXIIClient(new URL(url).origin, apiKey || undefined);
      const bundleData: Bundle = await client.fetchBundleFromUrl(url);

      // Validate
      parseBundle(JSON.stringify(bundleData));

      // Save
      await saveBundleAsync(
        bundleData.id,
        new URL(url).hostname || 'Bundle',
        bundleData,
        'url',
        url
      );

      dispatch('navigate', {
        route: 'bundle',
        params: { bundleId: bundleData.id },
      });
    } catch (e) {
      error = `Failed to fetch: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
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

  <h1 class="text-2xl font-bold mb-4">🔗 Fetch from URL</h1>

  {#if error}
    <div
      class="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
    >
      {error}
    </div>
  {/if}

  <div class="space-y-4">
    <div>
      <label for="url-input" class="block font-semibold mb-2"
        >Bundle URL or TAXII Endpoint:</label
      >
      <input
        id="url-input"
        type="url"
        bind:value={url}
        placeholder="https://example.com/bundle.json or https://taxii.example.com/taxii/collections/bundle-id"
        class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        disabled={loading}
      />
      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
        Direct JSON URL or TAXII 2.1 collection endpoint
      </p>
    </div>

    <div>
      <label for="api-key-input" class="block font-semibold mb-2"
        >API Key (Optional)</label
      >
      <div class="flex gap-2">
        {#if showApiKey}
          <input
            id="api-key-input"
            type="text"
            bind:value={apiKey}
            placeholder="sk-..."
            class="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            disabled={loading}
          />
        {:else}
          <input
            id="api-key-input"
            type="password"
            bind:value={apiKey}
            placeholder="sk-..."
            class="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            disabled={loading}
          />
        {/if}
        <button
          on:click={() => (showApiKey = !showApiKey)}
          class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          {showApiKey ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
        Sent as X-Api-Key header (stored in memory only)
      </p>
    </div>

    <button
      on:click={handleFetch}
      disabled={loading || !url.trim()}
      class="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold"
    >
      {loading ? 'Fetching...' : 'Fetch Bundle'}
    </button>
  </div>
</div>
