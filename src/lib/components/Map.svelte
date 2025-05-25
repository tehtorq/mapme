<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import TrackingStats from './TrackingStats.svelte';
	import TrackingControls from './TrackingControls.svelte';
	import { calculateDistance, calculateSpeed } from '$lib/utils.js';
	import { appState } from '$lib/stores.js';
	
	const dispatch = createEventDispatcher();
	
	// Map variables
	let map;
	let L;
	let tileLayer;
	let mapElement;
	let mapStyle = 'street';
	let autoCenter = true;
	
	// Tracking variables
	export let tracking = false;
	export let paused = false;
	let positions = [];
	let timestamps = [];
	let watchId = null;
	let routeLine = null;
	let currentMarker = null;
	let startTime = null;
	let elapsedTime = 0;
	let distance = 0;
	let currentSpeed = 0;
	let avgSpeed = 0;
	let timer = null;
	
	const mapStyles = {
		street: {
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			attribution: '© OpenStreetMap contributors'
		},
		satellite: {
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			attribution: '© Esri'
		}
	};
	
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
			zoomControl: false
		}).setView([40.7128, -74.0060], 13);
		
		L.control.zoom({
			position: 'topright'
		}).addTo(map);
		
		tileLayer = L.tileLayer(mapStyles[mapStyle].url, {
			attribution: mapStyles[mapStyle].attribution,
			maxZoom: 19
		}).addTo(map);
		
		// Get user's current location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					map.setView([latitude, longitude], 16);
					
					currentMarker = L.marker([latitude, longitude])
						.addTo(map)
						.bindPopup('Current location');
				},
				(error) => {
					console.error('Error getting location:', error);
					// Keep default NYC location if geolocation fails
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				}
			);
		}
	});
	
	onDestroy(() => {
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
		}
		if (timer !== null) {
			clearInterval(timer);
		}
		if (map) {
			map.remove();
		}
	});
	
	export function invalidateSize() {
		if (map) {
			setTimeout(() => {
				map.invalidateSize();
			}, 100);
		}
	}
	
	export function showRoute(route) {
		if (!map || !L) return;
		
		// Clear existing route if any
		if (routeLine) {
			map.removeLayer(routeLine);
		}
		
		// Draw the selected route
		routeLine = L.polyline(route.positions, {
			color: '#10B981',
			weight: 5,
			opacity: 0.8
		}).addTo(map);
		
		// Add start and end markers
		L.marker(route.positions[0])
			.addTo(map)
			.bindPopup('Start')
			.openPopup();
		
		L.marker(route.positions[route.positions.length - 1])
			.addTo(map)
			.bindPopup('End');
		
		// Fit map to route bounds
		map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
	}
	
	function changeMapStyle(style) {
		if (!L || !map) return;
		mapStyle = style;
		if (tileLayer) {
			map.removeLayer(tileLayer);
			tileLayer = L.tileLayer(mapStyles[mapStyle].url, {
				attribution: mapStyles[mapStyle].attribution,
				maxZoom: 19
			}).addTo(map);
		}
	}
	
	function startTracking() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}
		
		$appState = 'tracking';
		tracking = true;
		paused = false;
		positions = [];
		timestamps = [];
		startTime = Date.now();
		
		timer = setInterval(() => {
			if (!paused) {
				elapsedTime = Math.floor((Date.now() - startTime) / 1000);
			}
		}, 1000);
		
		watchId = navigator.geolocation.watchPosition(
			(position) => {
				if (paused) return;
				
				const { latitude, longitude, speed, accuracy } = position.coords;
				
				if (accuracy > 50) return;
				
				positions = [...positions, [latitude, longitude]];
				timestamps = [...timestamps, Date.now()];
				
				if (currentMarker) {
					currentMarker.setLatLng([latitude, longitude]);
				}
				
				if (positions.length > 1) {
					distance = calculateDistance(positions);
					avgSpeed = calculateSpeed(distance, elapsedTime);
					currentSpeed = speed ? speed * 3.6 : 0;
				}
				
				if (positions.length > 1) {
					if (routeLine) {
						routeLine.setLatLngs(positions);
					} else {
						routeLine = L.polyline(positions, {
							color: '#3B82F6',
							weight: 5,
							opacity: 0.8,
							smoothFactor: 1
						}).addTo(map);
					}
				}
				
				if (autoCenter) {
					map.setView([latitude, longitude], map.getZoom(), {
						animate: true,
						duration: 0.5
					});
				}
			},
			(error) => {
				console.error('Error tracking position:', error);
			},
			{
				enableHighAccuracy: true,
				maximumAge: 0,
				timeout: 5000
			}
		);
	}
	
	function pauseTracking() {
		paused = !paused;
		if (paused) {
			startTime += Date.now() - (startTime + elapsedTime * 1000);
		}
	}
	
	function stopTracking() {
		$appState = 'idle';
		tracking = false;
		paused = false;
		
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}
		
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
		
		if (positions.length > 1) {
			const route = {
				positions,
				timestamps,
				distance,
				duration: elapsedTime,
				avgSpeed,
				startTime: new Date(timestamps[0]).toLocaleTimeString(),
				endTime: new Date(timestamps[timestamps.length - 1]).toLocaleTimeString()
			};
			
			console.log('Dispatching route complete event:', route);
			dispatch('routeComplete', route);
			
			// Clear the route from map
			if (routeLine) {
				map.removeLayer(routeLine);
				routeLine = null;
			}
			
			// Reset stats
			positions = [];
			timestamps = [];
			distance = 0;
			elapsedTime = 0;
			currentSpeed = 0;
			avgSpeed = 0;
		}
	}
	
	function toggleAutoCenter() {
		autoCenter = !autoCenter;
	}
