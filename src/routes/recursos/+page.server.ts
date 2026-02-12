import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
    requireAuth(locals);
    
    // Busca máquinas e materiais do banco
    const [maquinas, materiais] = await Promise.all([
        prisma.maquina.findMany({
            orderBy: { createdAt: 'desc' }
        }),
        prisma.material.findMany({
            orderBy: { createdAt: 'desc' }
        })
    ]);
    
    return {
        user: locals.user,
        maquinas,
        materiais
    };
};

export const actions = {
    // Criar Máquina
    criarMaquina: async ({ request }) => {
        const data = await request.formData();
        const nome = data.get('nome');
        const custoHora = data.get('custoHora');
        const ativa = data.get('ativa') === 'on';
        
        if (!nome || !custoHora) {
            return fail(400, { error: 'Preencha todos os campos' });
        }
        
        await prisma.maquina.create({
            data: {
                nome: nome.toString(),
                custoHora: parseFloat(custoHora.toString()),
                ativa
            }
        });
        
        return { success: true };
    },
    
    // Editar Máquina
    editarMaquina: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const nome = data.get('nome');
        const custoHora = data.get('custoHora');
        const ativa = data.get('ativa') === 'on';
        
        if (!id || !nome || !custoHora) {
            return fail(400, { error: 'Dados inválidos' });
        }
        
        await prisma.maquina.update({
            where: { id: id.toString() },
            data: {
                nome: nome.toString(),
                custoHora: parseFloat(custoHora.toString()),
                ativa
            }
        });
        
        return { success: true };
    },
    
    // Excluir Máquina
    excluirMaquina: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        
        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }
        
        await prisma.maquina.delete({
            where: { id: id.toString() }
        });
        
        return { success: true };
    },
    
    // Criar Material
    criarMaterial: async ({ request }) => {
        const data = await request.formData();
        const nome = data.get('nome');
        const precoM2 = data.get('precoM2'); // Recebe como m²
        const ativo = data.get('ativo') === 'on';
        
        if (!nome || !precoM2) {
            return fail(400, { error: 'Preencha todos os campos' });
        }
        
        // Converter de R$/m² para R$/mm² (dividir por 1.000.000)
        const precoMm2 = parseFloat(precoM2.toString()) / 1000000;
        
        await prisma.material.create({
            data: {
                nome: nome.toString(),
                precoMm2: precoMm2,
                ativo
            }
        });
        
        return { success: true };
    },
    
    // Editar Material
    editarMaterial: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const nome = data.get('nome');
        const precoM2 = data.get('precoM2'); // Recebe como m²
        const ativo = data.get('ativo') === 'on';
        
        if (!id || !nome || !precoM2) {
            return fail(400, { error: 'Dados inválidos' });
        }
        
        // Converter de R$/m² para R$/mm² (dividir por 1.000.000)
        const precoMm2 = parseFloat(precoM2.toString()) / 1000000;
        
        await prisma.material.update({
            where: { id: id.toString() },
            data: {
                nome: nome.toString(),
                precoMm2: precoMm2,
                ativo
            }
        });
        
        return { success: true };
    },
    
    // Excluir Material
    excluirMaterial: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        
        if (!id) {
            return fail(400, { error: 'ID inválido' });
        }
        
        await prisma.material.delete({
            where: { id: id.toString() }
        });
        
        return { success: true };
    }
} satisfies Actions;