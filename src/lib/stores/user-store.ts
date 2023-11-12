import { writable } from 'svelte/store';

export interface User {
	id: string;
	name: string;
}

function createUserStore() {
	const { subscribe, set, update } = writable<User[]>([]);

	async function fetchUsers() {
		try {
			const response = await fetch('/api/user');
			if (response.ok) {
				const users = await response.json();
				update(() => users);
			} else {
				const errorMessage = await response.json();
				if (response.status === 404) {
					// toast
				} else if (response.status === 401) {
					// toast
				} else {
					// toast
				}
				console.error(errorMessage);
			}
		} catch (error) {
			console.error('Failed to fetch users:', error);
			// toast
		}
	}

	async function findOrCreateUser(userName: string) {
		try {
			const response = await fetch('/api/user/find-or-create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: userName }),
			});
			if (response.ok) {
				const data = await response.json();
				if (data.created) {
					update((users) => [data.user, ...users]);
				}
				return data.user;
			} else {
				const errorMessage = await response.json();
				if (response.status === 404) {
					// toast
				} else if (response.status === 401) {
					// toast
				} else {
					// toast
				}
				console.error(errorMessage);
			}
		} catch (error) {
			console.error('Failed to add user:\n', error);
			// toast
		}
	}

	async function deleteUserFromDatabase(id: string) {
		try {
			const response = await fetch(`/api/user/delete/${id}`, {
				method: 'DELETE',
			});
			if (response.ok) {
				update((users) => users.filter((user) => user.id !== id));
			} else {
				const errorMessage = await response.json();
				if (response.status === 404) {
					// toast
				} else if (response.status === 401) {
					// toast
				} else {
					// toast
				}
				console.error(errorMessage);
			}
		} catch (error) {
			console.error('Failed to delete user:', error);
			// toast
		}
	}

	return {
		subscribe,
		set,
		update,
		fetch: fetchUsers,
		findOrCreateUser,
		delete: deleteUserFromDatabase,
	};
}

export const userStore = createUserStore();
