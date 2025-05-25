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

<div class="route-detail-container">
	<!-- Header with route info -->
	<div class="route-header">
		<button class="back-button" on:click={goBack}>
			← Back to Routes
		</button>
		
		<div class="route-info">
			<h1 class="route-title">{route.name}</h1>
			<p class="route-date">{new Date(route.date).toLocaleDateString()}</p>
			<p class="route-time">{route.startTime} - {route.endTime}</p>
		</div>
		
		<div class="route-stats">
			<div class="stat">
				<span class="stat-value">{formatDistance(route.distance)}</span>
				<span class="stat-label">Distance</span>
			</div>
			<div class="stat">
				<span class="stat-value">{formatTime(route.duration)}</span>
				<span class="stat-label">Duration</span>
			</div>
			<div class="stat">
				<span class="stat-value">{route.avgSpeed.toFixed(1)} km/h</span>
				<span class="stat-label">Avg Speed</span>
			</div>
		</div>
	</div>
	
	<!-- Map -->
	<div class="map-container">
		<div id="route-detail-map" bind:this={mapElement}></div>
	</div>
</div>

<style>
	.route-detail-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.route-header {
		background: white;
		padding: 20px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		z-index: 100;
	}
	
	.back-button {
		background: none;
		border: none;
		color: #3B82F6;
		font-size: 16px;
		cursor: pointer;
		margin-bottom: 15px;
		padding: 5px 0;
	}
	
	.back-button:hover {
		text-decoration: underline;
	}
	
	.route-info {
		margin-bottom: 20px;
	}
	
	.route-title {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 5px 0;
		color: #1F2937;
	}
	
	.route-date {
		font-size: 16px;
		color: #6B7280;
		margin: 0;
	}
	
	.route-time {
		font-size: 14px;
		color: #9CA3AF;
		margin: 5px 0 0 0;
	}
	
	.route-stats {
		display: flex;
		gap: 30px;
	}
	
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.stat-value {
		font-size: 20px;
		font-weight: 700;
		color: #1F2937;
	}
	
	.stat-label {
		font-size: 12px;
		color: #6B7280;
		margin-top: 4px;
	}
	
	.map-container {
		flex: 1;
		position: relative;
	}
	
	#route-detail-map {
		width: 100%;
		height: 100%;
	}
	
	@media (max-width: 640px) {
		.route-header {
			padding: 15px;
		}
		
		.route-stats {
			gap: 20px;
		}
		
		.stat-value {
			font-size: 18px;
		}
	}
</style>

