import { writable } from 'svelte/store';

export const showLicenseModal = writable(false);
export const showApplicationModal = writable(false);
export const showAssignedUsersModal = writable(false);
export const activeContextMenu = writable<string | null>(null);
