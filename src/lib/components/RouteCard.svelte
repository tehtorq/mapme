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

<div class="route-card" on:click={onView} on:keydown={handleKeydown} role="button" tabindex="0" aria-label="View route details">
	<div class="mini-map" bind:this={mapElement}></div>
	<div class="route-info">
		<div class="route-header-info">
			<div>
				<div class="route-date">
					{new Date(route.date).toLocaleDateString()}
				</div>
				<div class="route-time">
					{route.startTime} - {route.endTime}
				</div>
			</div>
		</div>
		
		<div class="route-stats-grid">
			<div class="route-stat">
				<div class="route-stat-value">{formatDistance(route.distance)}</div>
				<div class="route-stat-label">Distance</div>
			</div>
			<div class="route-stat">
				<div class="route-stat-value">{formatTime(route.duration)}</div>
				<div class="route-stat-label">Duration</div>
			</div>
			<div class="route-stat">
				<div class="route-stat-value">{route.avgSpeed.toFixed(1)} km/h</div>
				<div class="route-stat-label">Avg Speed</div>
			</div>
		</div>
		
		<div class="route-actions">
			<button class="route-action export-btn" on:click|stopPropagation={onExport}>
				Export
			</button>
			<button class="route-action delete-btn" on:click|stopPropagation={onDelete}>
				Delete
			</button>
		</div>
	</div>
</div>

<style>
	.route-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		cursor: pointer;
		transition: all 0.2s;
		outline: none;
	}
	
	.route-card:focus {
		outline: 2px solid #3B82F6;
		outline-offset: 2px;
	}
	
	.route-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0,0,0,0.15);
	}
	
	.mini-map {
		width: 100%;
		height: 150px;
		background: #E5E7EB;
	}
	
	.route-info {
		padding: 15px;
	}
	
	.route-header-info {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 10px;
	}
	
	.route-date {
		font-size: 16px;
		font-weight: 600;
		color: #1F2937;
	}
	
	.route-time {
		font-size: 14px;
		color: #6B7280;
	}
	
	.route-stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 10px;
	}
	
	.route-stat {
		text-align: center;
	}
	
	.route-stat-value {
		font-size: 18px;
		font-weight: 700;
		color: #1F2937;
	}
	
	.route-stat-label {
		font-size: 12px;
		color: #6B7280;
	}
	
	.route-actions {
		display: flex;
		gap: 10px;
		margin-top: 10px;
	}
	
	.route-action {
		flex: 1;
		padding: 8px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.export-btn {
		background: #E0F2FE;
		color: #0369A1;
	}
	
	.export-btn:hover {
		background: #BAE6FD;
	}
	
	.delete-btn {
		background: #FEE2E2;
		color: #B91C1C;
	}
	
	.delete-btn:hover {
		background: #FECACA;
	}
</style>

