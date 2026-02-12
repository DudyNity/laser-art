<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { getAtivoVariant, getAtivoLabel } from '$lib/utils/format';
	import type { PageData } from './$types';
	
	type Maquina = {
		id: string;
		nome: string;
		custoHora: number;
		ativa: boolean;
		createdAt: Date;
		updatedAt: Date;
	};
	
	type Material = {
		id: string;
		nome: string;
		precoMm2: number;
		ativo: boolean;
		createdAt: Date;
		updatedAt: Date;
	};
	
	type PageData = {
		user: { id: string; username: string };
		maquinas: Maquina[];
		materiais: Material[];
	};

	let { data }: { data: PageData } = $props();
	
	let activeTab = $state('maquinas');
	
	let formMaquina = $state({
		id: '',
		nome: '',
		custoHora: '',
		ativa: true
	});
	
	let formMaterial = $state({
		id: '',
		nome: '',
		precoM2: '',
		ativo: true
	});
	
	let editingMaquinaId = $state<string | null>(null);
	let editingMaterialId = $state<string | null>(null);
	
	function editarMaquina(maquina: typeof data.maquinas[0]) {
		formMaquina = {
			id: maquina.id,
			nome: maquina.nome,
			custoHora: maquina.custoHora.toString(),
			ativa: maquina.ativa
		};
		editingMaquinaId = maquina.id;
	}
	
	function editarMaterial(material: typeof data.materiais[0]) {
		// Converter de mm² para m² ao editar
		const precoM2 = material.precoMm2 * 1000000;
		formMaterial = {
			id: material.id,
			nome: material.nome,
			precoM2: precoM2.toString(),
			ativo: material.ativo
		};
		editingMaterialId = material.id;
	}
	
	function limparFormMaquina() {
		formMaquina = { id: '', nome: '', custoHora: '', ativa: true };
		editingMaquinaId = null;
	}
	
	function limparFormMaterial() {
		formMaterial = { id: '', nome: '', precoM2: '', ativo: true };
		editingMaterialId = null;
	}
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:package" class="header-icon" />
		<h1>Gerenciar Recursos</h1>
	</div>
</div>

<!-- Tabs -->
<div class="tabs">
	<button 
		class="tab {activeTab === 'maquinas' ? 'active' : ''}"
		onclick={() => activeTab = 'maquinas'}
	>
		<Icon icon="lucide:settings" />
		Máquinas
	</button>
	<button 
		class="tab {activeTab === 'materiais' ? 'active' : ''}"
		onclick={() => activeTab = 'materiais'}
	>
		<Icon icon="lucide:box" />
		Materiais
	</button>
</div>

