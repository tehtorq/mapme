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

<div class="h-full overflow-y-auto bg-gray-100 relative">
	<div class="bg-white p-5 shadow-lg sticky top-0 z-[500]">
		<h1 class="text-2xl font-bold m-0">Your Routes</h1>
	</div>
	
	<div class="p-4 flex flex-col gap-4 pb-24">
		{#if routes.length === 0}
			<div class="text-center py-16 px-5 text-gray-500">
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