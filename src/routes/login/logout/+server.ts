import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
    //deleta os cookies de sessao
    cookies.delete('session', {path: '/'});

    //redireciona para a pagina de login
    throw redirect(303, '/login');
};