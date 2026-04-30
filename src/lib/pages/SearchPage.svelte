<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { loadBundlesAsync } from '$lib/storage/db';
  import { parseBundle, getObjectIcon, getObjectName } from '$lib/stix/parser';
  import type { StixObject } from '$lib/stix/types';

  const dispatch = createEventDispatcher();

  interface SearchResult {
    obj: StixObject;
    bundleId: string;
    bundleIndex: number;
    snippet: string;
  }

  let query = '';
  let results: SearchResult[] = [];
  let bundles: any[] = [];
  let loading = false;
  let filterType: string | null = null;
  let filterBundle: string | null = null;

  onMount(async () => {
    try {
      const stored = await loadBundlesAsync();
      bundles = stored;
    } catch (e) {
      console.error('Failed to load bundles:', e);
    }
  });

  function extractSnippet(text: string, query: string, maxLength = 100): string {
    if (!text) return '';
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, maxLength);

    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + query.length + 30);
    const snippet = text.slice(start, end);
    return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
  }

  function searchBundles(searchQuery: string) {
    if (!searchQuery.trim()) {
      results = [];
      return;
    }

    const q = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    bundles.forEach((bundleRecord, bundleIndex) => {
      const parsed = parseBundle(JSON.stringify(bundleRecord.bundle));

      for (const obj of parsed.objectsById.values()) {
        const name = getObjectName(obj).toLowerCase();
        const desc = (obj as any).description?.toLowerCase() || '';
        const id = obj.id.toLowerCase();
        const type = obj.type.toLowerCase();

        if (name.includes(q) || desc.includes(q) || id.includes(q) || type.includes(q)) {
          const snippet = desc ? extractSnippet((obj as any).description, q) : '';
          allResults.push({
            obj,
            bundleId: bundleRecord.id,
            bundleIndex,
            snippet,
          });

          if (allResults.length >= 100) return; // Collect up to 100
        }
      }
    });

    results = allResults;
  }

  function getFilteredResults() {
    return results.filter((r) => {
      if (filterType && r.obj.type !== filterType) return false;
      if (filterBundle && r.bundleId !== filterBundle) return false;
      return true;
    });
  }

  function getUniqueTypes() {
    return Array.from(new Set(results.map((r) => r.obj.type))).sort();
  }

  function getUniqueBundles() {
    return Array.from(new Set(results.map((r) => r.bundleId))).sort();
  }

  $: searchBundles(query);

  function openObject(bundleId: string, objectId: string) {
    dispatch('navigate', {
      route: 'object',
      params: { bundleId, objectId },
    });
  }
</script>

<div class="p-4 pb-20">
  <h1 class="text-2xl font-bold mb-4">🔍 Search</h1>

  <input
    type="text"
    placeholder="Search all bundles by name, description, ID..."
    bind:value={query}
    class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 mb-4"
  />

  {#if results.length === 0}
    <p class="text-center text-slate-500 dark:text-slate-400 py-8">
      {query ? 'No matches found' : 'Enter a search query to find objects across all loaded bundles'}
    </p>
  {:else}
    <div class="mb-4">
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-3 font-semibold">
        Found {getFilteredResults().length} result{getFilteredResults().length === 1 ? '' : 's'}
        {results.length >= 100 ? ' (showing first 100)' : ''}
      </p>

      {#if getUniqueTypes().length > 1}
        <div class="mb-3">
          <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Filter by type:</p>
          <div class="flex flex-wrap gap-1">
            <button
              on:click={() => (filterType = null)}
              class={`px-2 py-1 rounded text-xs font-semibold transition ${
                filterType === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
              }`}
            >
              All
            </button>
            {#each getUniqueTypes() as type}
              <button
                on:click={() => (filterType = filterType === type ? null : type)}
                class={`px-2 py-1 rounded text-xs font-semibold transition ${
                  filterType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {type}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if getUniqueBundles().length > 1}
        <div>
          <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Filter by bundle:</p>
          <div class="flex flex-wrap gap-1">
            <button
              on:click={() => (filterBundle = null)}
              class={`px-2 py-1 rounded text-xs font-semibold transition ${
                filterBundle === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
              }`}
            >
              All
            </button>
            {#each getUniqueBundles() as bundleId}
              <button
                on:click={() => (filterBundle = filterBundle === bundleId ? null : bundleId)}
                class={`px-2 py-1 rounded text-xs font-semibold transition ${
                  filterBundle === bundleId
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {bundles.find((b) => b.id === bundleId)?.name || 'Unknown'}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    {#if getFilteredResults().length === 0}
      <p class="text-center text-slate-500 dark:text-slate-400 py-8">
        No matches found with current filters
      </p>
    {:else}
      <div class="space-y-2">
        {#each getFilteredResults() as result (result.obj.id)}
          <button
            on:click={() => openObject(result.bundleId, result.obj.id)}
            class="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left border-l-2 border-slate-300 dark:border-slate-700 hover:border-blue-500"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="font-semibold text-sm">
                  {getObjectIcon(result.obj.type)} {getObjectName(result.obj)}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-500">{result.obj.type}</p>
                {#if result.snippet}
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                    "{result.snippet}"
                  </p>
                {/if}
              </div>
              <p class="text-xs text-slate-500 ml-2 flex-shrink-0">{bundles[result.bundleIndex].name}</p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
