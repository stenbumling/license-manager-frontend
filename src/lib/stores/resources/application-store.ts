import { notifications } from '$lib/stores/notification-store';
import {
	applicationDeleteRequest,
	applicationFetchRequest,
	applicationPostRequest,
	disableButtonsDuringRequests,
	request,
} from '$lib/stores/request-state-store';
import type { ApplicationData } from '$lib/types/application-types';
import { applicationValidationError } from '$lib/validations/application-validation';
import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

export function getApplicationDefaultValue(): ApplicationData {
	return {
		id: uuidv4(),
		name: '',
		link: '',
		licenseAssociations: 0,
	};
}

/** Stores data for the current application being viewed or edited */
export const currentApplication = writable<ApplicationData>(getApplicationDefaultValue());
/** Stores the id of the application to delete */
export const applicationToDelete = writable<string | null>(null);

function createApplicationStore() {
	const { subscribe, set } = writable<ApplicationData[]>([]);

	async function fetchApplications() {
		try {
			await request.startLoading(applicationFetchRequest);
			const response = await fetch('/api/applications');
			await request.endLoading(applicationFetchRequest, 1000);
			if (response.ok) {
				const applications: ApplicationData[] = await response.json();
				set(applications);
			} else {
				const error: App.Error = await response.json();
				notifications.add({
					message: error.message,
					type: 'alert',
				});
				request.setError(applicationFetchRequest, error);
				console.error('Failed to fetch applications:', error);
			}
		} catch (error) {
			await request.endLoading(applicationFetchRequest);
			request.setError(applicationFetchRequest, {
				status: 500,
				type: 'Internal Server Error',
				message: 'Failed to fetch applications due to a server error.',
				details: 'Please try refreshing the page. If the problem persists, contact support.',
			});
			console.error('Failed to fetch applications:', error);
		}
	}

	async function addApplication(application: ApplicationData) {
		try {
			disableButtonsDuringRequests.set(true);
			await request.startLoading(applicationPostRequest, 0);
			const response = await fetch('/api/applications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(application),
			});
			await request.endLoading(applicationPostRequest, 1000);
			disableButtonsDuringRequests.set(false);
			if (response.ok) {
				notifications.add({
					message: 'Application added successfully',
					type: 'success',
				});
				return true;
			} else {
				const error: App.Error = await response.json();
				notifications.add({
					message: error.message,
					type: 'alert',
				});
				console.error('Failed to add application:', error);
				return false;
			}
		} catch (error) {
			await request.endLoading(applicationPostRequest);
			disableButtonsDuringRequests.set(false);
			notifications.add({
				message:
					'A server error has occured and application could not be added. Please try refreshing the page.',
				type: 'alert',
				timeout: false,
			});
			console.error('Failed to add application:', error);
			return false;
		}
	}

	async function updateApplication(application: ApplicationData) {
		try {
			disableButtonsDuringRequests.set(true);
			await request.startLoading(applicationPostRequest, 0);
			const response = await fetch(`/api/applications/${application.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(application),
			});
			await request.endLoading(applicationPostRequest, 1000);
			disableButtonsDuringRequests.set(false);
			if (response.ok) {
				notifications.add({
					message: 'Application was updated successfully',
					type: 'success',
				});
				return true;
			} else {
				const error: App.Error = await response.json();
				notifications.add({
					message: error.message,
					type: 'alert',
				});
				console.error('Failed to update application:', error);
				return false;
			}
		} catch (error) {
			await request.endLoading(applicationPostRequest);
			disableButtonsDuringRequests.set(false);
			notifications.add({
				message:
					'A server error has occured and application could not be updated. Please try refreshing the page.',
				type: 'alert',
				timeout: false,
			});
			console.error('Failed to update application:', error);
			return false;
		}
	}

	async function handleApplicationDeletion(id: string | null) {
		if (!id) return;
		const success = await deleteApplication(id);
		if (success) applicationStore.fetch();
	}

	async function deleteApplication(id: string) {
		try {
			disableButtonsDuringRequests.set(true);
			await request.startLoading(applicationDeleteRequest, 0);
			const response = await fetch(`/api/applications/${id}`, {
				method: 'DELETE',
			});
			await request.endLoading(applicationDeleteRequest, 1000);
			disableButtonsDuringRequests.set(false);
			if (response.ok) {
				notifications.add({
					message: 'Application deleted successfully',
					type: 'success',
				});
				return true;
			} else {
				const error: App.Error = await response.json();
				notifications.add({
					message: error.message,
					type: 'alert',
				});
				console.error('Failed to delete application:', error);
				return false;
			}
		} catch (error) {
			await request.endLoading(applicationDeleteRequest);
			disableButtonsDuringRequests.set(false);
			notifications.add({
				message:
					'A server error has occured and application could not be deleted. Please try refreshing the page.',
				type: 'alert',
				timeout: false,
			});
			console.error('Failed to delete application:', error);
			return false;
		}
	}

	/**
	 * Reset the application store to its initial values.
	 * `setTimeout` is used to wait for the closing animation to finish
	 */
	function resetFields() {
		setTimeout(() => {
			currentApplication.set(getApplicationDefaultValue());
			applicationValidationError.set({});
		}, 120);
	}

	return {
		subscribe,
		set,
		fetch: fetchApplications,
		add: addApplication,
		update: updateApplication,
		delete: handleApplicationDeletion,
		resetFields,
	};
}

export const applicationStore = createApplicationStore();
