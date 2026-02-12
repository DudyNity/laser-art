import { redirect } from '@sveltejs/kit';

export function requireAuth(locals: App.Locals): { id: string; username: string } {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	return locals.user;
}
