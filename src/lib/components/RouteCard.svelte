<script>
	import { onMount } from 'svelte';
	import { formatDistance, formatTime } from '$lib/utils.js';
	
	export let route;
	export let onView = () => {};
	export let onExport = () => {};
	export let onDelete = () => {};
	
	let miniMap;
	let mapElement;
	
	onMount(async () => {
		const L = await import('leaflet');
		
		if (mapElement) {
			miniMap = L.map(mapElement, {
				zoomControl: false,
				attributionControl: false,
				dragging: false,
				scrollWheelZoom: false,
				doubleClickZoom: false,
				touchZoom: false
			});
			
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19
			}).addTo(miniMap);
			
			const routeLine = L.polyline(route.positions, {
				color: '#3B82F6',
				weight: 3,
				opacity: 0.8
			}).addTo(miniMap);
			
			miniMap.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
		}
		
		return () => {
			if (miniMap) {
				miniMap.remove();
			}
		};
	});
	
	function handleKeydown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onView();
		}
	}
</script>

<div class="bg-white rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-blue-500" 
	on:click={onView} 
	on:keydown={handleKeydown} 
	role="button" 
	tabindex="0" 
	aria-label="View route details">
	<div class="w-full h-[150px] bg-gray-200" bind:this={mapElement}></div>
	<div class="p-4">
		<div class="flex justify-between items-start mb-2.5">
			<div>
				<div class="text-base font-semibold text-gray-800">
					{new Date(route.date).toLocaleDateString()}
				</div>
				<div class="text-sm text-gray-500">
					{route.startTime} - {route.endTime}
				</div>
			</div>
		</div>
		
		<div class="grid grid-cols-3 gap-2.5 mb-2.5">
			<div class="text-center">
				<div class="text-lg font-bold text-gray-800">{formatDistance(route.distance)}</div>
				<div class="text-xs text-gray-500">Distance</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-bold text-gray-800">{formatTime(route.duration)}</div>
				<div class="text-xs text-gray-500">Duration</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-bold text-gray-800">{route.avgSpeed.toFixed(1)} km/h</div>
				<div class="text-xs text-gray-500">Avg Speed</div>
			</div>
		</div>
		
		<div class="flex gap-2.5 mt-2.5">
			<button class="flex-1 p-2 border-none rounded-lg text-sm cursor-pointer transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200" on:click|stopPropagation={onExport}>
				Export
			</button>
			<button class="flex-1 p-2 border-none rounded-lg text-sm cursor-pointer transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200" on:click|stopPropagation={onDelete}>
				Delete
			</button>
		</div>
	</div>
</div>