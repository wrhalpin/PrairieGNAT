<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { loadBundlesAsync, saveBundleAsync } from '$lib/storage/db';
  import { parseBundle } from '$lib/stix/parser';
  import type { Bundle } from '$lib/stix/types';

  interface BundleEntry {
    id: string;
    name: string;
    objectCount: number;
    openedAt: number;
    source: 'file' | 'paste' | 'url' | 'taxii';
  }

  const dispatch = createEventDispatcher();

  let bundles: BundleEntry[] = [];
  let loading = false;
  let error: string | null = null;

  onMount(async () => {
    try {
      const stored = await loadBundlesAsync();
      bundles = stored.map((b) => ({
        id: b.id,
        name: b.name,
        objectCount: b.bundle.objects?.length || 0,
        openedAt: b.openedAt,
        source: b.source,
      }));
    } catch (e) {
      console.error('Failed to load bundles:', e);
    }
  });

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

      const newBundle: BundleEntry = {
        id: bundleData.id,
        name: file.name,
        objectCount: bundleData.objects?.length || 0,
        openedAt: Date.now(),
        source: 'file',
      };
      bundles = [newBundle, ...bundles];

      input.value = '';
    } catch (e) {
      error = `Error loading file: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
    } finally {
      loading = false;
    }
  }

  async function handleLoadTestBundle() {
    try {
      error = null;
      loading = true;
      const response = await fetch('/test-bundle-small.json');
      const bundleData = (await response.json()) as Bundle;

      parseBundle(JSON.stringify(bundleData));
      await saveBundleAsync(bundleData.id, 'Test Bundle (Small)', bundleData, 'file');

      const newBundle: BundleEntry = {
        id: bundleData.id,
        name: 'Test Bundle (Small)',
        objectCount: bundleData.objects?.length || 0,
        openedAt: Date.now(),
        source: 'file',
      };
      bundles = [newBundle, ...bundles];
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
    <div class="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
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
  </div>

  {#if bundles.length === 0}
    <p class="text-center text-slate-500 dark:text-slate-400 py-8">
      No bundles loaded yet. Try loading the test bundle above.
    </p>
  {:else}
    <div class="space-y-2">
      {#each bundles as bundle (bundle.id)}
        <button
          on:click={() => openBundle(bundle.id)}
          class="w-full p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="font-semibold">{bundle.name}</p>
              <p class="text-sm text-slate-600 dark:text-slate-400">{bundle.objectCount} objects</p>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-500">{new Date(bundle.openedAt).toLocaleDateString()}</p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
