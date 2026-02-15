<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { getAtivoVariant, getAtivoLabel } from '$lib/utils/format';
	
	type Cliente = {
		id: string;
		nome: string;
		cpfCnpj: string | null;
		telefone: string;
		email: string | null;
		endereco: string | null;
		observacoes: string | null;
		ativo: boolean;
		createdAt: Date;
		updatedAt: Date;
	};
	
	type PageData = {
		user: { id: string; username: string };
		clientes: Cliente[];
	};

	let { data }: { data: PageData } = $props();
	
	let formData = $state({
		id: '',
		nome: '',
		cpfCnpj: '',
		telefone: '',
		email: '',
		endereco: '',
		observacoes: '',
		ativo: true
	});
	
	let editingId = $state<string | null>(null);
	let searchTerm = $state('');
	
	let filteredClientes = $derived(() => {
		return data.clientes.filter(c => 
			c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
		);
	});
	
	function editarCliente(cliente: Cliente) {
		formData = {
			id: cliente.id,
			nome: cliente.nome,
			cpfCnpj: cliente.cpfCnpj || '',
			telefone: cliente.telefone,
			email: cliente.email || '',
			endereco: cliente.endereco || '',
			observacoes: cliente.observacoes || '',
			ativo: cliente.ativo
		};
		editingId = cliente.id;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
	
	function limparForm() {
		formData = {
			id: '',
			nome: '',
			cpfCnpj: '',
			telefone: '',
			email: '',
			endereco: '',
			observacoes: '',
			ativo: true
		};
		editingId = null;
	}
	
	function formatarTelefone(value: string) {
		const numbers = value.replace(/\D/g, '');
		// Com código do país 55: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
		if (numbers.startsWith('55') && numbers.length > 11) {
			const sem55 = numbers.slice(2);
			if (sem55.length <= 10) {
				return '+55 ' + sem55.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
			}
			return '+55 ' + sem55.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
		}
		// Sem código do país: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
		if (numbers.length <= 10) {
			return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
		}
		return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
	}
	
	function formatarCPFCNPJ(value: string) {
		const numbers = value.replace(/\D/g, '');
		if (numbers.length <= 11) {
			// CPF
			return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
		} else {
			// CNPJ
			return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
		}
	}
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:users" class="header-icon" />
		<h1>Clientes</h1>
	</div>
</div>

<div class="content-grid">
	<!-- Formulário -->
	<div class="form-section">
		<h2>{editingId ? 'Editar' : 'Novo'} Cliente</h2>
		<form 
			method="POST" 
			action="?/{editingId ? 'editarCliente' : 'criarCliente'}"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						limparForm();
					}
					await update();
				};
			}}
		>
			{#if editingId}
				<input type="hidden" name="id" value={formData.id} />
			{/if}
			
			<div class="field">
				<label for="nome">Nome / Razão Social *</label>
				<input 
					type="text" 
					id="nome"
					name="nome"
					bind:value={formData.nome}
					placeholder="Nome completo ou empresa"
					required
				/>
			</div>
			
			<div class="field-row">
				<div class="field">
					<label for="cpfCnpj">CPF / CNPJ</label>
					<input 
						type="text" 
						id="cpfCnpj"
						name="cpfCnpj"
						value={formData.cpfCnpj}
						oninput={(e) => formData.cpfCnpj = formatarCPFCNPJ(e.currentTarget.value)}
						placeholder="000.000.000-00"
						maxlength="18"
					/>
				</div>
				
				<div class="field">
					<label for="telefone">Telefone *</label>
					<input 
						type="text" 
						id="telefone"
						name="telefone"
						value={formData.telefone}
						oninput={(e) => formData.telefone = formatarTelefone(e.currentTarget.value)}
						placeholder="(00) 00000-0000 ou +55"
						maxlength="19"
						required
					/>
				</div>
			</div>
			
			<div class="field">
				<label for="email">E-mail</label>
				<input
					type="email"
					id="email"
					name="email"
					bind:value={formData.email}
					placeholder="cliente@email.com"
				/>
			</div>
			
			<div class="field">
				<label for="endereco">Endereço</label>
				<input 
					type="text" 
					id="endereco"
					name="endereco"
					bind:value={formData.endereco}
					placeholder="Rua, número, bairro"
				/>
			</div>
			
			<div class="field">
				<label for="observacoes">Observações</label>
				<textarea 
					id="observacoes"
					name="observacoes"
					bind:value={formData.observacoes}
					placeholder="Informações adicionais..."
					rows="2"
				></textarea>
			</div>
			
			<label class="checkbox-option">
				<input 
					type="checkbox" 
					name="ativo"
					bind:checked={formData.ativo}
				/>
				<span>Cliente Ativo</span>
			</label>
			
			<div class="form-actions">
				{#if editingId}
					<button type="button" class="btn-secondary" onclick={limparForm}>
						Cancelar
					</button>
				{/if}
				<button type="submit" class="btn-primary">
					<Icon icon={editingId ? 'lucide:save' : 'lucide:user-plus'} />
					{editingId ? 'Salvar' : 'Cadastrar'}
				</button>
			</div>
		</form>
	</div>
	
	<!-- Lista de Clientes -->
	<div class="list-section">
		<div class="list-header">
			<h2>Cadastrados ({data.clientes.length})</h2>
			<div class="search-box">
				<Icon icon="lucide:search" />
				<input 
					type="text" 
					bind:value={searchTerm}
					placeholder="Buscar..."
				/>
			</div>
		</div>
		
		<div class="clientes-list">
			{#each filteredClientes() as cliente}
				<div class="cliente-card">
					<div class="cliente-header">
						<div class="cliente-avatar">
							{cliente.nome.charAt(0).toUpperCase()}
						</div>
						<div class="cliente-info">
							<h3>{cliente.nome}</h3>
							{#if cliente.cpfCnpj}
								<p class="cpf-cnpj">{cliente.cpfCnpj}</p>
							{/if}
						</div>
						<StatusBadge variant={getAtivoVariant(cliente.ativo)} label={getAtivoLabel(cliente.ativo)} />
					</div>
					
					<div class="cliente-details">
						<div class="detail-item">
							<Icon icon="lucide:phone" />
							<span>{cliente.telefone}</span>
						</div>
						{#if cliente.email}
						<div class="detail-item">
							<Icon icon="lucide:mail" />
							<span>{cliente.email}</span>
						</div>
						{/if}
						{#if cliente.endereco}
							<div class="detail-item">
								<Icon icon="lucide:map-pin" />
								<span>{cliente.endereco}</span>
							</div>
						{/if}
					</div>
					
					{#if cliente.observacoes}
						<div class="observacoes">
							<Icon icon="lucide:file-text" />
							<span>{cliente.observacoes}</span>
						</div>
					{/if}
					
					<div class="cliente-actions">
						<button class="btn-icon" onclick={() => editarCliente(cliente)}>
							<Icon icon="lucide:pencil" />
						</button>
						<form 
							method="POST" 
							action="?/excluirCliente"
							use:enhance={() => {
								return async ({ update }) => {
									if (confirm('Deseja realmente excluir este cliente?')) {
										await update();
									}
								};
							}}
							style="display: inline; flex: 1;"
						>
							<input type="hidden" name="id" value={cliente.id} />
							<button type="submit" class="btn-icon danger">
								<Icon icon="lucide:trash-2" />
							</button>
						</form>
					</div>
				</div>
			{/each}
			
			{#if filteredClientes().length === 0}
				<EmptyState icon="lucide:user-x" message="Nenhum cliente encontrado" />
			{/if}
		</div>
	</div>
</div>

<style>
.page-header {
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

/* Content Grid */
.content-grid {
	display: grid;
	grid-template-columns: 380px 1fr;
	gap: 20px;
}

.form-section, .list-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	padding: 20px;
}

h2 {
	font-size: 1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0 0 16px 0;
}

/* Form */
.field {
	margin-bottom: 14px;
}

.field-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	margin-bottom: 14px;
}

label {
	display: block;
	margin-bottom: 6px;
	font-size: 0.85rem;
	font-weight: 500;
	color: #d1d5db;
}

input, textarea {
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

input::placeholder,
textarea::placeholder {
	color: #6b7280;
	font-size: 0.85rem;
}

input:focus, textarea:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
}

textarea {
	resize: vertical;
}

.checkbox-option {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 14px;
	background: rgba(30, 30, 30, 0.5);
	border-radius: 7px;
	border: 1px solid rgba(255, 191, 145, 0.2);
	cursor: pointer;
	margin-bottom: 16px;
	transition: all 0.2s ease;
}

.checkbox-option:hover {
	background: rgba(40, 40, 40, 0.7);
	border-color: #ffbf91;
}

.checkbox-option input[type="checkbox"] {
	width: 16px;
	height: 16px;
	margin: 0;
	accent-color: #ffbf91;
	cursor: pointer;
}

.checkbox-option span {
	color: #e0e0e0;
	font-size: 0.9rem;
}

.form-actions {
	display: flex;
	gap: 10px;
	margin-top: 20px;
}

.btn-primary, .btn-secondary {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px 16px;
	border-radius: 7px;
	font-weight: 600;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	flex: 1;
}

.btn-primary {
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
}

.btn-primary:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.4);
}

.btn-secondary {
	background: rgba(60, 60, 60, 0.8);
	color: #e0e0e0;
	border: 1px solid rgba(255, 191, 145, 0.2);
}

.btn-secondary:hover {
	background: rgba(70, 70, 70, 0.9);
	border-color: #ffbf91;
}

.btn-primary :global(svg),
.btn-secondary :global(svg) {
	width: 16px;
	height: 16px;
}

/* List */
.list-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
}

.search-box {
	display: flex;
	align-items: center;
	gap: 8px;
	background: rgba(30, 30, 30, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 7px;
	padding: 8px 12px;
	width: 200px;
}

.search-box :global(svg) {
	width: 16px;
	height: 16px;
	color: #9ca3af;
	flex-shrink: 0;
}

.search-box input {
	flex: 1;
	background: transparent;
	border: none;
	color: #f9fafb;
	font-size: 0.85rem;
	padding: 0;
	min-width: 0;
}

.search-box input:focus {
	outline: none;
	box-shadow: none;
}

.clientes-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	max-height: calc(100vh - 200px);
	overflow-y: auto;
	padding-right: 4px;
}

.cliente-card {
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 8px;
	padding: 14px;
	transition: all 0.2s ease;
}

.cliente-card:hover {
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.7);
}

.cliente-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 10px;
	padding-bottom: 10px;
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
}

.cliente-avatar {
	width: 40px;
	height: 40px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #1a1a1a;
	font-weight: 700;
	font-size: 1.1rem;
	flex-shrink: 0;
}

.cliente-info {
	flex: 1;
	min-width: 0;
}

.cliente-info h3 {
	font-size: 0.95rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0 0 2px 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cpf-cnpj {
	color: #9ca3af;
	font-size: 0.75rem;
	margin: 0;
	font-family: monospace;
}

.badge {
	padding: 3px 10px;
	border-radius: 10px;
	font-size: 0.7rem;
	font-weight: 600;
	flex-shrink: 0;
}

.badge.success {
	background: rgba(34, 197, 94, 0.2);
	color: #4ade80;
}

.badge.inactive {
	background: rgba(107, 114, 128, 0.2);
	color: #9ca3af;
}

.cliente-details {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 10px;
}

.detail-item {
	display: flex;
	align-items: center;
	gap: 8px;
	color: #d1d5db;
	font-size: 0.85rem;
}

.detail-item :global(svg) {
	width: 14px;
	height: 14px;
	color: #9ca3af;
	flex-shrink: 0;
}

.detail-item span {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.observacoes {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 8px;
	background: rgba(255, 191, 145, 0.05);
	border-radius: 6px;
	border-left: 2px solid #ffbf91;
	margin-bottom: 10px;
	font-size: 0.8rem;
	color: #d1d5db;
}

.observacoes :global(svg) {
	width: 12px;
	height: 12px;
	color: #ffbf91;
	flex-shrink: 0;
	margin-top: 2px;
}

.cliente-actions {
	display: flex;
	gap: 6px;
	padding-top: 10px;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
}

.btn-icon {
	flex: 1;
	background: rgba(60, 60, 60, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	color: #e0e0e0;
	cursor: pointer;
	padding: 7px;
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

.empty-state {
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;
}

.empty-state :global(svg) {
	width: 48px;
	height: 48px;
	margin-bottom: 12px;
	opacity: 0.5;
}

.empty-state p {
	margin: 0;
	font-size: 0.9rem;
}

@media (max-width: 1024px) {
	.content-grid {
		grid-template-columns: 1fr;
	}
	
	.clientes-list {
		max-height: none;
	}
}
</style>