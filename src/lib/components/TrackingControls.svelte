<script>
	export let tracking = false;
	export let paused = false;
	export let onStart = () => {};
	export let onPause = () => {};
	export let onStop = () => {};
</script>

<div class="controls">
	{#if !tracking}
		<button class="control-button start" on:click={onStart}>
			Start Tracking
		</button>
	{:else}
		{#if !paused}
			<button class="control-button pause" on:click={onPause}>
				Pause
			</button>
		{:else}
			<button class="control-button resume" on:click={onPause}>
				Resume
			</button>
		{/if}
		<button class="control-button stop" on:click={onStop}>
			Stop
		</button>
	{/if}
</div>

<style>
	.controls {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 10px;
		z-index: 400;
	}
	
	.control-button {
		padding: 15px 30px;
		border: none;
		border-radius: 30px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 15px rgba(0,0,0,0.2);
		color: white;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.start { background: #10B981; }
	.start:hover { background: #059669; }
	.pause { background: #F59E0B; }
	.pause:hover { background: #D97706; }
	.resume { background: #3B82F6; }
	.resume:hover { background: #2563EB; }
	.stop { background: #EF4444; }
	.stop:hover { background: #DC2626; }
</style>

