<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { loadBundlesAsync } from '$lib/storage/db';
  import { parseBundle, getObjectIcon, getObjectName } from '$lib/stix/parser';
  import type { StixObject } from '$lib/stix/types';

  const dispatch = createEventDispatcher();

  let query = '';
  let results: Array<{ obj: StixObject; bundleId: string; bundleIndex: number }> = [];
  let bundles: any[] = [];
  let loading = false;

  onMount(async () => {
    try {
      const stored = await loadBundlesAsync();
      bundles = stored;
    } catch (e) {
      console.error('Failed to load bundles:', e);
    }
  });

  function searchBundles(searchQuery: string) {
    if (!searchQuery.trim()) {
      results = [];
      return;
    }

    const q = searchQuery.toLowerCase();
    results = [];

    bundles.forEach((bundleRecord, bundleIndex) => {
      const parsed = parseBundle(JSON.stringify(bundleRecord.bundle));

      for (const obj of parsed.objectsById.values()) {
        const name = getObjectName(obj).toLowerCase();
        const desc = (obj as any).description?.toLowerCase() || '';
        const id = obj.id.toLowerCase();
        const type = obj.type.toLowerCase();

        if (name.includes(q) || desc.includes(q) || id.includes(q) || type.includes(q)) {
          results.push({
            obj,
            bundleId: bundleRecord.id,
            bundleIndex,
          });

          if (results.length >= 50) return; // Limit results to 50
        }
      }
    });
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
    <p class="text-sm text-slate-600 dark:text-slate-400 mb-3">
      Found {results.length} result{results.length === 1 ? '' : 's'}
      {results.length >= 50 ? ' (limited to 50)' : ''}
    </p>

    <div class="space-y-2">
      {#each results as result (result.obj.id)}
        <button
          on:click={() => openObject(result.bundleId, result.obj.id)}
          class="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left border-l-2 border-slate-300 dark:border-slate-700 hover:border-blue-500"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="font-semibold text-sm">
                {getObjectIcon(result.obj.type)} {getObjectName(result.obj)}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">{result.obj.type}</p>
              {#if result.obj.description}
                <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {result.obj.description}
                </p>
              {/if}
            </div>
            <p class="text-xs text-slate-500 ml-2">{bundles[result.bundleIndex].name}</p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(.line-clamp-2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
