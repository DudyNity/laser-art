import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals }: RequestEvent) => {
    requireAuth(locals);

    const config = await prisma.configEmpresa.upsert({
        where: { id: 'config' },
        update: {},
        create: { id: 'config' }
    });

    return {
        user: locals.user,
        config
    };
};

export const actions = {
    salvar: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const nome = data.get('nome');
        const tagline = data.get('tagline');
        const telefone = data.get('telefone');
        const email = data.get('email');
        const cnpj = data.get('cnpj');

        if (!nome) {
            return fail(400, { error: 'Nome da empresa é obrigatório' });
        }

        await prisma.configEmpresa.upsert({
            where: { id: 'config' },
            update: {
                nome: nome.toString(),
                tagline: tagline ? tagline.toString() : '',
                telefone: telefone ? telefone.toString() : '',
                email: email ? email.toString() : '',
                cnpj: cnpj ? cnpj.toString() : ''
            },
            create: {
                id: 'config',
                nome: nome.toString(),
                tagline: tagline ? tagline.toString() : '',
                telefone: telefone ? telefone.toString() : '',
                email: email ? email.toString() : '',
                cnpj: cnpj ? cnpj.toString() : ''
            }
        });

        return { success: true };
    }
};
