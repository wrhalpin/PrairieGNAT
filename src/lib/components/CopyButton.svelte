<script lang="ts">
  import { onDestroy } from 'svelte';

  export let value: string;
  export let defanged: string | null = null;

  let copied = false;
  let copyFailed = false;
  // Safe by default for a triage tool: show/copy the defanged form first and
  // require an explicit toggle to get the live IOC.
  let showDefanged = defanged != null;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function handleCopy() {
    const textToCopy = showDefanged && defanged ? defanged : value;
    try {
      await navigator.clipboard.writeText(textToCopy);
      copied = true;
      copyFailed = false;
    } catch {
      // Clipboard denied (iOS permission, non-secure context)
      copied = false;
      copyFailed = true;
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copied = false;
      copyFailed = false;
    }, 2000);
  }

  onDestroy(() => clearTimeout(resetTimer));
</script>

<div class="flex gap-2 items-center">
  <div
    class={`px-2 py-1 rounded text-sm font-mono bg-slate-100 dark:bg-slate-800 max-w-xs overflow-auto ${
      showDefanged ? 'text-orange-600 dark:text-orange-400' : ''
    }`}
  >
    {showDefanged && defanged ? defanged : value}
  </div>

  <button
    on:click={handleCopy}
    aria-label="Copy to clipboard"
    title={copied ? 'Copied!' : copyFailed ? 'Copy failed — check clipboard permissions' : 'Copy'}
    class="px-2 py-1 rounded text-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
  >
    {copied ? '✓' : copyFailed ? '⚠️' : '📋'}
  </button>

  {#if defanged}
    <button
      on:click={() => (showDefanged = !showDefanged)}
      aria-label={showDefanged ? 'Show real value' : 'Show defanged value'}
      class="px-2 py-1 rounded text-xs bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      {showDefanged ? '👁️' : '🚫'}
    </button>
  {/if}
</div>
