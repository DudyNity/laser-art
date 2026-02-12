<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate, formatCurrency, getPedidoStatusLabel, getPedidoStatusVariant } from '$lib/utils/format';

	type Pedido = {
		id: string;
		orcamento: string;
		cliente: string;
		valor: number;
		dataEntrega: Date;
		status: string;
		createdAt: Date;
		updatedAt: Date;
	};
	
	type PageData = {
		user: { id: string; username: string };
		pedidos: Pedido[];
	};
	
	let { data }: { data: PageData } = $props();
	
	let showModal = $state(false);
	let statusFilter = $state('todos');
	
	let formData = $state({
		orcamento: '',
		cliente: '',
		valor: '',
		dataEntrega: '',
		status: 'Pendente'
	});
	
	let filteredPedidos = $derived(() => {
		if (statusFilter === 'todos') return data.pedidos;
		return data.pedidos.filter(p => p.status === statusFilter);
	});
	
	function abrirModal() {
		showModal = true;
	}
	
	function fecharModal() {
		showModal = false;
		limparForm();
	}
	
	function limparForm() {
		formData = {
			orcamento: '',
			cliente: '',
			valor: '',
			dataEntrega: '',
			status: 'Pendente'
		};
	}
	
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:package" class="header-icon" />
		<h1>Gestão de Pedidos</h1>
	</div>
	<button class="btn-primary" onclick={abrirModal}>
		<Icon icon="lucide:plus" />
		Novo Pedido
	</button>
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
					<th>Orçamento</th>
					<th>Cliente</th>
					<th>Valor</th>
					<th>Entrega</th>
					<th>Status</th>
					<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredPedidos() as pedido}
					<tr>
						<td class="orcamento-cell">{pedido.orcamento}</td>
						<td>{pedido.cliente}</td>
						<td class="valor">{formatCurrency(pedido.valor)}</td>
						<td>{formatDate(pedido.dataEntrega)}</td>
						<td>
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
						</td>
						<td>
							<div class="action-buttons">
								<button class="btn-icon" title="Visualizar">
									<Icon icon="lucide:eye" />
								</button>
								<button class="btn-icon" title="Gerar PDF">
									<Icon icon="lucide:file-text" />
								</button>
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
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		
		{#if filteredPedidos().length === 0}
			<EmptyState message="Nenhum pedido encontrado" />
		{/if}
	</div>
</div>

<!-- Modal Lateral -->
{#if showModal}
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
					<label for="orcamento">Código do Orçamento</label>
					<input 
						type="text" 
						id="orcamento"
						name="orcamento"
						bind:value={formData.orcamento}
						placeholder="Ex: ORC-001"
						required
					/>
				</div>
				
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

tr:hover td {
	background: rgba(40, 40, 40, 0.5);
}

.orcamento-cell {
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

.btn-icon.danger:hover {
	background: rgba(239, 68, 68, 0.2);
	border-color: #ef4444;
	color: #ef4444;
}

.btn-icon :global(svg) {
	width: 15px;
	height: 15px;
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
	from {
		transform: translateX(100%);
	}
	to {
		transform: translateX(0);
	}
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