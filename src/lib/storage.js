const STORAGE_KEY = 'mapme_routes';

export function saveRoute(route) {
	if (typeof window === 'undefined') return;
	const routes = getRoutes();
	routes.unshift(route); // Add new route at the beginning
	localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export function getRoutes() {
	if (typeof window === 'undefined') return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
}

export function getRoute(id) {
	const routes = getRoutes();
	return routes.find(route => route.id === id);
}

export function deleteRoute(id) {
	if (typeof window === 'undefined') return;
	const routes = getRoutes();
	const filtered = routes.filter(route => route.id !== id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllRoutes() {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}