</script>

<div class="map-container">
	<div id="map" bind:this={mapElement}></div>
	
	{#if tracking}
		<TrackingStats {elapsedTime} {distance} {currentSpeed} {avgSpeed} />
	{/if}
	
	<div class="map-controls">
		<button 
			class="map-control {autoCenter ? 'active' : ''}" 
			on:click={toggleAutoCenter}
			title="Auto-center">
			📍
		</button>
	</div>
	
	<div class="map-styles">
		<button 
			class="style-button {mapStyle === 'street' ? 'active' : ''}"
			on:click={() => changeMapStyle('street')}>
			Street
		</button>
		<button 
			class="style-button {mapStyle === 'satellite' ? 'active' : ''}"
			on:click={() => changeMapStyle('satellite')}>
			Satellite
		</button>
	</div>
	
	<TrackingControls 
		{tracking} 
		{paused} 
		onStart={startTracking}
		onPause={pauseTracking}
		onStop={stopTracking}
	/>
</div>

<style>
	.map-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
	
	#map {
		width: 100%;
		height: 100%;
	}
	
	.map-controls {
		position: absolute;
		top: 10px;
		right: 60px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		z-index: 400;
	}
	
	.map-control {
		background: white;
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		cursor: pointer;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		transition: all 0.2s;
	}
	
	.map-control:hover {
		background: #F3F4F6;
		transform: scale(1.05);
	}
	
	.map-control.active {
		background: #3B82F6;
		color: white;
	}
	
	.map-styles {
		position: absolute;
		bottom: 80px;
		right: 10px;
		display: flex;
		gap: 5px;
		z-index: 400;
		background: rgba(255, 255, 255, 0.9);
		padding: 5px;
		border-radius: 8px;
	}
	
	.style-button {
		padding: 8px 12px;
		border: none;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s;
	}
	
	.style-button:hover { 
		background: #F3F4F6; 
	}
	
	.style-button.active { 
		background: #3B82F6; 
		color: white; 
	}
	
	@media (max-width: 640px) {
		.map-styles {
			bottom: 70px;
		}
	}
</style>

