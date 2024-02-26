import { getTokens } from '$lib/auth/services';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const redirectTo = await getTokens(event);
	if (redirectTo) {
		redirect(302, redirectTo);
	} else {
		error(400, {
			message: 'There was an error trying to authenticate user',
		});
	}
};