<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { loadBundleAsync } from '$lib/storage/db';
  import { parseBundle, getObjectIcon, getTLPColor } from '$lib/stix/parser';
  import type { StixObject, Indicator, ThreatActor, Malware } from '$lib/stix/types';

  let bundleId: string;
  let objectId: string;
  let obj: StixObject | null = null;
  let parsed: any = null;
  let relatedObjects: StixObject[] = [];
  let error: string | null = null;

  onMount(async () => {
    try {
      bundleId = $page.params.id;
      objectId = decodeURIComponent($page.params.objId);

      const loaded = await loadBundleAsync(bundleId);
      if (!loaded) {
        error = 'Bundle not found';
        return;
      }

      parsed = parseBundle(JSON.stringify(loaded.bundle));
      obj = parsed.objectsById.get(objectId);

      if (!obj) {
        error = 'Object not found';
        return;
      }

      // Load related objects
      const relationshipIds = parsed.relationshipsBy.get(objectId) || [];
      for (const relId of relationshipIds) {
        const rel = parsed.objectsById.get(relId) as any;
        if (rel && rel.source_ref) {
          const sourceObj = parsed.objectsById.get(rel.source_ref);
          if (sourceObj) {
            relatedObjects.push(sourceObj);
          }
        }
      }
    } catch (e) {
      error = `Error loading object: ${e instanceof Error ? e.message : String(e)}`;
    }
  });

  function getTLPLabel(markingIds: string[] | undefined): string {
    if (!markingIds || markingIds.length === 0) return 'CLEAR';

    for (const markingId of markingIds) {
      const marking = parsed.markingsById.get(markingId);
      if (marking?.definition?.tlp) {
        return marking.definition.tlp.replace('tlp:', '').toUpperCase();
      }
    }
    return 'CLEAR';
  }

  function getTLPBgColor(markingIds: string[] | undefined): string {
    const tlp = getTLPLabel(markingIds).toLowerCase();
    const colors: { [key: string]: string } = {
      clear: 'bg-white dark:bg-slate-700',
      green: 'bg-green-100 dark:bg-green-900',
      amber: 'bg-amber-100 dark:bg-amber-900',
      red: 'bg-red-100 dark:bg-red-900',
    };
    return colors[tlp] || colors.clear;
  }
</script>

<svelte:head>
  <title>Object Detail — GNAT Reader</title>
</svelte:head>

