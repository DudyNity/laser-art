import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals }: RequestEvent) => {
    requireAuth(locals);
    
    const orcamentos = await prisma.orcamento.findMany({
        include: {
            cliente: true  // ← ADICIONE ISSO!
        },
        orderBy: { createdAt: 'desc' }
    });
    
    return {
        user: locals.user,
        orcamentos
    };
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
    
    // Validar se o cliente existe
    if (!orcamento.cliente) {
        return fail(400, { error: 'Cliente não encontrado no orçamento' });
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
            cliente: orcamento.cliente.nome,  // Agora é seguro
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