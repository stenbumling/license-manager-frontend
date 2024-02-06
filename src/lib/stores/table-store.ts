import { get, writable } from 'svelte/store';
import { licenseStore } from './license-store';
import { request, tableFetchRequest } from './request-state-store';

/*
 * This store is responsible for managing the state of the license table. That
 * includes what filter is currently active, what the current sort order is,
 * and what the current search query is. Everytime the state of the table
 * changes in any way, the store will send a query to the database to fetch the
 * licenses that match the current state of the table.
 */

// Stores for managing queries and state of the table
export const searchQuery = writable('');
export const filterState = writable('All');
export const sortState = writable<Record<string, 'ASC' | 'DESC' | 'DEFAULT'>>({
	application: 'DEFAULT',
	contactPerson: 'DEFAULT',
	users: 'DEFAULT',
	expirationDate: 'DEFAULT',
});

function createTableController() {
	async function updateFilterState(filter: string) {
		filterState.set(filter);
		await updateTableState();
	}

	async function updateSortState(column: string) {
		sortState.update((currentState) => {
			updateSortOrder(column, currentState);
			return currentState;
		});
		await updateTableState();
	}

	async function updateTableState() {
		const { sortColumn, sortOrder } = getSortState();
		const query = constructFilterQuery(get(filterState), get(searchQuery), sortOrder, sortColumn);
		await sendQueryToDatabase(query);
	}

	function getSortState() {
		const sortStateValue = get(sortState);
		const sortColumn = Object.keys(sortStateValue).find((key) => sortStateValue[key] !== 'DEFAULT');
		const sortOrder = sortColumn ? sortStateValue[sortColumn] : 'DEFAULT';
		return { sortColumn, sortOrder };
	}

	function updateSortOrder(
		column: string,
		currentState: Record<string, 'ASC' | 'DESC' | 'DEFAULT'>,
	) {
		Object.keys(currentState).forEach((key) => {
			if (key !== column) currentState[key] = 'DEFAULT';
		});

		switch (currentState[column]) {
			case 'DEFAULT':
				currentState[column] = 'ASC';
				break;
			case 'ASC':
				currentState[column] = 'DESC';
				break;
			case 'DESC':
				currentState[column] = 'DEFAULT';
				break;
		}
	}

	function constructFilterQuery(
		filterName: string,
		searchQueryParam: string,
		sortOrder: 'ASC' | 'DESC' | 'DEFAULT',
		sortColumn?: string,
	): string {
		let query = determineBaseQuery(filterName, searchQueryParam);

		if (sortColumn && sortOrder !== 'DEFAULT') {
			const sortQuery = `sortBy=${sortColumn}&sortDirection=${sortOrder}`;
			query += (query ? '&' : '?') + sortQuery;
		}

		return query;
	}

	function determineBaseQuery(filterName: string, searchQueryParam: string): string {
		switch (filterName) {
			case 'All':
				return '?filter=all';
			case 'In use':
				return '?filter=assigned';
			case 'Unassigned':
				return '?filter=unassigned';
			case 'Near expiration':
				return '?filter=near-expiration';
			case 'Expired':
				return '?filter=expired';
			case 'Search':
				return searchQueryParam === '' ? '' : `?search=${searchQueryParam}`;
			default:
				console.error(`Unknown filter: ${filterName}`);
				return 'filter=all';
		}
	}

	async function sendQueryToDatabase(query: string) {
		request.startLoading(tableFetchRequest);
		try {
			const response = await fetch(`/api/licenses/query${query}`);
			if (response.ok) {
				const licenses = await response.json();
				licenseStore.set(licenses);
			} else {
				const errorMessage = await response.json();
				request.setError(
					tableFetchRequest,
					null,
					'error',
					errorMessage || 'Failed to fetch licenses',
				);
				console.error(errorMessage);

				// Reset filter and sort state if query fails
				filterState.set('All');
				sortState.set({
					application: 'DEFAULT',
					contactPerson: 'DEFAULT',
					users: 'DEFAULT',
					expirationDate: 'DEFAULT',
				});

				if (response.status === 404) {
					// toast
				} else if (response.status === 401) {
					// toast
				} else {
					// toast
				}
			}
		} catch (error) {
			request.setError(tableFetchRequest, 500, 'error', 'Failed to fetch licenses');
			console.error(`Failed to fetch licenses with the query "${query}":`, error);
			// toast
		} finally {
			request.endLoading(tableFetchRequest);
		}
	}

	return {
		filterBy: updateFilterState,
		sortBy: updateSortState,
		updateState: updateTableState,
	};
}

export const table = createTableController();
