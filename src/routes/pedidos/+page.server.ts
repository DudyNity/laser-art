import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals }: RequestEvent) => {
    const user = requireAuth(locals);

    const where = user.role === 'cliente' && user.clienteId
        ? { orcamento: { clienteId: user.clienteId } }
        : {};

    const pedidos = await prisma.pedido.findMany({
        where,
        include: {
            orcamento: {
                select: { descricao: true, itensDetalhados: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { user: locals.user, isCliente: user.role === 'cliente', pedidos };
};

export const actions = {
    // Criar Pedido
    criarPedido: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const cliente = data.get('cliente');
        const valor = data.get('valor');
        const dataEntrega = data.get('dataEntrega');
        const status = data.get('status');

        if (!cliente || !valor || !dataEntrega) {
            return fail(400, { error: 'Preencha todos os campos' });
        }

        await prisma.pedido.create({
            data: {
                orcamentoId: '',
                cliente: cliente.toString(),
                valor: parseFloat(valor.toString()),
                dataEntrega: new Date(dataEntrega.toString()),
                status: status?.toString() || 'Pendente'
            }
        });

        return { success: true };
    },
    
    // Atualizar Status
    atualizarStatus: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        const status = data.get('status');
        
        if (!id || !status) {
            return fail(400, { error: 'Dados inválidos' });
        }
        
        await prisma.pedido.update({
            where: { id: id.toString() },
            data: { status: status.toString() }
        });
        
        return { success: true };
    },
    
    // Excluir Pedido
    excluirPedido: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        
        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }
        
        await prisma.pedido.delete({
            where: { id: id.toString() }
        });
        
        return { success: true };
    }
};