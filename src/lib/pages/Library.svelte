<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    loadBundlesAsync,
    saveBundleAsync,
    getAllBookmarkCountsAsync,
  } from '$lib/storage/db';
  import { parseBundle } from '$lib/stix/parser';
  import type { Bundle } from '$lib/stix/types';

  interface BundleEntry {
    id: string;
    name: string;
    objectCount: number;
    openedAt: number;
    source: 'file' | 'paste' | 'url' | 'taxii' | 'share';
    bookmarkCount: number;
  }

  const dispatch = createEventDispatcher();

  let bundles: BundleEntry[] = [];
  let filterMode: 'all' | 'bookmarked' = 'all';
  let loading = false;
  let error: string | null = null;

  onMount(async () => {
    try {
      const stored = await loadBundlesAsync();
      const counts = await getAllBookmarkCountsAsync();

      bundles = stored
        .map((b) => ({
          id: b.id,
          name: b.name,
          objectCount: b.bundle.objects?.length || 0,
          openedAt: b.openedAt,
          source: b.source,
          bookmarkCount: counts[b.id] || 0,
        }))
        .sort((a, b) => b.openedAt - a.openedAt);
    } catch (e) {
      error = `Failed to load bundles: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
    }
  });

  // Reactive so the All/Bookmarked toggle actually re-filters the list
  $: filteredBundles =
    filterMode === 'bookmarked'
      ? bundles.filter((b) => b.bookmarkCount > 0)
      : bundles;

  function addOrReplaceBundle(entry: BundleEntry) {
    // Reloading an existing bundle replaces its entry (duplicate keys crash
    // the keyed each); keep its bookmark count.
    const existing = bundles.find((b) => b.id === entry.id);
    if (existing) entry.bookmarkCount = existing.bookmarkCount;
    bundles = [entry, ...bundles.filter((b) => b.id !== entry.id)];
  }

  async function handleFileOpen(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      error = null;
      loading = true;
      const text = await file.text();
      const bundleData = JSON.parse(text) as Bundle;

      parseBundle(text);
      await saveBundleAsync(bundleData.id, file.name, bundleData, 'file');

      addOrReplaceBundle({
        id: bundleData.id,
        name: file.name,
        objectCount: bundleData.objects?.length || 0,
        openedAt: Date.now(),
        source: 'file',
        bookmarkCount: 0,
      });
    } catch (e) {
      error = `Error loading file: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
    } finally {
      // Always reset so the same file can be re-selected after a failure
      input.value = '';
      loading = false;
    }
  }

  async function handleLoadTestBundle() {
    try {
      error = null;
      loading = true;
      const response = await fetch('/test-bundle-small.json');
      if (!response.ok) {
        throw new Error(
          `Could not fetch test bundle (HTTP ${response.status})`
        );
      }
      const bundleData = (await response.json()) as Bundle;

      parseBundle(JSON.stringify(bundleData));
      await saveBundleAsync(
        bundleData.id,
        'Test Bundle (Small)',
        bundleData,
        'file'
      );

      addOrReplaceBundle({
        id: bundleData.id,
        name: 'Test Bundle (Small)',
        objectCount: bundleData.objects?.length || 0,
        openedAt: Date.now(),
        source: 'file',
        bookmarkCount: 0,
      });
    } catch (e) {
      error = `Error loading test bundle: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
    } finally {
      loading = false;
    }
  }

  function openBundle(bundleId: string) {
    dispatch('navigate', { route: 'bundle', params: { bundleId } });
  }
</script>

<div class="p-4 pb-20">
  <h1 class="text-2xl font-bold mb-4">📚 Library</h1>

  {#if error}
    <div
      class="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
    >
      {error}
    </div>
  {/if}

  <div class="space-y-3 mb-6">
    <div>
      <input
        id="file-input"
        type="file"
        accept=".json,.stix"
        on:change={handleFileOpen}
        disabled={loading}
        class="hidden"
      />
      <button
        on:click={() => document.getElementById('file-input')?.click()}
        disabled={loading}
        class="w-full py-3 px-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition disabled:opacity-50"
      >
        📂 Open Bundle File
      </button>
    </div>

    <button
      on:click={handleLoadTestBundle}
      disabled={loading}
      class="w-full py-3 px-4 rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 transition disabled:opacity-50"
    >
      🧪 Load Test Bundle
    </button>

    <button
      on:click={() => dispatch('navigate', { route: 'paste' })}
      class="w-full py-3 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
    >
      📋 Paste JSON
    </button>

    <button
      on:click={() => dispatch('navigate', { route: 'url' })}
      class="w-full py-3 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
    >
      🔗 Load from URL
    </button>
  </div>

  {#if bundles.length === 0}
    <p class="text-center text-slate-500 dark:text-slate-400 py-8">
      No bundles loaded yet. Try loading the test bundle above.
    </p>
  {:else}
    <div class="mb-4 flex gap-2">
      <button
        on:click={() => (filterMode = 'all')}
        class={`px-3 py-2 rounded text-sm font-semibold transition ${
          filterMode === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        All ({bundles.length})
      </button>
      <button
        on:click={() => (filterMode = 'bookmarked')}
        class={`px-3 py-2 rounded text-sm font-semibold transition ${
          filterMode === 'bookmarked'
            ? 'bg-blue-500 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        ⭐ Bookmarked ({bundles.filter((b) => b.bookmarkCount > 0).length})
      </button>
    </div>

    {#if filteredBundles.length === 0}
      <p class="text-center text-slate-500 dark:text-slate-400 py-8">
        {filterMode === 'bookmarked'
          ? 'No bookmarked items yet.'
          : 'No bundles found.'}
      </p>
    {:else}
      <div class="space-y-2">
        {#each filteredBundles as bundle (bundle.id)}
          <button
            on:click={() => openBundle(bundle.id)}
            class="w-full p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-semibold">{bundle.name}</p>
                  {#if bundle.bookmarkCount > 0}
                    <span
                      class="px-2 py-0.5 rounded-full text-xs bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    >
                      ⭐ {bundle.bookmarkCount}
                    </span>
                  {/if}
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  {bundle.objectCount} objects
                </p>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-500">
                {new Date(bundle.openedAt).toLocaleDateString()}
              </p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
