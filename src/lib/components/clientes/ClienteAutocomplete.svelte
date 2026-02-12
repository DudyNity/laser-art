<script lang="ts">
	import Icon from '@iconify/svelte';
	
	type Cliente = {
		id: string;
		nome: string;
		telefone: string;
		email: string;
	};
	
	type Props = {
		clientes: Cliente[];
		value: string;
		onchange: (id: string) => void;
	};
	
	let { clientes, value = $bindable(), onchange }: Props = $props();
	
	let searchTerm = $state('');
	let showDropdown = $state(false);
	let selectedClienteNome = $state('');
	
	// Filtrar clientes baseado na busca
	let filteredClientes = $derived(() => {
		if (!searchTerm) return clientes;
		const term = searchTerm.toLowerCase();
		return clientes.filter(c => 
			c.nome.toLowerCase().includes(term) ||
			c.telefone.includes(term) ||
			c.email.toLowerCase().includes(term)
		);
	});
	
	// Quando o componente carrega, busca o nome do cliente selecionado
	$effect(() => {
		if (value) {
			const cliente = clientes.find(c => c.id === value);
			if (cliente) {
				selectedClienteNome = cliente.nome;
				searchTerm = cliente.nome;
			}
		}
	});
	
	function selecionarCliente(cliente: Cliente) {
		value = cliente.id;
		searchTerm = cliente.nome;
		selectedClienteNome = cliente.nome;
		showDropdown = false;
		onchange(cliente.id);
	}
	
	function limparSelecao() {
		value = '';
		searchTerm = '';
		selectedClienteNome = '';
		showDropdown = false;
		onchange('');
	}
	
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchTerm = target.value;
		showDropdown = true;
		
		// Se limpar o input, limpa a seleção
		if (!searchTerm) {
			value = '';
			selectedClienteNome = '';
		}
	}
	
	function handleFocus() {
		showDropdown = true;
	}
	
	function handleBlur() {
		// Delay para permitir clique no dropdown
		setTimeout(() => {
			showDropdown = false;
			// Se não selecionou nada, volta pro nome anterior
			if (!value && selectedClienteNome) {
				searchTerm = selectedClienteNome;
			}
		}, 200);
	}
</script>

<div class="autocomplete-container">
	<div class="input-wrapper">
		<Icon icon="lucide:search" />
		<input 
			type="text"
			bind:value={searchTerm}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			placeholder="Digite para buscar cliente..."
			autocomplete="off"
		/>
		{#if value}
			<button 
				type="button" 
				class="btn-clear"
				onclick={limparSelecao}
			>
				<Icon icon="lucide:x" />
			</button>
		{/if}
	</div>
	
	{#if showDropdown && filteredClientes().length > 0}
		<div class="dropdown">
			{#each filteredClientes() as cliente}
				<button
					type="button"
					class="dropdown-item {value === cliente.id ? 'selected' : ''}"
					onclick={() => selecionarCliente(cliente)}
				>
					<div class="cliente-avatar">
						{cliente.nome.charAt(0).toUpperCase()}
					</div>
					<div class="cliente-info">
						<div class="cliente-nome">{cliente.nome}</div>
						<div class="cliente-detalhes">
							{cliente.telefone} • {cliente.email}
						</div>
					</div>
					{#if value === cliente.id}
						<Icon icon="lucide:check" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
	
	{#if showDropdown && searchTerm && filteredClientes().length === 0}
		<div class="dropdown">
			<div class="dropdown-empty">
				<Icon icon="lucide:user-x" />
				<span>Nenhum cliente encontrado</span>
			</div>
		</div>
	{/if}
	
	<!-- Hidden input para o formulário -->
	<input type="hidden" name="clienteId" value={value} />
</div>

<style>
.autocomplete-container {
	position: relative;
	width: 100%;
}

.input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	background: rgba(30, 30, 30, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 7px;
	transition: all 0.2s ease;
}

.input-wrapper:focus-within {
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
}

.input-wrapper :global(svg:first-child) {
	width: 16px;
	height: 16px;
	color: #9ca3af;
	flex-shrink: 0;
}

.input-wrapper input {
	flex: 1;
	background: transparent;
	border: none;
	color: #f9fafb;
	font-size: 0.9rem;
	padding: 0;
	outline: none;
}

.input-wrapper input::placeholder {
	color: #6b7280;
	font-size: 0.85rem;
}

.btn-clear {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 2px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	transition: all 0.2s ease;
}

.btn-clear:hover {
	background: rgba(239, 68, 68, 0.2);
	color: #ef4444;
}

.btn-clear :global(svg) {
	width: 16px;
	height: 16px;
}

.dropdown {
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	right: 0;
	background: rgba(40, 40, 40, 0.98);
	border: 1px solid rgba(255, 191, 145, 0.3);
	border-radius: 8px;
	max-height: 280px;
	overflow-y: auto;
	z-index: 1000;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(10px);
}

.dropdown-item {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: transparent;
	border: none;
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;
}

.dropdown-item:last-child {
	border-bottom: none;
}

.dropdown-item:hover {
	background: rgba(255, 191, 145, 0.1);
}

.dropdown-item.selected {
	background: rgba(255, 191, 145, 0.15);
}

.dropdown-item .cliente-avatar {
	width: 36px;
	height: 36px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #1a1a1a;
	font-weight: 700;
	font-size: 0.95rem;
	flex-shrink: 0;
}

.dropdown-item .cliente-info {
	flex: 1;
	min-width: 0;
}

.cliente-nome {
	font-size: 0.9rem;
	font-weight: 600;
	color: #f9fafb;
	margin-bottom: 2px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cliente-detalhes {
	font-size: 0.75rem;
	color: #9ca3af;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.dropdown-item :global(svg:last-child) {
	width: 18px;
	height: 18px;
	color: #4ade80;
	flex-shrink: 0;
}

.dropdown-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 24px;
	color: #6b7280;
}

.dropdown-empty :global(svg) {
	width: 32px;
	height: 32px;
	opacity: 0.5;
}

.dropdown-empty span {
	font-size: 0.85rem;
}

/* Scrollbar customizada */
.dropdown::-webkit-scrollbar {
	width: 6px;
}

.dropdown::-webkit-scrollbar-track {
	background: rgba(30, 30, 30, 0.5);
	border-radius: 10px;
}

.dropdown::-webkit-scrollbar-thumb {
	background: rgba(255, 191, 145, 0.3);
	border-radius: 10px;
}

.dropdown::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 191, 145, 0.5);
}
</style>