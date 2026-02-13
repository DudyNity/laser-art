import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const PUBLIC_ROUTES = ['/login'];
const CLIENTE_ROUTES = ['/pedidos', '/orcamentos/salvos'];

export const handle: Handle = async ({ event, resolve }) => {
    const session = event.cookies.get('session');
    const pathname = event.url.pathname;

    // Logout: apaga cookie e redireciona imediatamente
    if (pathname === '/logout') {
        event.cookies.delete('session', { path: '/' });
        throw redirect(303, '/login');
    }

    if (!session) {
        event.locals.user = null;
        const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
        if (!isPublic) throw redirect(303, '/login');
        return resolve(event);
    }

    const user = await prisma.user.findUnique({
        where: { id: session },
        select: { id: true, username: true, role: true, clienteId: true }
    });

    if (!user) {
        event.cookies.delete('session', { path: '/' });
        throw redirect(303, '/login');
    }

    event.locals.user = user;

    // Clientes só podem acessar as rotas permitidas
    if (user.role === 'cliente') {
        const allowed = CLIENTE_ROUTES.some(r => pathname.startsWith(r));
        if (!allowed) throw redirect(303, '/pedidos');
    }

    return resolve(event);
};
