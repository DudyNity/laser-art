<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { formatDate, formatCurrency, getPedidoStatusLabel, getPedidoStatusVariant } from '$lib/utils/format';

	type OrcamentoInfo = {
		descricao: string | null;
		itensDetalhados: string | null;
	};

	type Pedido = {
		id: string;
		cliente: string;
		valor: number;
		dataEntrega: Date;
		status: string;
		createdAt: Date;
		updatedAt: Date;
		orcamento: OrcamentoInfo;
	};

	type PageData = {
		user: { id: string; username: string };
		isCliente: boolean;
		pedidos: Pedido[];
	};

	let { data }: { data: PageData } = $props();

	let showModal = $state(false);
	let statusFilter = $state('todos');
	let expandedIds = $state(new Set<string>());

	let formData = $state({
		cliente: '',
		valor: '',
		dataEntrega: '',
		status: 'Pendente'
	});

	let filteredPedidos = $derived(() => {
		if (statusFilter === 'todos') return data.pedidos;
		return data.pedidos.filter(p => p.status === statusFilter);
	});

	function getProdutoNome(pedido: Pedido): string {
		if (pedido.orcamento?.itensDetalhados) {
			try {
				const d = JSON.parse(pedido.orcamento.itensDetalhados);
				const itens = d.itens || [];
				if (itens.length === 0) return pedido.orcamento.descricao || 'Produto';
				if (itens.length === 1) return itens[0].descricaoProduto || 'Produto';
				return `${itens[0].descricaoProduto} (+${itens.length - 1})`;
			} catch {}
		}
		return pedido.orcamento?.descricao || 'Produto';
	}

	function getItens(pedido: Pedido): any[] {
		if (!pedido.orcamento?.itensDetalhados) return [];
		try {
			const d = JSON.parse(pedido.orcamento.itensDetalhados);
			return d.itens || [];
		} catch { return []; }
	}

	function getGastos(pedido: Pedido): any[] {
		if (!pedido.orcamento?.itensDetalhados) return [];
		try {
			const d = JSON.parse(pedido.orcamento.itensDetalhados);
			return d.gastosAdicionais || [];
		} catch { return []; }
	}

	function toggleExpand(id: string) {
		const next = new Set(expandedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedIds = next;
	}

	function abrirModal() {
		showModal = true;
	}

	function fecharModal() {
		showModal = false;
		formData = { cliente: '', valor: '', dataEntrega: '', status: 'Pendente' };
	}
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:package" class="header-icon" />
		<h1>Gestão de Pedidos</h1>
	</div>
	{#if !data.isCliente}
	<button class="btn-primary" onclick={abrirModal}>
		<Icon icon="lucide:plus" />
		Novo Pedido
	</button>
	{/if}
</div>

<!-- Filtros -->
<div class="filters-section">
	<div class="filter-chips">
		<button
			class="chip {statusFilter === 'todos' ? 'active' : ''}"
			onclick={() => statusFilter = 'todos'}
		>
			<Icon icon="lucide:list" />
			Todos
		</button>
		<button
			class="chip {statusFilter === 'Pendente' ? 'active' : ''}"
			onclick={() => statusFilter = 'Pendente'}
		>
			<Icon icon="lucide:clock" />
			Pendentes
		</button>
		<button
			class="chip {statusFilter === 'EmProducao' ? 'active' : ''}"
			onclick={() => statusFilter = 'EmProducao'}
		>
			<Icon icon="lucide:loader" />
			Em Produção
		</button>
		<button
			class="chip {statusFilter === 'Concluido' ? 'active' : ''}"
			onclick={() => statusFilter = 'Concluido'}
		>
			<Icon icon="lucide:check-circle" />
			Concluídos
		</button>
	</div>
</div>

<!-- Tabela de Pedidos -->
<div class="table-section">
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Produto</th>
					<th>Cliente</th>
					<th>Valor</th>
					<th>Entrega</th>
					<th>Status</th>
					<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredPedidos() as pedido}
					<tr class="pedido-row {expandedIds.has(pedido.id) ? 'expanded' : ''}">
						<td class="produto-cell">{getProdutoNome(pedido)}</td>
						<td>{pedido.cliente}</td>
						<td class="valor">{formatCurrency(pedido.valor)}</td>
						<td>{formatDate(pedido.dataEntrega)}</td>
						<td>
							{#if data.isCliente}
								<StatusBadge
									variant={getPedidoStatusVariant(pedido.status)}
									label={getPedidoStatusLabel(pedido.status)}
								/>
							{:else}
								<form
									method="POST"
									action="?/atualizarStatus"
									use:enhance
									style="display: inline;"
								>
									<input type="hidden" name="id" value={pedido.id} />
									<select
										class="status-select {getPedidoStatusVariant(pedido.status)}"
										name="status"
										value={pedido.status}
										onchange={(e) => e.currentTarget.form?.requestSubmit()}
									>
										<option value="Pendente">Pendente</option>
										<option value="EmProducao">Em Produção</option>
										<option value="Concluido">Concluído</option>
									</select>
								</form>
							{/if}
						</td>
						<td>
							<div class="action-buttons">
								<button
									class="btn-icon {expandedIds.has(pedido.id) ? 'active-view' : ''}"
									title="Visualizar detalhes"
									onclick={() => toggleExpand(pedido.id)}
								>
									<Icon icon={expandedIds.has(pedido.id) ? 'lucide:chevron-up' : 'lucide:eye'} />
								</button>
								{#if !data.isCliente}
								<form
									method="POST"
									action="?/excluirPedido"
									use:enhance={() => {
										return async ({ update }) => {
											if (confirm('Deseja realmente excluir este pedido?')) {
												await update();
											}
										};
									}}
									style="display: inline;"
								>
									<input type="hidden" name="id" value={pedido.id} />
									<button type="submit" class="btn-icon danger" title="Excluir">
										<Icon icon="lucide:trash-2" />
									</button>
								</form>
								{/if}
							</div>
						</td>
					</tr>
					{#if expandedIds.has(pedido.id)}
					<tr class="detail-row">
						<td colspan="6">
							<div class="detail-panel">
								<h4>
									<Icon icon="lucide:clipboard-list" />
									Detalhes do Pedido
								</h4>
								{#each getItens(pedido) as item, i}
								<div class="detail-item">
									<div class="detail-item-header">
										<span class="item-num">#{i + 1}</span>
										<strong>{item.descricaoProduto || 'Item'}</strong>
										{#if item.pintada}
											<span class="badge-pintada">
												<Icon icon="lucide:droplet" />
												Pintada
											</span>
										{/if}
									</div>
									<div class="detail-grid">
										<div class="detail-field">
											<span class="field-label">Material</span>
											<span class="field-value">{item.materialNome || 'N/A'}</span>
										</div>
										<div class="detail-field">
											<span class="field-label">Máquina</span>
											<span class="field-value">{item.maquinaNome || 'N/A'}</span>
										</div>
										<div class="detail-field">
											<span class="field-label">Dimensões</span>
											<span class="field-value">{item.larguraMm || 0} × {item.alturaMm || 0} mm</span>
										</div>
										<div class="detail-field">
											<span class="field-label">Quantidade</span>
											<span class="field-value">{item.quantidade || 1} un.</span>
										</div>
										{#if item.pintada && item.valorPintura > 0}
										<div class="detail-field">
											<span class="field-label">Pintura</span>
											<span class="field-value">{formatCurrency(item.valorPintura)}</span>
										</div>
										{/if}
										<div class="detail-field highlight">
											<span class="field-label">Valor</span>
											<span class="field-value">{formatCurrency(item.valorTotal || 0)}</span>
										</div>
									</div>
								</div>
								{/each}
								{#if getGastos(pedido).length > 0}
								<div class="detail-gastos">
									<span class="gastos-label">Gastos adicionais:</span>
									{#each getGastos(pedido) as gasto}
									<span class="gasto-tag">{gasto.descricao}: {formatCurrency(gasto.valor)}</span>
									{/each}
								</div>
								{/if}
								{#if getItens(pedido).length === 0 && !pedido.orcamento?.itensDetalhados}
								<p class="no-details">Sem detalhes de itens disponíveis.</p>
								{/if}
							</div>
						</td>
					</tr>
					{/if}
				{/each}
			</tbody>
		</table>

		{#if filteredPedidos().length === 0}
			<EmptyState message="Nenhum pedido encontrado" />
		{/if}
	</div>
</div>

<!-- Modal Lateral (apenas para admins) -->
{#if showModal && !data.isCliente}
	<div class="modal-overlay" onclick={fecharModal}>
		<div class="modal-drawer" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Criar Novo Pedido</h2>
				<button class="btn-close" onclick={fecharModal}>
					<Icon icon="lucide:x" />
				</button>
			</div>

			<form
				class="modal-body"
				method="POST"
				action="?/criarPedido"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							fecharModal();
						}
						await update();
					};
				}}
			>
				<div class="field">
					<label for="cliente">Nome do Cliente</label>
					<input
						type="text"
						id="cliente"
						name="cliente"
						bind:value={formData.cliente}
						placeholder="Ex: João Silva"
						required
					/>
				</div>

				<div class="field">
					<label for="valor">Valor (R$)</label>
					<input
						type="number"
						id="valor"
						name="valor"
						bind:value={formData.valor}
						placeholder="Ex: 450.00"
						step="0.01"
						required
					/>
				</div>

				<div class="field">
					<label for="dataEntrega">Data de Entrega</label>
					<input
						type="date"
						id="dataEntrega"
						name="dataEntrega"
						bind:value={formData.dataEntrega}
						required
					/>
				</div>

				<div class="field">
					<label>Status Inicial</label>
					<div class="radio-group">
						<label class="radio-option">
							<input
								type="radio"
								name="status"
								value="Pendente"
								bind:group={formData.status}
							/>
							<span>Pendente</span>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="status"
								value="EmProducao"
								bind:group={formData.status}
							/>
							<span>Em Produção</span>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="status"
								value="Concluido"
								bind:group={formData.status}
							/>
							<span>Concluído</span>
						</label>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={fecharModal}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary">
						<Icon icon="lucide:check" />
						Criar Pedido
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 2px solid rgba(255, 191, 145, 0.2);
}

.header-content {
	display: flex;
	align-items: center;
	gap: 10px;
}

.header-content :global(.header-icon) {
	width: 26px;
	height: 26px;
	color: #ffbf91;
}

h1 {
	font-size: 1.5rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.btn-primary {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 20px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	border-radius: 7px;
	font-weight: 600;
	font-size: 0.9rem;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-primary:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.4);
}

.btn-primary :global(svg) {
	width: 16px;
	height: 16px;
}

/* Filters */
.filters-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	padding: 16px;
	margin-bottom: 20px;
}

.filter-chips {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.chip {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 16px;
	color: #d1d5db;
	font-size: 0.85rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
}

.chip:hover {
	background: rgba(40, 40, 40, 0.7);
	border-color: #ffbf91;
}

.chip.active {
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	border-color: transparent;
}

.chip :global(svg) {
	width: 15px;
	height: 15px;
}

/* Table */
.table-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	overflow: hidden;
}

.table-container {
	overflow-x: auto;
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
	padding: 12px 14px;
	color: #9ca3af;
	font-weight: 600;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

td {
	padding: 12px 14px;
	color: #e5e7eb;
	font-size: 0.9rem;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
}

.pedido-row:hover td {
	background: rgba(40, 40, 40, 0.5);
}

.pedido-row.expanded td {
	background: rgba(40, 40, 40, 0.4);
	border-bottom: none;
}

.produto-cell {
	color: #60a5fa;
	font-weight: 600;
}

.valor {
	color: #4ade80;
	font-weight: 600;
}

.status-select {
	padding: 5px 10px;
	border-radius: 10px;
	font-size: 0.75rem;
	font-weight: 600;
	border: 1px solid transparent;
	cursor: pointer;
	transition: all 0.2s ease;
}

.status-select.warning {
	background: rgba(251, 191, 36, 0.2);
	color: #fbbf24;
}

.status-select.info {
	background: rgba(59, 130, 246, 0.2);
	color: #60a5fa;
}

.status-select.success {
	background: rgba(34, 197, 94, 0.2);
	color: #4ade80;
}

.status-select:hover {
	border-color: currentColor;
}

.action-buttons {
	display: flex;
	gap: 6px;
}

.btn-icon {
	background: rgba(60, 60, 60, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	color: #e0e0e0;
	cursor: pointer;
	padding: 6px;
	border-radius: 6px;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.btn-icon:hover {
	background: rgba(70, 70, 70, 0.9);
	border-color: #ffbf91;
	color: #ffbf91;
}

.btn-icon.active-view {
	background: rgba(255, 154, 82, 0.15);
	border-color: #ffbf91;
	color: #ffbf91;
}

.btn-icon.danger:hover {
	background: rgba(239, 68, 68, 0.2);
	border-color: #ef4444;
	color: #ef4444;
}

.btn-icon :global(svg) {
	width: 15px;
	height: 15px;
}

/* Detail row */
.detail-row td {
	padding: 0;
	border-top: none;
}

.detail-panel {
	background: rgba(20, 20, 20, 0.6);
	border-top: 1px solid rgba(255, 191, 145, 0.15);
	border-bottom: 1px solid rgba(255, 191, 145, 0.15);
	padding: 16px 20px;
}

.detail-panel h4 {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	color: #ffbf91;
	margin: 0 0 14px 0;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.detail-panel h4 :global(svg) {
	width: 15px;
	height: 15px;
}

.detail-item {
	background: rgba(40, 40, 40, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 10px;
}

.detail-item-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 10px;
}

.item-num {
	font-size: 0.75rem;
	font-weight: 700;
	color: #9ca3af;
	background: rgba(60, 60, 60, 0.8);
	padding: 2px 7px;
	border-radius: 4px;
}

.detail-item-header strong {
	color: #f9fafb;
	font-size: 0.9rem;
}

.badge-pintada {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.7rem;
	font-weight: 600;
	color: #a78bfa;
	background: rgba(167, 139, 250, 0.15);
	border: 1px solid rgba(167, 139, 250, 0.3);
	border-radius: 4px;
	padding: 2px 6px;
}

.badge-pintada :global(svg) {
	width: 11px;
	height: 11px;
}

.detail-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 8px;
}

.detail-field {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.field-label {
	font-size: 0.72rem;
	color: #9ca3af;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.field-value {
	font-size: 0.85rem;
	color: #e5e7eb;
	font-weight: 500;
}

.detail-field.highlight .field-value {
	color: #4ade80;
	font-weight: 600;
}

.detail-gastos {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
}

.gastos-label {
	font-size: 0.8rem;
	color: #9ca3af;
	font-weight: 600;
}

.gasto-tag {
	font-size: 0.8rem;
	color: #fbbf24;
	background: rgba(251, 191, 36, 0.1);
	border: 1px solid rgba(251, 191, 36, 0.2);
	border-radius: 5px;
	padding: 3px 8px;
}

.no-details {
	font-size: 0.85rem;
	color: #6b7280;
	margin: 0;
}

/* Modal Drawer */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	z-index: 1000;
	display: flex;
	justify-content: flex-end;
}

.modal-drawer {
	width: 100%;
	max-width: 450px;
	background: #2a2a2a;
	border-left: 1px solid rgba(255, 191, 145, 0.2);
	display: flex;
	flex-direction: column;
	animation: slideIn 0.3s ease;
}

@keyframes slideIn {
	from { transform: translateX(100%); }
	to { transform: translateX(0); }
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
}

.modal-header h2 {
	font-size: 1.1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.btn-close {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.2s ease;
}

.btn-close:hover {
	background: rgba(255, 191, 145, 0.1);
	color: #ffbf91;
}

.btn-close :global(svg) {
	width: 22px;
	height: 22px;
}

.modal-body {
	flex: 1;
	padding: 20px;
	overflow-y: auto;
}

.field {
	margin-bottom: 20px;
}

label {
	display: block;
	margin-bottom: 6px;
	font-size: 0.85rem;
	font-weight: 500;
	color: #d1d5db;
}

input, select {
	width: 100%;
	padding: 10px 12px;
	background: rgba(30, 30, 30, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 7px;
	color: #f9fafb;
	font-size: 0.9rem;
	font-family: 'Inter', sans-serif;
	transition: all 0.2s ease;
	box-sizing: border-box;
}

input::placeholder {
	color: #6b7280;
	font-size: 0.85rem;
}

input:focus, select:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
}

.radio-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.radio-option {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 14px;
	background: rgba(30, 30, 30, 0.5);
	border-radius: 7px;
	border: 1px solid rgba(255, 191, 145, 0.2);
	cursor: pointer;
	transition: all 0.2s ease;
}

.radio-option:hover {
	background: rgba(40, 40, 40, 0.7);
	border-color: #ffbf91;
}

.radio-option input[type="radio"] {
	width: 16px;
	height: 16px;
	margin: 0;
	accent-color: #ffbf91;
	cursor: pointer;
}

.radio-option span {
	color: #e0e0e0;
	font-size: 0.9rem;
}

.modal-footer {
	display: flex;
	gap: 10px;
	padding-top: 20px;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
}

.btn-secondary {
	flex: 1;
	padding: 10px 16px;
	background: rgba(60, 60, 60, 0.8);
	color: #e0e0e0;
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 7px;
	font-weight: 600;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-secondary:hover {
	background: rgba(70, 70, 70, 0.9);
	border-color: #ffbf91;
}

.modal-footer .btn-primary {
	flex: 1;
}
</style>
