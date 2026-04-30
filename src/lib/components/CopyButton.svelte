<script lang="ts">
  export let value: string;
  export let label: string = 'Copy';
  export let defanged: string | null = null;

  let copied = false;
  let showDefanged = false;

  function defang(text: string): string {
    return text
      .replace(/https?:\/\//g, 'hxxp://')
      .replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/g, '$1.$2.$3[.]$4')
      .replace(/\[.\]/g, '[.]');
  }

  function handleCopy() {
    const textToCopy = showDefanged && defanged ? defanged : value;
    navigator.clipboard.writeText(textToCopy).then(() => {
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    });
  }
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
    title={copied ? 'Copied!' : 'Copy'}
    class="px-2 py-1 rounded text-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
  >
    {copied ? '✓' : '📋'}
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
