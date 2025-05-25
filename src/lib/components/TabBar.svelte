<script>
	import { appState } from '$lib/stores.js';
	
	export let onHistoryClick = () => {};
</script>

{#if $appState === 'idle'}
<div class="fixed bottom-5 right-5 flex gap-2.5 z-[400] pb-safe">
	<button 
		class="px-7 py-3.5 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg text-white bg-gray-500 hover:bg-gray-600 hover:scale-105 hover:shadow-xl"
		on:click={() => {
			$appState = 'history';
			onHistoryClick();
		}}>
		Routes
	</button>
</div>
{:else if $appState === 'history'}
<div class="fixed bottom-5 right-5 flex gap-2.5 z-[400] pb-safe">
	<button 
		class="px-7 py-3.5 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg text-white bg-gray-500 hover:bg-gray-600 hover:scale-105 hover:shadow-xl"
		on:click={() => $appState = 'idle'}>
		Map
	</button>
</div>
{/if}