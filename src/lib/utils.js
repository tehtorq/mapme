export function calculateDistance(positions) {
	let totalDistance = 0;
	
	for (let i = 1; i < positions.length; i++) {
		const [lat1, lon1] = positions[i - 1];
		const [lat2, lon2] = positions[i];
		
		const R = 6371; // Earth's radius in km
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const a = 
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		const distance = R * c;
		
		totalDistance += distance;
	}
	
	return totalDistance;
}

export function calculateSpeed(distance, time) {
	// Returns speed in km/h
	if (time === 0) return 0;
	return (distance / time) * 3600;
}

export function formatTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	
	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	} else {
		return `${secs}s`;
	}
}

export function formatDistance(km) {
	if (km < 1) {
		return `${Math.round(km * 1000)}m`;
	}
	return `${km.toFixed(2)}km`;
}

export function getCurrentTimestamp() {
	return new Date().toISOString();
}

export function generateRouteId() {
	return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}