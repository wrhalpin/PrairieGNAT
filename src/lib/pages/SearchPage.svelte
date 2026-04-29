<script lang="ts">
  let query = '';
  let results: any[] = [];
</script>

<div class="p-4 pb-20">
  <h1 class="text-2xl font-bold mb-4">🔍 Search</h1>

  <input
    type="text"
    placeholder="Search all bundles..."
    bind:value={query}
    class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 mb-4"
  />

  {#if results.length === 0}
    <p class="text-center text-slate-500 dark:text-slate-400 py-8">
      {query ? 'No results found' : 'Enter a search query (Phase 2 feature)'}
    </p>
  {:else}
    <div class="space-y-2">
      {#each results as result}
        <a
          href={`/object/${result.id}`}
          class="block p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <p class="font-semibold">{result.name}</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">{result.type}</p>
        </a>
      {/each}
    </div>
  {/if}
</div>
