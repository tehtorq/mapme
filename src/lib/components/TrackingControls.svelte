<script>
	export let tracking = false;
	export let paused = false;
	export let onStart = () => {};
	export let onPause = () => {};
	export let onStop = () => {};
</script>

<div class="fixed bottom-0 left-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex gap-2.5 z-[400]">
	{#if !tracking}
		<button class="px-7 py-3.5 border-none rounded-full text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg text-white flex items-center gap-2 bg-green-500 hover:bg-green-600" on:click={onStart}>
			Start Tracking
		</button>
	{:else}
		{#if !paused}
			<button class="px-7 py-3.5 border-none rounded-full text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg text-white flex items-center gap-2 bg-amber-500 hover:bg-amber-600" on:click={onPause}>
				Pause
			</button>
		{:else}
			<button class="px-7 py-3.5 border-none rounded-full text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg text-white flex items-center gap-2 bg-blue-500 hover:bg-blue-600" on:click={onPause}>
				Resume
			</button>
		{/if}
		<button class="px-7 py-3.5 border-none rounded-full text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg text-white flex items-center gap-2 bg-red-500 hover:bg-red-600" on:click={onStop}>
			Stop
		</button>
	{/if}
</div>

