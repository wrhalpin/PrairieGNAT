<script lang="ts">
  import { onMount } from 'svelte';
  import { addBookmarkAsync, removeBookmarkAsync, getBookmarksAsync } from '$lib/storage/db';

  export let bundleId: string;
  export let objectId: string;

  let isBookmarked = false;
  let loading = false;

  onMount(async () => {
    try {
      const bookmarks = await getBookmarksAsync(bundleId);
      isBookmarked = bookmarks.has(objectId);
    } catch (e) {
      console.error('Failed to load bookmark state:', e);
    }
  });

  async function toggleBookmark() {
    try {
      loading = true;
      if (isBookmarked) {
        await removeBookmarkAsync(bundleId, objectId);
      } else {
        await addBookmarkAsync(bundleId, objectId);
      }
      isBookmarked = !isBookmarked;
    } catch (e) {
      console.error('Failed to toggle bookmark:', e);
    } finally {
      loading = false;
    }
  }
</script>

<button
  on:click={toggleBookmark}
  disabled={loading}
  aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
  class={`px-3 py-1 rounded text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
    isBookmarked
      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
  } disabled:opacity-50`}
>
  {isBookmarked ? '★' : '☆'} {isBookmarked ? 'Bookmarked' : 'Bookmark'}
</button>
