import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/prisma";
import { requireAuth } from "$lib/server/auth";

export const load: PageServerLoad = async ({ locals }) => {
    requireAuth(locals);

    // Buscar estatísticas do dashboard
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [
        orcamentosHoje,
        valorTotalHoje,
        pedidosPendentes,
        clientesAtivos,
        orcamentosRecentes
    ] = await Promise.all([
        // Contar orçamentos criados hoje
        prisma.orcamento.count({
            where: {
                createdAt: {
                    gte: hoje
                }
            }
        }),

        // Somar valor total de orçamentos de hoje
        prisma.orcamento.aggregate({
            where: {
                createdAt: {
                    gte: hoje
                }
            },
            _sum: {
                valorFinal: true
            }
        }),

        // Contar pedidos pendentes
        prisma.pedido.count({
            where: {
                status: 'Pendente'
            }
        }),

        // Contar clientes ativos
        prisma.cliente.count({
            where: {
                ativo: true
            }
        }),

        // Buscar últimos 5 orçamentos
        prisma.orcamento.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                cliente: true
            }
        })
    ]);

    //se esta logado, retorna os dados do usuario e estatísticas
    return {
        user: locals.user,
        stats: {
            orcamentosHoje,
            valorTotal: valorTotalHoje._sum.valorFinal || 0,
            pedidosPendentes,
            clientesAtivos
        },
        orcamentosRecentes
    };
};