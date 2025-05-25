import { writable } from 'svelte/store';

// App states: 'idle', 'tracking', 'history', 'viewing-route'
export const appState = writable('idle');
export const selectedRoute = writable(null);