<!-- Conteúdo das Tabs -->
<div class="tab-content">
	{#if activeTab === 'maquinas'}
		<div class="content-grid">
			<!-- Formulário Máquinas -->
			<div class="form-section">
				<h2>{editingMaquinaId ? 'Editar' : 'Adicionar'} Máquina</h2>
				<form 
					method="POST" 
					action="?/{editingMaquinaId ? 'editarMaquina' : 'criarMaquina'}"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								limparFormMaquina();
							}
							await update();
						};
					}}
				>
					{#if editingMaquinaId}
						<input type="hidden" name="id" value={formMaquina.id} />
					{/if}
					
					<div class="field">
						<label for="nome-maquina">Nome da Máquina</label>
						<input 
							type="text" 
							id="nome-maquina"
							name="nome"
							bind:value={formMaquina.nome}
							placeholder="Ex: Laser CO2 100W"
							required
						/>
					</div>
					
					<div class="field">
						<label for="custo-hora">Custo por Hora (R$)</label>
						<input 
							type="number" 
							id="custo-hora"
							name="custoHora"
							bind:value={formMaquina.custoHora}
							placeholder="Ex: 45.00"
							step="0.01"
							required
						/>
					</div>
					
					<label class="checkbox-option">
						<input 
							type="checkbox" 
							name="ativa"
							bind:checked={formMaquina.ativa}
						/>
						<span>Máquina Ativa</span>
					</label>
					
					<div class="form-actions">
						{#if editingMaquinaId}
							<button type="button" class="btn-secondary" onclick={limparFormMaquina}>
								Cancelar
							</button>
						{/if}
						<button type="submit" class="btn-primary">
							<Icon icon={editingMaquinaId ? 'lucide:save' : 'lucide:plus'} />
							{editingMaquinaId ? 'Salvar' : 'Adicionar'}
						</button>
					</div>
				</form>
			</div>
			
			<!-- Lista Máquinas -->
			<div class="list-section">
				<h2>Máquinas Cadastradas</h2>
				<div class="items-list">
					{#each data.maquinas as maquina}
						<div class="item-card">
							<div class="item-header">
								<h3>{maquina.nome}</h3>
								<StatusBadge variant={getAtivoVariant(maquina.ativa)} label={getAtivoLabel(maquina.ativa, { active: "Ativa", inactive: "Inativa" })} />
							</div>
							<p class="item-price">R$ {maquina.custoHora.toFixed(2)}/hora</p>
							<div class="item-actions">
								<button class="btn-icon" onclick={() => editarMaquina(maquina)}>
									<Icon icon="lucide:pencil" />
								</button>
								<form 
									method="POST" 
									action="?/excluirMaquina"
									use:enhance={() => {
										return async ({ update }) => {
											if (confirm('Deseja realmente excluir esta máquina?')) {
												await update();
											}
										};
									}}
									style="display: inline;"
								>
									<input type="hidden" name="id" value={maquina.id} />
									<button type="submit" class="btn-icon danger">
										<Icon icon="lucide:trash-2" />
									</button>
								</form>
							</div>
						</div>
					{/each}
					
					{#if data.maquinas.length === 0}
						<EmptyState message="Nenhuma máquina cadastrada" />
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="content-grid">
			<!-- Formulário Materiais -->
			<div class="form-section">
				<h2>{editingMaterialId ? 'Editar' : 'Adicionar'} Material</h2>
				<form 
					method="POST" 
					action="?/{editingMaterialId ? 'editarMaterial' : 'criarMaterial'}"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								limparFormMaterial();
							}
							await update();
						};
					}}
				>
					{#if editingMaterialId}
						<input type="hidden" name="id" value={formMaterial.id} />
					{/if}
					
					<div class="field">
						<label for="nome-material">Nome do Material</label>
						<input 
							type="text" 
							id="nome-material"
							name="nome"
							bind:value={formMaterial.nome}
							placeholder="Ex: MDF 3mm"
							required
						/>
					</div>
					
					<div class="field">
						<label for="preco-m2">Preço por m² (R$)</label>
						<input 
							type="number" 
							id="preco-m2"
							name="precoM2"
							bind:value={formMaterial.precoM2}
							placeholder="Ex: 50.00"
							step="0.01"
							required
						/>
					</div>
					
					<label class="checkbox-option">
						<input 
							type="checkbox" 
							name="ativo"
							bind:checked={formMaterial.ativo}
						/>
						<span>Material Ativo</span>
					</label>
					
					<div class="form-actions">
						{#if editingMaterialId}
							<button type="button" class="btn-secondary" onclick={limparFormMaterial}>
								Cancelar
							</button>
						{/if}
						<button type="submit" class="btn-primary">
							<Icon icon={editingMaterialId ? 'lucide:save' : 'lucide:plus'} />
							{editingMaterialId ? 'Salvar' : 'Adicionar'}
						</button>
					</div>
				</form>
			</div>
			
			<!-- Lista Materiais -->
			<div class="list-section">
				<h2>Materiais Cadastrados</h2>
				<div class="items-list">
					{#each data.materiais as material}
						<div class="item-card">
							<div class="item-header">
								<h3>{material.nome}</h3>
								<StatusBadge variant={getAtivoVariant(material.ativo)} label={getAtivoLabel(material.ativo)} />
							</div>
							<p class="item-price">R$ {(material.precoMm2 * 1000000).toFixed(2)}/m²</p>
							<div class="item-actions">
								<button class="btn-icon" onclick={() => editarMaterial(material)}>
									<Icon icon="lucide:pencil" />
								</button>
								<form 
									method="POST" 
									action="?/excluirMaterial"
									use:enhance={() => {
										return async ({ update }) => {
											if (confirm('Deseja realmente excluir este material?')) {
												await update();
											}
										};
									}}
									style="display: inline;"
								>
									<input type="hidden" name="id" value={material.id} />
									<button type="submit" class="btn-icon danger">
										<Icon icon="lucide:trash-2" />
									</button>
								</form>
							</div>
						</div>
					{/each}
					
					{#if data.materiais.length === 0}
						<EmptyState message="Nenhum material cadastrado" />
					{/if}
				</div>
			</div>
		</div>
	{/if}
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

/* Tabs */
.tabs {
	display: flex;
	gap: 6px;
	margin-bottom: 20px;
	border-bottom: 2px solid rgba(255, 191, 145, 0.1);
}

.tab {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 20px;
	background: transparent;
	border: none;
	color: #9ca3af;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;
	border-bottom: 2px solid transparent;
	margin-bottom: -2px;
}

.tab:hover {
	color: #e5e7eb;
	background: rgba(255, 191, 145, 0.05);
}

.tab.active {
	color: #ffbf91;
	border-bottom-color: #ffbf91;
}

.tab :global(svg) {
	width: 16px;
	height: 16px;
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
	margin-bottom: 16px;
}

label {
	display: block;
	margin-bottom: 6px;
	font-size: 0.85rem;
	font-weight: 500;
	color: #d1d5db;
}

input[type="text"],
input[type="number"] {
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

input:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
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

/* Items List */
.items-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.item-card {
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 7px;
	padding: 14px;
	transition: all 0.2s ease;
}

.item-card:hover {
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.7);
}

.item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}

.item-card h3 {
	font-size: 0.95rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.badge {
	padding: 3px 10px;
	border-radius: 10px;
	font-size: 0.7rem;
	font-weight: 600;
}

.badge.success {
	background: rgba(34, 197, 94, 0.2);
	color: #4ade80;
}

.badge.inactive {
	background: rgba(107, 114, 128, 0.2);
	color: #9ca3af;
}

.item-price {
	color: #4ade80;
	font-weight: 600;
	font-size: 1rem;
	margin: 6px 0;
}

.item-actions {
	display: flex;
	gap: 6px;
	margin-top: 10px;
}

.btn-icon {
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
	padding: 32px 16px;
	color: #6b7280;
}

.empty-state :global(svg) {
	width: 40px;
	height: 40px;
	margin-bottom: 10px;
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
}
</style>