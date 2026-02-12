<script lang="ts">
	import Icon from '@iconify/svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate, formatCurrency, getOrcamentoStatusVariant, getOrcamentoStatusLabel } from '$lib/utils/format';

	type Props = {
		data: {
			stats: {
				orcamentosHoje: number;
				valorTotal: number;
				pedidosPendentes: number;
				clientesAtivos: number;
			};
			orcamentosRecentes: Array<{
				id: string;
				valorFinal: number;
				descricao: string | null;
				status: string;
				createdAt: Date;
				cliente: {
					nome: string;
				} | null;
			}>;
		};
	};

	let { data }: Props = $props();
</script>

<div class="dashboard">
	<div class="page-header">
		<div class="header-content">
			<Icon icon="lucide:layout-dashboard" class="header-icon" />
			<div>
				<h1>Dashboard</h1>
				<p class="subtitle">Bem-vindo ao sistema Laser Art</p>
			</div>
		</div>
		<a href="/orcamentos/criar" class="btn-primary">
			<Icon icon="lucide:plus" />
			Novo Orçamento
		</a>
	</div>

	<!-- Cards de Estatísticas -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon orange">
				<Icon icon="lucide:calculator" />
			</div>
			<div class="stat-content">
				<p class="stat-label">Orçamentos Hoje</p>
				<p class="stat-value">{data.stats.orcamentosHoje}</p>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon green">
				<Icon icon="lucide:dollar-sign" />
			</div>
			<div class="stat-content">
				<p class="stat-label">Valor Total Hoje</p>
				<p class="stat-value">{formatCurrency(data.stats.valorTotal)}</p>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon blue">
				<Icon icon="lucide:package" />
			</div>
			<div class="stat-content">
				<p class="stat-label">Pedidos Pendentes</p>
				<p class="stat-value">{data.stats.pedidosPendentes}</p>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon purple">
				<Icon icon="lucide:users" />
			</div>
			<div class="stat-content">
				<p class="stat-label">Clientes Ativos</p>
				<p class="stat-value">{data.stats.clientesAtivos}</p>
			</div>
		</div>
	</div>

	<!-- Orçamentos Recentes -->
	<div class="section">
		<div class="section-header">
			<h2>Orçamentos Recentes</h2>
			<a href="/orcamentos/salvos" class="link-action">
				Ver todos
				<Icon icon="lucide:arrow-right" />
			</a>
		</div>

		<div class="table-container">
			{#if data.orcamentosRecentes.length > 0}
				<table>
					<thead>
						<tr>
							<th>Cliente</th>
							<th>Descrição</th>
							<th>Valor</th>
							<th>Data</th>
							<th>Status</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.orcamentosRecentes as orc}
							<tr>
								<td>{orc.cliente?.nome || 'Cliente não informado'}</td>
								<td>{orc.descricao || '-'}</td>
								<td class="valor">{formatCurrency(orc.valorFinal)}</td>
								<td>{formatDate(orc.createdAt)}</td>
								<td>
									<StatusBadge
										variant={getOrcamentoStatusVariant(orc.status)}
										label={getOrcamentoStatusLabel(orc.status)}
									/>
								</td>
								<td>
									<a href="/orcamentos/salvos" class="btn-icon" title="Ver detalhes">
										<Icon icon="lucide:eye" />
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<EmptyState
					message="Nenhum orçamento criado ainda"
					actionHref="/orcamentos/criar"
					actionLabel="Criar Primeiro Orçamento"
				/>
			{/if}
		</div>
	</div>

	<!-- Ações Rápidas -->
	<div class="section">
		<h2>Ações Rápidas</h2>
		<div class="quick-actions">
			<a href="/orcamentos/criar" class="action-card">
				<Icon icon="lucide:calculator" />
				<span>Criar Orçamento</span>
			</a>
			<a href="/pedidos" class="action-card">
				<Icon icon="lucide:package" />
				<span>Novo Pedido</span>
			</a>
			<a href="/clientes" class="action-card">
				<Icon icon="lucide:user-plus" />
				<span>Cadastrar Cliente</span>
			</a>
			<a href="/recursos" class="action-card">
				<Icon icon="lucide:settings" />
				<span>Gerenciar Recursos</span>
			</a>
		</div>
	</div>
</div>

