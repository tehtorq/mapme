<script>
	import { formatTime, formatDistance } from '$lib/utils.js';
	
	export let elapsedTime = 0;
	export let distance = 0;
	export let currentSpeed = 0;
	export let avgSpeed = 0;
</script>

<div class="absolute top-2.5 left-2.5 bg-white/95 p-4 rounded-xl shadow-md z-[400] min-w-[200px] sm:top-[60px] sm:left-2.5 sm:right-2.5 sm:min-w-0">
	<div class="flex justify-between my-1.5 text-sm">
		<span class="font-semibold text-gray-500">Time:</span>
		<span class="font-bold text-gray-800">{formatTime(elapsedTime)}</span>
	</div>
	<div class="flex justify-between my-1.5 text-sm">
		<span class="font-semibold text-gray-500">Distance:</span>
		<span class="font-bold text-gray-800">{formatDistance(distance)}</span>
	</div>
	<div class="flex justify-between my-1.5 text-sm">
		<span class="font-semibold text-gray-500">Current Speed:</span>
		<span class="font-bold text-gray-800">{currentSpeed.toFixed(1)} km/h</span>
	</div>
	<div class="flex justify-between my-1.5 text-sm">
		<span class="font-semibold text-gray-500">Avg Speed:</span>
		<span class="font-bold text-gray-800">{avgSpeed.toFixed(1)} km/h</span>
	</div>
</div>

