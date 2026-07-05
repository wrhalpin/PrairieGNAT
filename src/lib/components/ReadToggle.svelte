<script lang="ts">
  import { onMount } from 'svelte';
  import { setReadStateAsync, getReadStateAsync } from '$lib/storage/db';

  export let bundleId: string;
  export let objectId: string;

  let isRead = false;
  let loading = false;
  let interacted = false;

  onMount(async () => {
    try {
      const readState = await getReadStateAsync(bundleId);
      // Don't clobber a toggle the user made before this read resolved
      if (!interacted) {
        isRead = readState.has(objectId);
      }
    } catch (e) {
      console.error('Failed to load read state:', e);
    }
  });

  async function toggleRead() {
    try {
      interacted = true;
      loading = true;
      await setReadStateAsync(bundleId, objectId, !isRead);
      isRead = !isRead;
    } catch (e) {
      console.error('Failed to toggle read state:', e);
    } finally {
      loading = false;
    }
  }
</script>

<button
  on:click={toggleRead}
  disabled={loading}
  aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
  class={`px-3 py-1 rounded text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
    isRead
      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
  } disabled:opacity-50`}
>
  {isRead ? '✓' : '○'}
  {isRead ? 'Read' : 'Unread'}
</button>