<style>
.dashboard {
	width: 100%;
	box-sizing: border-box;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
	padding-bottom: 20px;
	border-bottom: 2px solid rgba(255, 191, 145, 0.2);
}

.header-content {
	display: flex;
	align-items: center;
	gap: 16px;
}

.header-content :global(.header-icon) {
	width: 32px;
	height: 32px;
	color: #ffbf91;
}

h1 {
	font-size: 1.5rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.subtitle {
	color: #9ca3af;
	margin: 4px 0 0 0;
	font-size: 0.85rem;
}

.btn-primary {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	border-radius: 8px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.2s ease;
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(255, 154, 82, 0.4);
}

.btn-primary :global(svg) {
	width: 18px;
	height: 18px;
}

/* Stats Grid */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
	margin-bottom: 40px;
}

.stat-card {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 12px;
	padding: 24px;
	display: flex;
	align-items: center;
	gap: 16px;
	transition: all 0.2s ease;
}

.stat-card:hover {
	border-color: rgba(255, 191, 145, 0.3);
	transform: translateY(-2px);
}

.stat-icon {
	width: 48px;
	height: 48px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.stat-icon :global(svg) {
	width: 22px;
	height: 22px;
}

.stat-icon.orange {
	background: rgba(255, 154, 82, 0.15);
	color: #ffbf91;
}

.stat-icon.green {
	background: rgba(34, 197, 94, 0.15);
	color: #4ade80;
}

.stat-icon.blue {
	background: rgba(59, 130, 246, 0.15);
	color: #60a5fa;
}

.stat-icon.purple {
	background: rgba(168, 85, 247, 0.15);
	color: #a78bfa;
}

.stat-content {
	flex: 1;
}

.stat-label {
	color: #9ca3af;
	font-size: 0.8rem;
	margin: 0 0 4px 0;
}

.stat-value {
	color: #f9fafb;
	font-size: 1.4rem;
	font-weight: 700;
	margin: 0;
}

/* Section */
.section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 24px;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

h2 {
	font-size: 1.1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.link-action {
	display: flex;
	align-items: center;
	gap: 6px;
	color: #ffbf91;
	text-decoration: none;
	font-size: 0.9rem;
	font-weight: 500;
	transition: gap 0.2s ease;
}

.link-action:hover {
	gap: 10px;
}

.link-action :global(svg) {
	width: 16px;
	height: 16px;
}

/* Table */
.table-container {
	overflow-x: auto;
	border-radius: 8px;
}

table {
	width: 100%;
	border-collapse: collapse;
}

thead {
	background: rgba(30, 30, 30, 0.5);
}

th {
	text-align: left;
	padding: 12px 16px;
	color: #9ca3af;
	font-weight: 600;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

td {
	padding: 16px;
	color: #e5e7eb;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
}

tr:hover td {
	background: rgba(40, 40, 40, 0.5);
}

.valor {
	color: #4ade80;
	font-weight: 600;
}


.btn-icon {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.2s ease;
}

.btn-icon:hover {
	background: rgba(255, 191, 145, 0.1);
	color: #ffbf91;
}

.btn-icon :global(svg) {
	width: 18px;
	height: 18px;
}

/* Quick Actions */
.quick-actions {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-top: 20px;
}

.action-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px;
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 12px;
	text-decoration: none;
	color: #e5e7eb;
	transition: all 0.2s ease;
}

.action-card:hover {
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.7);
	transform: translateY(-2px);
}

.action-card :global(svg) {
	width: 32px;
	height: 32px;
	color: #ffbf91;
}

.action-card span {
	font-weight: 500;
	font-size: 0.95rem;
}


/* Responsividade Mobile */
@media (max-width: 768px) {
	.dashboard {
		padding: 0;
	}

	.page-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 24px;
	}

	.stats-grid {
		grid-template-columns: 1fr;
		gap: 12px;
	}

	.stat-card {
		padding: 16px;
	}

	h1 {
		font-size: 1.3rem;
	}

	h2 {
		font-size: 1rem;
	}

	.section {
		padding: 16px;
		margin-bottom: 16px;
	}

	.table-container {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		min-width: 600px;
	}

	th, td {
		padding: 12px 8px;
		font-size: 0.85rem;
	}

	.quick-actions {
		grid-template-columns: repeat(2, 1fr);
	}

	.action-card {
		padding: 16px;
	}

	.action-card :global(svg) {
		width: 24px;
		height: 24px;
	}
}
</style>