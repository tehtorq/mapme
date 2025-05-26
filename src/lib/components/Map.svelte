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
	let locationFound = false;
	let locationError = false;
	
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
	let wakeLock = null;
	let notification = null;
	let notificationTimeout = null;
	
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
		// Get user's current location first
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;
					locationFound = true;
					
					// Now initialize the map with user's location
					L = await import('leaflet');
					
					// Fix Leaflet icon issue
					delete L.Icon.Default.prototype._getIconUrl;
					L.Icon.Default.mergeOptions({
						iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
						iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
						shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
					});
					
					// Initialize map at user's location
					map = L.map(mapElement, {
						zoomControl: false
					}).setView([latitude, longitude], 16);
					
					L.control.zoom({
						position: 'topright'
					}).addTo(map);
					
					tileLayer = L.tileLayer(mapStyles[mapStyle].url, {
						attribution: mapStyles[mapStyle].attribution,
						maxZoom: 19
					}).addTo(map);
					
					currentMarker = L.marker([latitude, longitude])
						.addTo(map)
						.bindPopup('Current location');
				},
				(error) => {
					console.error('Error getting location:', error);
					locationError = true;
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				}
			);
		} else {
			locationError = true;
		}
	});
	
	// Handle page visibility changes to re-acquire wake lock
	function handleVisibilityChange() {
		if (!document.hidden && tracking && !wakeLock) {
			// Re-acquire wake lock when page becomes visible
			if ('wakeLock' in navigator) {
				navigator.wakeLock.request('screen').then(lock => {
					wakeLock = lock;
					wakeLock.addEventListener('release', () => {
						console.log('Wake Lock was released');
					});
					console.log('Wake Lock re-acquired');
				}).catch(err => {
					console.error('Failed to re-acquire wake lock:', err);
				});
			}
		}
	}
	
	onMount(() => {
		document.addEventListener('visibilitychange', handleVisibilityChange);
	});
	
	onDestroy(() => {
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		
		if (wakeLock !== null) {
			wakeLock.release().catch(() => {});
		}
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
	
	async function startTracking() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}
		
		// Request wake lock to prevent screen from sleeping
		if ('wakeLock' in navigator) {
			try {
				wakeLock = await navigator.wakeLock.request('screen');
				wakeLock.addEventListener('release', () => {
					console.log('Wake Lock was released');
				});
				console.log('Wake Lock is active');
				// Show notification about screen staying on
				showNotification('Screen will stay on during tracking');
			} catch (err) {
				console.error(`${err.name}, ${err.message}`);
			}
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
				
				// Ignore readings with poor accuracy
				if (accuracy > 50) return;
				
				// Check if we've moved at least 5 meters from the last recorded position
				const MIN_DISTANCE_METERS = 5;
				let shouldRecordPosition = true;
				
				if (positions.length > 0) {
					const lastPos = positions[positions.length - 1];
					const distanceFromLast = L.latLng(lastPos[0], lastPos[1])
						.distanceTo(L.latLng(latitude, longitude));
					
					// Only record if we've moved more than the minimum distance
					shouldRecordPosition = distanceFromLast >= MIN_DISTANCE_METERS;
				}
				
				// Always update the current marker position for visual feedback
				if (currentMarker) {
					currentMarker.setLatLng([latitude, longitude]);
				}
				
				// Only record position and update stats if we've moved enough
				if (shouldRecordPosition) {
					positions = [...positions, [latitude, longitude]];
					timestamps = [...timestamps, Date.now()];
					
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
	
	async function stopTracking() {
		$appState = 'idle';
		tracking = false;
		paused = false;
		
		// Release wake lock
		if (wakeLock !== null) {
			try {
				await wakeLock.release();
				wakeLock = null;
				console.log('Wake Lock released');
			} catch (err) {
				console.error('Error releasing wake lock:', err);
			}
		}
		
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
	
	function showNotification(message) {
		notification = message;
		if (notificationTimeout) {
			clearTimeout(notificationTimeout);
		}
		notificationTimeout = setTimeout(() => {
			notification = null;
			notificationTimeout = null;
		}, 3000);
	}
</script>

<div class="w-full h-full relative">
	{#if locationError}
		<div class="w-full h-full flex items-center justify-center bg-gray-50">
			<div class="text-center p-8">
				<svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
				</svg>
				<h2 class="text-xl font-semibold text-gray-700 mb-2">Location Access Required</h2>
				<p class="text-gray-500 mb-4">Please enable location services to use MapMe</p>
				<button 
					class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
					on:click={() => window.location.reload()}>
					Retry
				</button>
			</div>
		</div>
	{:else if !locationFound}
		<div class="w-full h-full flex items-center justify-center bg-gray-50">
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
				<p class="mt-4 text-gray-600">Finding your location...</p>
			</div>
		</div>
	{:else}
		<div id="map" bind:this={mapElement} class="w-full h-full"></div>
		
		{#if tracking}
			<TrackingStats {elapsedTime} {distance} {currentSpeed} {avgSpeed} />
		{/if}
		
		{#if notification}
			<div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-[500] animate-fadeIn">
				{notification}
			</div>
		{/if}
		
		<div class="absolute top-2.5 right-[60px] flex flex-col gap-2.5 z-[400]">
			<button 
				class="border-none w-10 h-10 rounded-lg cursor-pointer shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 {autoCenter ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}" 
				on:click={toggleAutoCenter}
				title="{autoCenter ? 'Disable' : 'Enable'} location following"
				aria-label="{autoCenter ? 'Disable' : 'Enable'} location following">
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
				</svg>
			</button>
		</div>
		
		<div class="absolute top-2.5 left-2.5 flex gap-1.5 z-[400] bg-white/90 p-1.5 rounded-lg">
			<button 
				class="px-3 py-2 border-none rounded-md cursor-pointer text-xs transition-all duration-200 {mapStyle === 'street' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white hover:bg-gray-100'}"
				on:click={() => changeMapStyle('street')}>
				Street
			</button>
			<button 
				class="px-3 py-2 border-none rounded-md cursor-pointer text-xs transition-all duration-200 {mapStyle === 'satellite' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white hover:bg-gray-100'}"
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
	{/if}
</div>

