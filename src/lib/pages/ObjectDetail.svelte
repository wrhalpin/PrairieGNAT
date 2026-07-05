<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { loadBundleAsync, loadSettingsAsync } from '$lib/storage/db';
  import { parseBundle, getObjectIcon } from '$lib/stix/parser';
  import { getObjectFields } from '$lib/stix/renderers';
  import BookmarkButton from '$lib/components/BookmarkButton.svelte';
  import ReadToggle from '$lib/components/ReadToggle.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import type { StixObject } from '$lib/stix/types';

  export let bundleId: string;
  export let objectId: string;

  const dispatch = createEventDispatcher();

  interface RelatedEntry {
    obj: StixObject;
    label: string;
  }

  let gnatInstanceUrl: string | null = null;

  let obj: StixObject | null = null;
  let parsed: Record<string, unknown> | null = null;
  let relatedObjects: RelatedEntry[] = [];
  let error: string | null = null;
  let loadToken = 0;

  onMount(async () => {
    try {
      const settings = await loadSettingsAsync();
      if (settings.mode === 'gnat' && settings.gnatInstanceUrl) {
        gnatInstanceUrl = settings.gnatInstanceUrl;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  });

  // Reactive: navigating from one object to a related object keeps this
  // component mounted with new props, so loading must re-run on prop change
  // (onMount alone would keep showing the old object).
  $: loadObject(bundleId, objectId);

  async function loadObject(bId: string, oId: string) {
    const token = ++loadToken;
    error = null;
    try {
      const loaded = await loadBundleAsync(bId);
      if (token !== loadToken) return; // superseded by a newer navigation

      if (!loaded) {
        error = 'Bundle not found';
        obj = null;
        relatedObjects = [];
        return;
      }

      const p = parseBundle(JSON.stringify(loaded.bundle));
      parsed = p;
      const byId = p.objectsById as Map<string, StixObject>;
      obj = byId.get(oId) ?? null;

      if (!obj) {
        error = 'Object not found';
        relatedObjects = [];
        return;
      }

      relatedObjects = buildRelated(p, oId);
    } catch (e) {
      if (token !== loadToken) return;
      error = `Error loading object: ${e instanceof Error ? e.message : String(e)}`;
      obj = null;
      relatedObjects = [];
    }
  }

  function buildRelated(p: Record<string, unknown>, oId: string): RelatedEntry[] {
    const byId = p.objectsById as Map<string, StixObject>;
    const relationshipIds = (p.relationshipsBy as Map<string, string[]>).get(oId) || [];
    const entries: RelatedEntry[] = [];
    const seen = new Set<string>();

    for (const relId of relationshipIds) {
      const rel = byId.get(relId) as (StixObject & Record<string, unknown>) | undefined;
      if (!rel) continue;

      if (rel.type === 'relationship') {
        const relType = (rel.relationship_type as string) || 'related-to';
        const outgoing = rel.source_ref === oId;
        const otherId = (outgoing ? rel.target_ref : rel.source_ref) as string | undefined;
        if (!otherId || seen.has(`${relId}:${otherId}`)) continue;
        const other = byId.get(otherId);
        if (!other) continue;
        seen.add(`${relId}:${otherId}`);
        entries.push({ obj: other, label: outgoing ? `${relType} →` : `← ${relType}` });
      } else if (rel.type === 'sighting' && !seen.has(relId)) {
        seen.add(relId);
        entries.push({ obj: rel, label: 'sighted by' });
      }
    }
    return entries;
  }

  function openInGnat() {
    if (!gnatInstanceUrl || !obj) return;
    const deepLink = `${gnatInstanceUrl}/objects/${encodeURIComponent(objectId)}`;
    window.open(deepLink, '_blank', 'noopener,noreferrer');
  }

  function formatDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  function getTLPLabel(markingIds: string[] | undefined): string {
    if (!markingIds || markingIds.length === 0 || !parsed) return 'CLEAR';

    for (const markingId of markingIds) {
      const marking = (parsed.markingsById as Map<string, Record<string, unknown>>).get(markingId);
      const tlp = (marking?.definition as Record<string, unknown> | undefined)?.tlp;
      if (typeof tlp === 'string') {
        return tlp.replace('tlp:', '').toUpperCase();
      }
    }
    return 'CLEAR';
  }

  function getTLPBgColor(markingIds: string[] | undefined): string {
    const tlp = getTLPLabel(markingIds).toLowerCase();
    const colors: { [key: string]: string } = {
      clear: 'bg-white dark:bg-slate-700',
      white: 'bg-white dark:bg-slate-700', // TLP 1.0 name for CLEAR
      green: 'bg-green-100 dark:bg-green-900',
      amber: 'bg-amber-100 dark:bg-amber-900',
      'amber+strict': 'bg-amber-100 dark:bg-amber-900',
      red: 'bg-red-100 dark:bg-red-900',
    };
    return colors[tlp] || colors.clear;
  }

  function openObject(relObjectId: string) {
    dispatch('navigate', { route: 'object', params: { bundleId, objectId: relObjectId } });
  }
</script>

<div class="p-4 pb-20">
  <button
    on:click={() => dispatch('navigate', { route: 'bundle', params: { bundleId } })}
    class="text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-4 block"
  >
    ← Back to Bundle
  </button>

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

    <!-- Action buttons -->
    <div class="flex gap-2 mb-4">
      <BookmarkButton {bundleId} objectId={obj.id} />
      <ReadToggle {bundleId} objectId={obj.id} />
      {#if gnatInstanceUrl}
        <button
          on:click={openInGnat}
          class="px-3 py-1 rounded text-sm bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          title="View in GNAT"
        >
          🔗 GNAT
        </button>
      {/if}
    </div>

    {#if obj.description}
      <div class="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
        <p class="text-sm"><strong>Description:</strong></p>
        <p class="text-sm text-slate-700 dark:text-slate-300 mt-1">{obj.description}</p>
      </div>
    {/if}

    <!-- Object-specific fields -->
    {#each getObjectFields(obj) as field}
      <div class="mb-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
        <p class="text-xs font-semibold mb-1">{field.label}:</p>
        {#if field.type === 'code'}
          <p class="text-xs font-mono bg-slate-900 dark:bg-slate-700 text-green-400 p-2 rounded overflow-auto">
            {field.value}
          </p>
        {:else if field.type === 'chip'}
          <div class="flex flex-wrap gap-1">
            {#each Array.isArray(field.value) ? field.value : [field.value] as item}
              <span class="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {item}
              </span>
            {/each}
          </div>
        {:else if field.type === 'list'}
          <ul class="text-sm space-y-1">
            {#each Array.isArray(field.value) ? field.value : [field.value] as item}
              <li>• {item}</li>
            {/each}
          </ul>
        {:else if field.type === 'copyable'}
          <CopyButton value={String(field.value)} defanged={field.defanged} />
        {:else}
          <p class="text-sm">{field.value}</p>
        {/if}
      </div>
    {/each}

    <!-- Fallback for indicator if no fields found -->
    {#if obj.type === 'indicator' && getObjectFields(obj).length === 0}
      <div class="space-y-3 mb-4">
        {#if obj['pattern']}
          <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
            <p class="text-xs font-semibold mb-1">Pattern:</p>
            <p class="text-xs font-mono bg-slate-900 dark:bg-slate-700 text-green-400 p-2 rounded overflow-auto">
              {obj['pattern']}
            </p>
          </div>
        {/if}

        {#if obj.valid_from}
          <div class="text-xs">
            <strong>Valid From:</strong>
            {new Date(obj.valid_from).toLocaleString()}
          </div>
        {/if}

        {#if obj.valid_until}
          <div class="text-xs">
            <strong>Valid Until:</strong>
            {new Date(obj.valid_until).toLocaleString()}
          </div>
        {/if}

        {#if obj.kill_chain_phases && obj.kill_chain_phases.length > 0}
          <div>
            <p class="text-xs font-semibold mb-1">Kill Chain Phases:</p>
            <div class="flex flex-wrap gap-1">
              {#each obj.kill_chain_phases as phase}
                <span class="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {phase.phase_name}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    <!-- malware/threat-actor details come from getObjectFields above;
         dedicated blocks here previously rendered the same data twice -->

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

    {#if relatedObjects.length > 0}
      <div class="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
        <h2 class="font-bold mb-3">Related Objects</h2>
        <div class="space-y-2">
          {#each relatedObjects as related (related.obj.id + related.label)}
            <button
              on:click={() => openObject(related.obj.id)}
              class="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left"
            >
              <p class="font-semibold text-sm">
                {getObjectIcon(related.obj.type)} {related.obj.name || related.obj.id.split('--')[1]}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                {related.obj.type} <span class="italic">({related.label})</span>
              </p>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700">
      <p class="text-xs text-slate-500 dark:text-slate-400">
        <strong>Created:</strong> {formatDate(obj.created)}
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        <strong>Modified:</strong> {formatDate(obj.modified)}
      </p>
    </div>
  {/if}
</div>
