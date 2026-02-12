import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals }: RequestEvent) => {
    requireAuth(locals);
    
    const [maquinas, materiais, clientes] = await Promise.all([
    prisma.maquina.findMany({
        where: { ativa: true },
        orderBy: { nome: 'asc' }
    }),
    prisma.material.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' }
    }),
    prisma.cliente.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
        select: {
            id: true,
            nome: true,
            telefone: true,
            email: true
        }
    })
]);

return {
    user: locals.user,
    maquinas,
    materiais,
    clientes
};
};

export const actions = {
    criarOrcamento: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const clienteId = data.get('clienteId');
        const descricao = data.get('descricao');
        const itensDetalhados = data.get('itensDetalhados');
        const subtotal = data.get('subtotal');
        const margemLucro = data.get('margemLucro');
        const gastosAdicionais = data.get('gastosAdicionais');
        const valorFinal = data.get('valorFinal');

        if (!clienteId || !valorFinal) {
            return fail(400, { error: 'Preencha os campos obrigatórios' });
        }

        await prisma.orcamento.create({
            data: {
                clienteId: clienteId.toString(),
                descricao: descricao ? descricao.toString() : null,
                itensDetalhados: itensDetalhados ? itensDetalhados.toString() : null,
                subtotal: parseFloat(subtotal?.toString() || '0'),
                margemLucro: parseFloat(margemLucro?.toString() || '30'),
                gastosAdicionais: parseFloat(gastosAdicionais?.toString() || '0'),
                valorFinal: parseFloat(valorFinal.toString()),
                status: 'Pendente'
            }
        });
        
        throw redirect(303, '/orcamentos/salvos');
    }
};