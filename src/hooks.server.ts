import { prisma } from '$lib/server/prisma';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    //pega o cookie da sessao
    const session = event.cookies.get('session');

    //se nao tiver cookie, o usuario nao ta logado
    if(!session) {
        event.locals.user = null;
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