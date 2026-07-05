<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    loadSettingsAsync,
    saveSettingsAsync,
    saveBundleAsync,
    saveFeedCacheAsync,
    getFeedCacheAsync,
  } from '$lib/storage/db';
  import { parseBundle } from '$lib/stix/parser';
  import { TAXIIClient } from '$lib/taxii/client';

  const dispatch = createEventDispatcher();

  interface Report {
    id: string;
    name: string;
    published: string;
    description?: string;
  }

  let reports: Report[] = [];
  let loading = false;
  let error: string | null = null;
  let lastSyncTime: string | null = null;
  let isOnline = navigator.onLine;

  onMount(async () => {
    await loadFeed();
  });

  async function loadFeed() {
    try {
      const settings = await loadSettingsAsync();

      if (
        settings.mode !== 'gnat' ||
        !settings.gnatInstanceUrl ||
        !settings.gnatApiKey
      ) {
        error = 'GNAT instance not configured. Please configure in Settings.';
        return;
      }

      if (!isOnline) {
        // Load cached reports
        await loadCachedFeed();
        return;
      }

      loading = true;
      error = null;

      try {
        const response = await fetch(
          `${settings.gnatInstanceUrl}/api/reports`,
          {
            headers: {
              'X-Api-Key': settings.gnatApiKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        const reportsList = (data.reports || data.objects || []) as Report[];

        reports = reportsList.sort(
          (a, b) =>
            new Date(b.published || 0).getTime() -
            new Date(a.published || 0).getTime()
        );

        // Cache the feed
        const now = new Date().toLocaleString();
        lastSyncTime = now;
        await saveFeedCacheAsync(reports, now);

        // Update last sync time in settings
        await saveSettingsAsync({ lastFeedSync: Date.now() });
      } catch (e) {
        error = `Failed to fetch feed: ${e instanceof Error ? e.message : String(e)}`;
        console.error(error, e);
        // Fall back to cached feed if online request fails
        await loadCachedFeed();
      }
    } catch (e) {
      error = `Error loading feed: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
    } finally {
      loading = false;
    }
  }

  async function loadCachedFeed() {
    try {
      const cached = await getFeedCacheAsync();
      if (cached) {
        reports = cached.reports as Report[];
        lastSyncTime = cached.syncTime;
      }
    } catch (e) {
      console.error('Failed to load cached feed:', e);
    }
  }

  async function openReport(report: Report) {
    try {
      const settings = await loadSettingsAsync();

      if (!settings.gnatInstanceUrl || !settings.gnatApiKey) {
        error = 'GNAT instance not configured';
        return;
      }

      loading = true;
      error = null;

      const client = new TAXIIClient(
        settings.gnatInstanceUrl,
        settings.gnatApiKey
      );
      const bundle = await client.getObject(report.id);

      if (!bundle) {
        error = 'Failed to fetch bundle';
        return;
      }

      const bundleData = bundle as Record<string, unknown>;
      parseBundle(JSON.stringify(bundleData));

      const bundleId = (bundleData.id as string) || report.id;
      await saveBundleAsync(bundleId, report.name, bundleData, 'gnat');

      dispatch('navigate', { route: 'bundle', params: { bundleId } });
    } catch (e) {
      error = `Error fetching report: ${e instanceof Error ? e.message : String(e)}`;
      console.error(error, e);
    } finally {
      loading = false;
    }
  }

  async function handleRefresh() {
    if (!isOnline) {
      error = 'No network connection. Showing cached feed.';
      return;
    }
    await loadFeed();
  }
</script>

<svelte:window
  on:online={() => (isOnline = true)}
  on:offline={() => (isOnline = false)}
/>

<div class="p-4 pb-20">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">📡 Feed</h1>
    <button
      on:click={handleRefresh}
      disabled={loading}
      class="px-3 py-1 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
    >
      {loading ? 'Loading...' : '↻'}
    </button>
  </div>

  {#if error}
    <div
      class="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm"
    >
      {error}
    </div>
  {/if}

  {#if !isOnline}
    <div
      class="mb-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2"
    >
      📵 Offline mode - showing cached feed
    </div>
  {/if}

  {#if lastSyncTime}
    <div class="mb-4 text-xs text-slate-500 dark:text-slate-400">
      Last synced: {lastSyncTime}
    </div>
  {/if}

  {#if reports.length === 0}
    <p class="text-center text-slate-500 dark:text-slate-400 py-8">
      {loading ? 'Loading reports...' : 'No reports available'}
    </p>
  {:else}
    <div class="space-y-2">
      {#each reports as report (report.id)}
        <button
          on:click={() => openReport(report)}
          disabled={loading}
          class="w-full p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left disabled:opacity-50"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="font-semibold text-sm">{report.name}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {report.published
                  ? new Date(report.published).toLocaleString()
                  : '—'}
              </p>
              {#if report.description}
                <p
                  class="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2"
                >
                  {report.description}
                </p>
              {/if}
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500 ml-2">→</p>
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
