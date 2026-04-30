<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { loadBundleAsync, getReadStateAsync } from '$lib/storage/db';
  import { parseBundle, getObjectIcon, getObjectName } from '$lib/stix/parser';

  export let bundleId: string;

  const dispatch = createEventDispatcher();

  let bundle: Record<string, unknown> | null = null;
  let parsed: Record<string, unknown> | null = null;
  let error: string | null = null;
  let expandedTypes = new Set<string>();
  let readState = new Set<string>();

  onMount(async () => {
    try {
      const loaded = await loadBundleAsync(bundleId);

      if (!loaded) {
        error = 'Bundle not found';
        return;
      }

      bundle = loaded;
      parsed = parseBundle(JSON.stringify(loaded.bundle));
      readState = await getReadStateAsync(bundleId);
    } catch (e) {
      error = `Error loading bundle: ${e instanceof Error ? e.message : String(e)}`;
    }
  });

  function toggleType(type: string) {
    if (expandedTypes.has(type)) {
      expandedTypes.delete(type);
    } else {
      expandedTypes.add(type);
    }
    expandedTypes = expandedTypes;
  }

  function getObjectsByType() {
    if (!parsed) return [];

    const types = Array.from(parsed.objectsByType.keys()).sort();
    return types
      .filter((t) => !['relationship', 'marking-definition'].includes(t))
      .map((t) => ({
        type: t,
        count: parsed.objectsByType.get(t)?.length || 0,
        objects: parsed.objectsByType.get(t) || [],
      }));
  }

  function openObject(objectId: string) {
    dispatch('navigate', { route: 'object', params: { bundleId, objectId } });
  }
</script>

<div class="p-4 pb-20">
  <button
    on:click={() => dispatch('navigate', { route: 'library' })}
    class="text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-4 block"
  >
    ← Back to Library
  </button>

  {#if error}
    <div class="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
      {error}
    </div>
  {:else if bundle && parsed}
    <h1 class="text-2xl font-bold mb-2">{bundle.name}</h1>
    <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
      {parsed.objectsByType.size} object types • {parsed.objectsById.size} total objects
    </p>

    <div class="space-y-2">
      {#each getObjectsByType() as typeGroup (typeGroup.type)}
        <button
          on:click={() => toggleType(typeGroup.type)}
          class="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left flex justify-between items-center"
        >
          <span class="font-semibold">
            {getObjectIcon(typeGroup.type)} {typeGroup.type}
          </span>
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {typeGroup.count}
            {expandedTypes.has(typeGroup.type) ? '▼' : '▶'}
          </span>
        </button>

        {#if expandedTypes.has(typeGroup.type)}
          <div class="ml-2 space-y-1 mb-2">
            {#each typeGroup.objects as obj (obj.id)}
              <button
                on:click={() => openObject(obj.id)}
                class="w-full p-2 rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-sm border-l-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 text-left flex items-center justify-between"
              >
                <div class="flex-1">
                  <p class="font-medium">{getObjectName(obj)}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{obj.id}</p>
                </div>
                <span
                  class={`ml-2 text-xs font-semibold ${
                    readState.has(obj.id)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {readState.has(obj.id) ? '✓' : '○'}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
