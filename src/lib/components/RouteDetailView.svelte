<script>
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { formatDistance, formatTime } from '$lib/utils.js';
	import { appState } from '$lib/stores.js';
	
	export let route;
	
	let map;
	let L;
	let mapElement;
	
	onMount(async () => {
		L = await import('leaflet');
		
		// Fix Leaflet icon issue
		delete L.Icon.Default.prototype._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
			iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
		});
		
		// Initialize map
		map = L.map(mapElement, {
			zoomControl: true,
			dragging: true,
			touchZoom: true,
			scrollWheelZoom: true,
			doubleClickZoom: true
		});
		
		// Add tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);
		
		// Draw the route
		const routeLine = L.polyline(route.positions, {
			color: '#10B981',
			weight: 5,
			opacity: 0.8
		}).addTo(map);
		
		// Add start marker
		L.marker(route.positions[0])
			.addTo(map)
			.bindPopup('Start: ' + route.startTime)
			.openPopup();
		
		// Add end marker
		L.marker(route.positions[route.positions.length - 1])
			.addTo(map)
			.bindPopup('End: ' + route.endTime);
		
		// Fit map to route bounds
		map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
		
		return () => {
			if (map) {
				map.remove();
			}
		};
	});
	
	function goBack() {
		$appState = 'history';
	}
</script>

<div class="h-screen flex flex-col">
	<!-- Header with route info -->
	<div class="bg-white p-5 shadow-md z-[100] sm:p-4">
		<button class="bg-transparent border-none text-blue-500 text-base cursor-pointer mb-4 p-1 hover:underline" on:click={goBack}>
			← Back to Routes
		</button>
		
		<div class="mb-5">
			<h1 class="text-2xl font-bold m-0 mb-1 text-gray-800">{route.name}</h1>
			<p class="text-base text-gray-500 m-0">{new Date(route.date).toLocaleDateString()}</p>
			<p class="text-sm text-gray-400 mt-1 mb-0">{route.startTime} - {route.endTime}</p>
		</div>
		
		<div class="flex gap-8 sm:gap-5">
			<div class="flex flex-col items-center">
				<span class="text-xl font-bold text-gray-800 sm:text-lg">{formatDistance(route.distance)}</span>
				<span class="text-xs text-gray-500 mt-1">Distance</span>
			</div>
			<div class="flex flex-col items-center">
				<span class="text-xl font-bold text-gray-800 sm:text-lg">{formatTime(route.duration)}</span>
				<span class="text-xs text-gray-500 mt-1">Duration</span>
			</div>
			<div class="flex flex-col items-center">
				<span class="text-xl font-bold text-gray-800 sm:text-lg">{route.avgSpeed.toFixed(1)} km/h</span>
				<span class="text-xs text-gray-500 mt-1">Avg Speed</span>
			</div>
		</div>
	</div>
	
	<!-- Map -->
	<div class="flex-1 relative">
		<div bind:this={mapElement} class="w-full h-full"></div>
	</div>
</div>