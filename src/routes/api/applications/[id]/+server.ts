import Application from '$lib/server/models/application-model';
import { error } from '@sveltejs/kit';

export async function PUT({ params, request }) {
	const id = params.id;
	const { updatedAt, ...app } = await request.json();

	const [affectedRows] = await Application.update(app, {
		where: { id, updatedAt },
	});

	if (affectedRows === 0) {
		error(409, {
			status: 409,
			type: 'UpdateConflict',
			message: 'Failed to update application because of data conflict.',
			details:
				'Application data may have been modified since it was last retrieved. Please retrieve the latest version and try again.',
		});
	}
	return new Response(null, { status: 204 });
}

export async function DELETE({ params }) {
	const id = params.id;

	const app = await Application.findByPk(id);
	if (!app) {
		error(404, {
			status: 404,
			type: 'NotFound',
			message: 'Application could not be found.',
			details:
				'Please verify the provided ID is correct. If correct, the application might have been deleted or does not exist.',
		});
	} else if (app.dataValues.licenseAssociations > 0) {
		error(409, {
			status: 409,
			type: 'DataDeletionError',
			message: 'Cannot delete application.',
			details:
				'There are licenses associated with this application. Please delete the licenses first before trying to delete the application.',
		});
	}
	await app.destroy();
	return new Response(null, { status: 204 });
}
