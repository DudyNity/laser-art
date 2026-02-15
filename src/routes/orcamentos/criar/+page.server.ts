import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load = async ({ locals, url }: RequestEvent) => {
    requireAuth(locals);

    const editId = url.searchParams.get('edit');

    const [maquinas, materiais, clientes, configEmpresa] = await Promise.all([
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
        }),
        prisma.configEmpresa.upsert({
            where: { id: 'config' },
            update: {},
            create: { id: 'config' }
        })
    ]);

    let orcamentoEditando = null;
    if (editId) {
        orcamentoEditando = await prisma.orcamento.findUnique({
            where: { id: editId },
            include: { cliente: true }
        });
    }

    return {
        user: locals.user,
        maquinas,
        materiais,
        clientes,
        orcamentoEditando,
        configEmpresa
    };
};

export const actions = {
    criarOrcamento: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const clienteId = data.get('clienteId');
        const nomeCliente = data.get('nomeCliente');
        const descricao = data.get('descricao');
        const itensDetalhados = data.get('itensDetalhados');
        const subtotal = data.get('subtotal');
        const margemLucro = data.get('margemLucro');
        const gastosAdicionais = data.get('gastosAdicionais');
        const valorFinal = data.get('valorFinal');

        if (!valorFinal) {
            return fail(400, { error: 'Preencha os campos obrigatórios' });
        }

        await prisma.orcamento.create({
            data: {
                clienteId: clienteId ? clienteId.toString() : null,
                nomeCliente: nomeCliente ? nomeCliente.toString() : null,
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
    },

    editarOrcamento: async ({ request }: RequestEvent) => {
        const data = await request.formData();
        const id = data.get('id');
        const clienteId = data.get('clienteId');
        const nomeCliente = data.get('nomeCliente');
        const descricao = data.get('descricao');
        const itensDetalhados = data.get('itensDetalhados');
        const subtotal = data.get('subtotal');
        const margemLucro = data.get('margemLucro');
        const gastosAdicionais = data.get('gastosAdicionais');
        const valorFinal = data.get('valorFinal');

        if (!id || !valorFinal) {
            return fail(400, { error: 'Dados inválidos' });
        }

        await prisma.orcamento.update({
            where: { id: id.toString() },
            data: {
                clienteId: clienteId ? clienteId.toString() : null,
                nomeCliente: nomeCliente ? nomeCliente.toString() : null,
                descricao: descricao ? descricao.toString() : null,
                itensDetalhados: itensDetalhados ? itensDetalhados.toString() : null,
                subtotal: parseFloat(subtotal?.toString() || '0'),
                margemLucro: parseFloat(margemLucro?.toString() || '30'),
                gastosAdicionais: parseFloat(gastosAdicionais?.toString() || '0'),
                valorFinal: parseFloat(valorFinal.toString())
            }
        });

        throw redirect(303, '/orcamentos/salvos');
    }
};
