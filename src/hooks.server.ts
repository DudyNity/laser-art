import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const PUBLIC_ROUTES = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
    //pega o cookie da sessao
    const session = event.cookies.get('session');

    //se nao tiver cookie, o usuario nao ta logado
    if(!session) {
        event.locals.user = null;
        const isPublic = PUBLIC_ROUTES.some(r => event.url.pathname.startsWith(r));
        if (!isPublic) throw redirect(303, '/login');
        return resolve(event);
    }

    //Busca o usuario no banco pelo id salvo no cookie

const user = await prisma.user.findUnique({
        where: { id: session },
        select: {
            id: true,
            username: true,
        }
    });

    event.locals.user = user;
    return resolve(event);
};