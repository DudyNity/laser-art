import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals }: RequestEvent) => {
    requireAuth(locals);
    
    // Busca todos os clientes
    const clientes = await prisma.cliente.findMany({
        orderBy: { createdAt: 'desc' }
    });
    
    return {
        user: locals.user,
        clientes
    };
};

export const actions = {
    // Criar Cliente
    criarCliente: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const nome = data.get('nome');
        const cpfCnpj = data.get('cpfCnpj');
        const telefone = data.get('telefone');
        const email = data.get('email');
        const endereco = data.get('endereco');
        const observacoes = data.get('observacoes');
        const ativo = data.get('ativo') === 'on';
        
        if (!nome || !telefone || !email) {
            return fail(400, { error: 'Preencha todos os campos obrigatórios' });
        }
        
        try {
            await prisma.cliente.create({
                data: {
                    nome: nome.toString(),
                    cpfCnpj: cpfCnpj ? cpfCnpj.toString() : null,
                    telefone: telefone.toString(),
                    email: email.toString(),
                    endereco: endereco ? endereco.toString() : null,
                    observacoes: observacoes ? observacoes.toString() : null,
                    ativo
                }
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            return fail(500, { error: 'Erro ao cadastrar cliente' });
        }
    },
    
    // Editar Cliente
    editarCliente: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        const nome = data.get('nome');
        const cpfCnpj = data.get('cpfCnpj');
        const telefone = data.get('telefone');
        const email = data.get('email');
        const endereco = data.get('endereco');
        const observacoes = data.get('observacoes');
        const ativo = data.get('ativo') === 'on';
        
        if (!id || !nome || !telefone || !email) {
            return fail(400, { error: 'Dados inválidos' });
        }
        
        try {
            await prisma.cliente.update({
                where: { id: id.toString() },
                data: {
                    nome: nome.toString(),
                    cpfCnpj: cpfCnpj ? cpfCnpj.toString() : null,
                    telefone: telefone.toString(),
                    email: email.toString(),
                    endereco: endereco ? endereco.toString() : null,
                    observacoes: observacoes ? observacoes.toString() : null,
                    ativo
                }
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao editar cliente:', error);
            return fail(500, { error: 'Erro ao atualizar cliente' });
        }
    },
    
    // Excluir Cliente
    excluirCliente: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        
        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }
        
        try {
            await prisma.cliente.delete({
                where: { id: id.toString() }
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            return fail(500, { error: 'Este cliente possui orçamentos vinculados e não pode ser excluído' });
        }
    }
};