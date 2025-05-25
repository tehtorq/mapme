<script>
	import { formatTime, formatDistance } from '$lib/utils.js';
	
	export let elapsedTime = 0;
	export let distance = 0;
	export let currentSpeed = 0;
	export let avgSpeed = 0;
</script>

<div class="stats">
	<div class="stat-item">
		<span class="stat-label">Time:</span>
		<span class="stat-value">{formatTime(elapsedTime)}</span>
	</div>
	<div class="stat-item">
		<span class="stat-label">Distance:</span>
		<span class="stat-value">{formatDistance(distance)}</span>
	</div>
	<div class="stat-item">
		<span class="stat-label">Current Speed:</span>
		<span class="stat-value">{currentSpeed.toFixed(1)} km/h</span>
	</div>
	<div class="stat-item">
		<span class="stat-label">Avg Speed:</span>
		<span class="stat-value">{avgSpeed.toFixed(1)} km/h</span>
	</div>
</div>

<style>
	.stats {
		position: absolute;
		top: 10px;
		left: 10px;
		background: rgba(255, 255, 255, 0.95);
		padding: 15px;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		z-index: 400;
		min-width: 200px;
	}
	
	.stat-item {
		display: flex;
		justify-content: space-between;
		margin: 5px 0;
		font-size: 14px;
	}
	
	.stat-label {
		font-weight: 600;
		color: #6B7280;
	}
	
	.stat-value {
		font-weight: 700;
		color: #1F2937;
	}
	
	@media (max-width: 640px) {
		.stats {
			top: 60px;
			left: 10px;
			right: 10px;
			min-width: auto;
		}
	}
</style>