<div class="p-4 pb-20">
  <a href={`/bundle/${bundleId}`} class="text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-4 block">
    ← Back to Bundle
  </a>

  {#if error}
    <div class="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
      {error}
    </div>
  {:else if obj}
    <div class={`p-4 rounded-lg mb-4 ${getTLPBgColor(obj.object_marking_refs)}`}>
      <div class="flex justify-between items-start mb-2">
        <h1 class="text-2xl font-bold">
          {getObjectIcon(obj.type)} {obj.name || obj.id.split('--')[1]}
        </h1>
        {#if obj.object_marking_refs}
          <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-700">
            {getTLPLabel(obj.object_marking_refs)}
          </span>
        {/if}
      </div>

      <p class="text-xs text-slate-600 dark:text-slate-400 mb-2">{obj.type}</p>
      <p class="text-xs text-slate-600 dark:text-slate-400">{obj.id}</p>
    </div>

    <!-- Description -->
    {#if obj.description}
      <div class="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
        <p class="text-sm"><strong>Description:</strong></p>
        <p class="text-sm text-slate-700 dark:text-slate-300 mt-1">{obj.description}</p>
      </div>
    {/if}

    <!-- Type-specific rendering -->
    {#if obj.type === 'indicator'}
      {@const ind = obj as unknown as Indicator}
      <div class="space-y-3 mb-4">
        {#if ind.pattern}
          <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
            <p class="text-xs font-semibold mb-1">Pattern:</p>
            <p class="text-xs font-mono bg-slate-900 dark:bg-slate-700 text-green-400 p-2 rounded overflow-auto">
              {ind.pattern}
            </p>
          </div>
        {/if}

        {#if ind.valid_from}
          <div class="text-xs">
            <strong>Valid From:</strong>
            {new Date(ind.valid_from).toLocaleString()}
          </div>
        {/if}

        {#if ind.valid_until}
          <div class="text-xs">
            <strong>Valid Until:</strong>
            {new Date(ind.valid_until).toLocaleString()}
          </div>
        {/if}

        {#if ind.kill_chain_phases && ind.kill_chain_phases.length > 0}
          <div>
            <p class="text-xs font-semibold mb-1">Kill Chain Phases:</p>
            <div class="flex flex-wrap gap-1">
              {#each ind.kill_chain_phases as phase}
                <span class="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {phase.phase_name}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else if obj.type === 'malware'}
      {@const malware = obj as unknown as Malware}
      <div class="space-y-3 mb-4">
        {#if malware.aliases && malware.aliases.length > 0}
          <div>
            <p class="text-xs font-semibold mb-1">Aliases:</p>
            <p class="text-sm">{malware.aliases.join(', ')}</p>
          </div>
        {/if}

        {#if malware.capabilities && malware.capabilities.length > 0}
          <div>
            <p class="text-xs font-semibold mb-1">Capabilities:</p>
            <div class="flex flex-wrap gap-1">
              {#each malware.capabilities as cap}
                <span class="px-2 py-1 rounded text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                  {cap}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        {#if malware.is_family !== undefined}
          <div class="text-xs">
            <strong>Family:</strong>
            {malware.is_family ? 'Yes' : 'No'}
          </div>
        {/if}
      </div>
    {:else if obj.type === 'threat-actor'}
      {@const ta = obj as unknown as ThreatActor}
      <div class="space-y-3 mb-4">
        {#if ta.aliases && ta.aliases.length > 0}
          <div>
            <p class="text-xs font-semibold mb-1">Aliases:</p>
            <p class="text-sm">{ta.aliases.join(', ')}</p>
          </div>
        {/if}

        {#if ta.goals && ta.goals.length > 0}
          <div>
            <p class="text-xs font-semibold mb-1">Goals:</p>
            <ul class="text-sm space-y-1">
              {#each ta.goals as goal}
                <li>• {goal}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if ta.sophistication}
          <div class="text-xs">
            <strong>Sophistication:</strong>
            {ta.sophistication}
          </div>
        {/if}

        {#if ta.resource_level}
          <div class="text-xs">
            <strong>Resource Level:</strong>
            {ta.resource_level}
          </div>
        {/if}

        {#if ta.primary_motivation}
          <div class="text-xs">
            <strong>Primary Motivation:</strong>
            {ta.primary_motivation}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Labels -->
    {#if obj.labels && obj.labels.length > 0}
      <div class="mb-4">
        <p class="text-xs font-semibold mb-2">Labels:</p>
        <div class="flex flex-wrap gap-1">
          {#each obj.labels as label}
            <span class="px-2 py-1 rounded text-xs bg-slate-200 dark:bg-slate-700">
              {label}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Related Objects -->
    {#if relatedObjects.length > 0}
      <div class="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
        <h2 class="font-bold mb-3">Related Objects</h2>
        <div class="space-y-2">
          {#each relatedObjects as related}
            <a
              href={`/bundle/${bundleId}/object/${encodeURIComponent(related.id)}`}
              class="block p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <p class="font-semibold text-sm">
                {getObjectIcon(related.type)} {related.name || related.id.split('--')[1]}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">{related.type}</p>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Metadata -->
    <div class="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
      <p class="text-xs text-slate-500 dark:text-slate-400">
        <strong>Created:</strong> {new Date(obj.created || '').toLocaleString()}
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        <strong>Modified:</strong> {new Date(obj.modified || '').toLocaleString()}
      </p>
    </div>
  {/if}
</div>
