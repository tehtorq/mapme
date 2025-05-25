<script>
	import { appState } from '$lib/stores.js';
	
	export let onHistoryClick = () => {};
</script>

{#if $appState === 'idle'}
<div class="floating-nav">
	<button 
		class="nav-button"
		on:click={() => {
			$appState = 'history';
			onHistoryClick();
		}}>
		Routes
	</button>
</div>
{:else if $appState === 'history'}
<div class="floating-nav">
	<button 
		class="nav-button"
		on:click={() => $appState = 'idle'}>
		Map
	</button>
</div>
{/if}

<style>
	.floating-nav {
		position: absolute;
		bottom: 20px;
		right: 20px;
		display: flex;
		gap: 10px;
		z-index: 400;
	}
	
	.nav-button {
		padding: 15px 30px;
		border: none;
		border-radius: 30px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 15px rgba(0,0,0,0.2);
		color: white;
		background: #6B7280;
	}
	
	.nav-button:hover {
		background: #4B5563;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0,0,0,0.25);
	}
</style>

