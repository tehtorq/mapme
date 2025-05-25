<script>
	import { onMount } from 'svelte';
	import RouteCard from './RouteCard.svelte';
	import { getRoutes, deleteRoute } from '$lib/storage.js';
	import { appState } from '$lib/stores.js';
	
	export let onViewRoute = () => {};
	export let onExportRoute = () => {};
	
	let routes = [];
	
	onMount(() => {
		routes = getRoutes();
	});
	
	function handleDelete(id) {
		if (confirm('Delete this route?')) {
			deleteRoute(id);
			routes = getRoutes();
		}
	}
	
	export function refresh() {
		console.log('Refreshing routes list...');
		routes = getRoutes();
		console.log('Current routes:', routes);
	}
	
	// Refresh routes when switching to history view
	$: if ($appState === 'history') {
		routes = getRoutes();
	}
</script>

<div class="history-container">
	<div class="history-header">
		<h1 class="history-title">Your Routes</h1>
	</div>
	
	<div class="route-list">
		{#if routes.length === 0}
			<div class="empty-state">
				<p>No routes recorded yet.</p>
				<p>Tap the map tab to start tracking!</p>
			</div>
		{:else}
			{#each routes as route (route.id)}
				<RouteCard 
					{route}
					onView={() => onViewRoute(route)}
					onExport={() => onExportRoute(route)}
					onDelete={() => handleDelete(route.id)}
				/>
			{/each}
		{/if}
	</div>
</div>

<style>
	.history-container {
		height: 100%;
		overflow-y: auto;
		background: #F3F4F6;
	}
	
	.history-header {
		background: white;
		padding: 20px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}
	
	.history-title {
		font-size: 24px;
		font-weight: 700;
		margin: 0;
	}
	
	.route-list {
		padding: 15px;
		display: flex;
		flex-direction: column;
		gap: 15px;
		padding-bottom: 100px;
	}
	
	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: #6B7280;
	}
</style>

