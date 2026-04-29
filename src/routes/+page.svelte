<script lang="ts">
  import { onMount } from 'svelte';

  let bundles: any[] = [];
  let loading = false;

  onMount(async () => {
    // TODO: load bundles from IndexedDB
  });

  async function handleFileOpen(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      loading = true;
      const text = await file.text();
      const bundle = JSON.parse(text);
      // TODO: save to IndexedDB and add to bundles list
      bundles = [...bundles, { name: file.name, objects: bundle.objects?.length || 0 }];
    } catch (error) {
      alert(`Error loading file: ${error}`);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Library — GNAT Reader</title>
</svelte:head>

<div class="p-4 pb-20">
  <h1 class="text-2xl font-bold mb-4">📚 Library</h1>

  <div class="space-y-3 mb-6">
    <label class="block">
      <input
        type="file"
        accept=".json,.stix"
        on:change={handleFileOpen}
        disabled={loading}
        class="hidden"
      />
      <button
        on:click={(e) => (e.currentTarget as HTMLElement)?.parentElement?.querySelector('input')?.click()}
        class="w-full py-3 px-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition"
      >
        📂 Open Bundle File
      </button>
    </label>

    <a href="/paste" class="block py-3 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-center">
      📋 Paste JSON
    </a>

    <a href="/url" class="block py-3 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-center">
      🔗 Load from URL
    </a>
  </div>

  {#if bundles.length === 0}
    <p class="text-center text-slate-500 dark:text-slate-400 py-8">No bundles loaded yet</p>
  {:else}
    <div class="space-y-2">
      {#each bundles as bundle}
        <a
          href={`/bundle/${bundle.id}`}
          class="block p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <p class="font-semibold">{bundle.name}</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">{bundle.objects} objects</p>
        </a>
      {/each}
    </div>
  {/if}
</div>
