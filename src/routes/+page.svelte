<script>
	import Map from '$lib/components/Map.svelte';
	import RoutesList from '$lib/components/RoutesList.svelte';
	import RouteDetailView from '$lib/components/RouteDetailView.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import { appState, selectedRoute } from '$lib/stores.js';
	import { saveRoute } from '$lib/storage.js';
	import { getCurrentTimestamp, generateRouteId } from '$lib/utils.js';
	
	let mapComponent;
	let routesListComponent;
	
	function handleRouteComplete(event) {
		const routeData = event.detail;
		console.log('Route complete:', routeData);
		
		const route = {
			id: generateRouteId(),
			name: `Route ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
			...routeData,
			date: getCurrentTimestamp()
		};
		
		console.log('Saving route:', route);
		saveRoute(route);
		
		// Switch to history view to show the new route
		$appState = 'history';
	}
	
	function handleViewRoute(route) {
		$selectedRoute = route;
		$appState = 'viewing-route';
	}
	
	function handleExportRoute(route) {
		const gpx = generateGPX(route);
		const blob = new Blob([gpx], { type: 'application/gpx+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `route_${route.date.split('T')[0]}.gpx`;
		a.click();
		URL.revokeObjectURL(url);
	}
	
	function generateGPX(route) {
		const points = route.positions.map((pos, i) => {
			const timestamp = route.timestamps?.[i] 
				? new Date(route.timestamps[i]).toISOString() 
				: new Date(route.date).toISOString();
			return `<trkpt lat="${pos[0]}" lon="${pos[1]}">
				<time>${timestamp}</time>
			</trkpt>`;
		}).join('\n\t\t\t');
		
		return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MapMe">
	<metadata>
		<name>${route.name}</name>
		<time>${route.date}</time>
	</metadata>
	<trk>
		<name>${route.name}</name>
		<trkseg>
			${points}
		</trkseg>
	</trk>
</gpx>`;
	}
	
	// Handle map size invalidation when switching to idle state
	$: if ($appState === 'idle' && mapComponent) {
		mapComponent.invalidateSize();
	}
</script>

<div class="app-container">
	<div class="view-container">
		{#if $appState === 'idle' || $appState === 'tracking'}
			<Map 
				bind:this={mapComponent}
				on:routeComplete={handleRouteComplete} 
			/>
		{:else if $appState === 'history'}
			<RoutesList 
				bind:this={routesListComponent}
				onViewRoute={handleViewRoute}
				onExportRoute={handleExportRoute}
			/>
		{:else if $appState === 'viewing-route' && $selectedRoute}
			<RouteDetailView route={$selectedRoute} />
		{/if}
	</div>
	
	<TabBar />
</div>

<style>
	.app-container {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
	}
	
	.view-container {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
</style>

