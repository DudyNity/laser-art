import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals }: RequestEvent) => {
    const user = requireAuth(locals);

    const where = user.role === 'cliente' && user.clienteId
        ? { clienteId: user.clienteId, status: 'Aprovado' }
        : {};

    const [orcamentos, clientes] = await Promise.all([
        prisma.orcamento.findMany({
            where,
            include: { cliente: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.cliente.findMany({
            where: { ativo: true },
            orderBy: { nome: 'asc' },
            select: { id: true, nome: true, telefone: true, email: true }
        })
    ]);

    return { user: locals.user, isCliente: user.role === 'cliente', orcamentos, clientes };
};


export const actions = {
    // Aprovar Orçamento (cria Pedido automaticamente)
aprovarOrcamento: async ({ request }: RequestEvent) => {
    const data = await request.formData();
    const id = data.get('id');
    const dataEntrega = data.get('dataEntrega');
    
    if (!id || !dataEntrega) {
        return fail(400, { error: 'Dados inválidos' });
    }
    
    // Buscar o orçamento COM o cliente incluído
    const orcamento = await prisma.orcamento.findUnique({
        where: { id: id.toString() },
        include: { 
            cliente: true  // Incluir dados do cliente
        }
    });
    
    if (!orcamento) {
        return fail(404, { error: 'Orçamento não encontrado' });
    }

    const nomeParaPedido = orcamento.cliente?.nome || orcamento.nomeCliente;
    if (!nomeParaPedido) {
        return fail(400, { error: 'Vincule um cliente ao orçamento antes de aprovar' });
    }

    // 1. Atualiza status do orçamento
    await prisma.orcamento.update({
        where: { id: id.toString() },
        data: { status: 'Aprovado' }
    });

    // 2. Cria o pedido automaticamente
    await prisma.pedido.create({
        data: {
            orcamentoId: id.toString(),
            cliente: nomeParaPedido,
            valor: orcamento.valorFinal,
            dataEntrega: new Date(dataEntrega.toString()),
            status: 'Pendente'
        }
    });
    
    return { success: true };
},
    
    // Recusar Orçamento
    recusarOrcamento: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        
        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }
        
        await prisma.orcamento.update({
            where: { id: id.toString() },
            data: { status: 'Recusado' }
        });
        
        return { success: true };
    },
    
    // Vincular Cliente ao Orçamento
    vincularCliente: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        const clienteId = data.get('clienteId');

        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }

        await prisma.orcamento.update({
            where: { id: id.toString() },
            data: {
                clienteId: clienteId ? clienteId.toString() : null,
                nomeCliente: clienteId ? null : null
            }
        });

        return { success: true };
    },

    // Excluir Orçamento
    excluirOrcamento: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        
        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }
        
        await prisma.orcamento.delete({
            where: { id: id.toString() }
        });
        
        return { success: true };
    }
};