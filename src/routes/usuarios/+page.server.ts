import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import bcrypt from 'bcryptjs';
import type { RequestEvent } from '@sveltejs/kit';

export const load = async ({ locals }: RequestEvent) => {
    requireAuth(locals);

    const [usuarios, clientes] = await Promise.all([
        prisma.user.findMany({
            select: { id: true, username: true, role: true, clienteId: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.cliente.findMany({
            select: { id: true, nome: true },
            where: { ativo: true },
            orderBy: { nome: 'asc' }
        })
    ]);

    return { user: locals.user, usuarios, clientes };
};

export const actions = {
    criarUsuario: async ({ request, locals }: RequestEvent) => {
        requireAuth(locals);
        const data = await request.formData();
        const username = data.get('username')?.toString().trim();
        const password = data.get('password')?.toString();
        const role = data.get('role')?.toString() || 'admin';
        const clienteId = data.get('clienteId')?.toString() || null;

        if (!username || !password) {
            return fail(400, { error: 'Preencha usuário e senha' });
        }
        if (password.length < 4) {
            return fail(400, { error: 'Senha deve ter no mínimo 4 caracteres' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: { username, password: hashedPassword, role, clienteId: clienteId || null }
            });
            return { success: true };
        } catch {
            return fail(400, { error: 'Nome de usuário já existe' });
        }
    },

    atualizarRole: async ({ request, locals }: RequestEvent) => {
        requireAuth(locals);
        const data = await request.formData();
        const id = data.get('id')?.toString();
        const role = data.get('role')?.toString();
        const clienteId = data.get('clienteId')?.toString() || null;

        if (!id || !role) return fail(400, { error: 'Dados inválidos' });

        await prisma.user.update({ where: { id }, data: { role, clienteId: clienteId || null } });
        return { success: true };
    },

    excluirUsuario: async ({ request, locals }: RequestEvent) => {
        const currentUser = requireAuth(locals);
        const data = await request.formData();
        const id = data.get('id')?.toString();

        if (!id) return fail(400, { error: 'ID inválido' });
        if (id === currentUser.id) return fail(400, { error: 'Você não pode excluir sua própria conta' });

        await prisma.user.delete({ where: { id } });
        return { success: true };
    }
};
