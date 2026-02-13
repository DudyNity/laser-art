<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';

	type Usuario = { id: string; username: string; role: string; clienteId: string | null; createdAt: string };
	type Cliente = { id: string; nome: string };
	type PageData = { user: { id: string; username: string }; usuarios: Usuario[]; clientes: Cliente[] };

	let { data, form }: { data: PageData; form: any } = $props();

	let mostrarFormulario = $state(false);
	let username = $state('');
	let password = $state('');
	let role = $state('admin');
	let clienteId = $state('');
	let carregando = $state(false);

	function resetForm() {
		username = '';
		password = '';
		role = 'admin';
		clienteId = '';
		mostrarFormulario = false;
	}
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:user-cog" class="header-icon" />
		<h1>Usuários</h1>
	</div>
	<button class="btn-primary" onclick={() => (mostrarFormulario = !mostrarFormulario)}>
		<Icon icon="lucide:user-plus" />
		Novo Usuário
	</button>
</div>

{#if mostrarFormulario}
	<div class="form-card">
		<h2>Criar Usuário</h2>
		{#if form?.error}
			<p class="error-msg">{form.error}</p>
		{/if}
		<form
			method="POST"
			action="?/criarUsuario"
			use:enhance={() => {
				carregando = true;
				return ({ result, update }) => {
					carregando = false;
					if (result.type === 'success') resetForm();
					update();
				};
			}}
		>
			<div class="form-row">
				<div class="field">
					<label for="username">Usuário *</label>
					<input id="username" name="username" type="text" bind:value={username} placeholder="nome de usuário" required />
				</div>
				<div class="field">
					<label for="password">Senha *</label>
					<input id="password" name="password" type="password" bind:value={password} placeholder="mínimo 4 caracteres" required />
				</div>
				<div class="field">
					<label for="role">Perfil *</label>
					<select id="role" name="role" bind:value={role}>
						<option value="admin">Administrador</option>
						<option value="cliente">Cliente</option>
					</select>
				</div>
				{#if role === 'cliente'}
				<div class="field">
					<label for="clienteId">Vincular ao cliente</label>
					<select id="clienteId" name="clienteId" bind:value={clienteId}>
						<option value="">— Nenhum —</option>
						{#each data.clientes as c}
							<option value={c.id}>{c.nome}</option>
						{/each}
					</select>
				</div>
				{/if}
			</div>
			<div class="form-actions">
				<button type="submit" class="btn-primary" disabled={carregando}>
					<Icon icon="lucide:save" />
					{carregando ? 'Salvando...' : 'Criar Usuário'}
				</button>
				<button type="button" class="btn-secondary" onclick={resetForm}>
					Cancelar
				</button>
			</div>
		</form>
	</div>
{/if}

<div class="table-card">
	{#if data.usuarios.length === 0}
		<div class="empty">
			<Icon icon="lucide:users" />
			<p>Nenhum usuário cadastrado</p>
		</div>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Usuário</th>
					<th>Perfil</th>
					<th>Cliente vinculado</th>
					<th>Criado em</th>
					<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each data.usuarios as usuario}
					<tr>
						<td>
							<div class="user-cell">
								<div class="user-avatar">
									<Icon icon="lucide:user" />
								</div>
								<span>{usuario.username}</span>
								{#if usuario.id === data.user.id}
									<span class="badge-you">Você</span>
								{/if}
							</div>
						</td>
						<td>
							<form method="POST" action="?/atualizarRole" use:enhance>
								<input type="hidden" name="id" value={usuario.id} />
								<input type="hidden" name="clienteId" value={usuario.clienteId ?? ''} />
								<select
									name="role"
									class="role-select {usuario.role}"
									onchange={(e) => (e.target as HTMLFormElement).form?.requestSubmit()}
								>
									<option value="admin" selected={usuario.role === 'admin'}>Administrador</option>
									<option value="cliente" selected={usuario.role === 'cliente'}>Cliente</option>
								</select>
							</form>
						</td>
						<td>
							{#if usuario.role === 'cliente'}
							<form method="POST" action="?/atualizarRole" use:enhance>
								<input type="hidden" name="id" value={usuario.id} />
								<input type="hidden" name="role" value={usuario.role} />
								<select
									name="clienteId"
									class="role-select cliente"
									onchange={(e) => (e.target as HTMLFormElement).form?.requestSubmit()}
								>
									<option value="" selected={!usuario.clienteId}>— Nenhum —</option>
									{#each data.clientes as c}
										<option value={c.id} selected={usuario.clienteId === c.id}>{c.nome}</option>
									{/each}
								</select>
							</form>
							{:else}
								<span class="no-action">—</span>
							{/if}
						</td>
						<td class="date-cell">
							{new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
						</td>
						<td>
							{#if usuario.id !== data.user.id}
								<form method="POST" action="?/excluirUsuario" use:enhance>
									<input type="hidden" name="id" value={usuario.id} />
									<button
										type="submit"
										class="btn-danger"
										onclick={(e) => { if (!confirm(`Excluir "${usuario.username}"?`)) e.preventDefault(); }}
										title="Excluir usuário"
									>
										<Icon icon="lucide:trash-2" />
									</button>
								</form>
							{:else}
								<span class="no-action">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

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
	font-weight: 700;
	color: #f9fafb;
	margin: 0;
}

h2 {
	font-size: 1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0 0 16px 0;
}

.btn-primary {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 18px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	border: none;
	border-radius: 8px;
	color: #1a1a1a;
	font-weight: 600;
	font-size: 0.9rem;
	cursor: pointer;
	transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary :global(svg),
.btn-secondary :global(svg) {
	width: 16px;
	height: 16px;
}

.btn-secondary {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 18px;
	background: rgba(255, 255, 255, 0.07);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 8px;
	color: #d1d5db;
	font-size: 0.9rem;
	cursor: pointer;
	transition: background 0.2s;
}

.btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }

.form-card {
	background: #1f2937;
	border: 1px solid rgba(255, 191, 145, 0.15);
	border-radius: 12px;
	padding: 20px;
	margin-bottom: 24px;
}

.form-row {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 6px;
	flex: 1;
	min-width: 160px;
}

label {
	font-size: 0.85rem;
	color: #9ca3af;
	font-weight: 500;
}

input, select {
	padding: 10px 12px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	color: #e0e0e0;
	font-size: 0.9rem;
}

input:focus, select:focus {
	outline: none;
	border-color: #ffbf91;
}

.form-actions {
	display: flex;
	gap: 10px;
	margin-top: 16px;
}

.error-msg {
	background: rgba(239, 68, 68, 0.1);
	border: 1px solid rgba(239, 68, 68, 0.3);
	border-radius: 8px;
	color: #f87171;
	padding: 10px 14px;
	font-size: 0.9rem;
	margin-bottom: 14px;
}

.table-card {
	background: #1f2937;
	border: 1px solid rgba(255, 191, 145, 0.15);
	border-radius: 12px;
	overflow: hidden;
}

table {
	width: 100%;
	border-collapse: collapse;
}

thead tr {
	background: rgba(255, 191, 145, 0.05);
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

th {
	padding: 14px 16px;
	text-align: left;
	font-size: 0.8rem;
	font-weight: 600;
	color: #9ca3af;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

td {
	padding: 14px 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	color: #e0e0e0;
	font-size: 0.9rem;
}

tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: rgba(255, 255, 255, 0.02); }

.user-cell {
	display: flex;
	align-items: center;
	gap: 10px;
}

.user-avatar {
	width: 34px;
	height: 34px;
	background: rgba(255, 191, 145, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffbf91;
	flex-shrink: 0;
}

.user-avatar :global(svg) {
	width: 16px;
	height: 16px;
}

.badge-you {
	font-size: 0.7rem;
	background: rgba(255, 191, 145, 0.15);
	color: #ffbf91;
	border: 1px solid rgba(255, 191, 145, 0.3);
	border-radius: 4px;
	padding: 2px 6px;
}

.role-select {
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 0.85rem;
	cursor: pointer;
	border: 1px solid rgba(255, 255, 255, 0.1);
}

.role-select.admin {
	background: rgba(255, 191, 145, 0.1);
	color: #ffbf91;
}

.role-select.cliente {
	background: rgba(96, 165, 250, 0.1);
	color: #60a5fa;
}

.date-cell { color: #6b7280; }

.btn-danger {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	background: rgba(239, 68, 68, 0.1);
	border: 1px solid rgba(239, 68, 68, 0.3);
	border-radius: 6px;
	color: #f87171;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-danger:hover {
	background: rgba(239, 68, 68, 0.2);
	border-color: #ef4444;
}

.btn-danger :global(svg) {
	width: 15px;
	height: 15px;
}

.no-action { color: #4b5563; }

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 48px;
	color: #6b7280;
}

.empty :global(svg) {
	width: 40px;
	height: 40px;
}
</style>
