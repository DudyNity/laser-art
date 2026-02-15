<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';

	type ConfigEmpresa = {
		id: string;
		nome: string;
		tagline: string;
		telefone: string;
		email: string;
		cnpj: string;
	};

	type PageData = {
		user: { id: string; username: string };
		config: ConfigEmpresa;
	};

	let { data }: { data: PageData } = $props();

	let formData = $state({
		nome: data.config.nome,
		tagline: data.config.tagline,
		telefone: data.config.telefone,
		email: data.config.email,
		cnpj: data.config.cnpj
	});

	let salvo = $state(false);
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:settings" class="header-icon" />
		<h1>Configurações</h1>
	</div>
</div>

<div class="config-container">
	<div class="form-section">
		<h2>Dados da Empresa</h2>
		<p class="section-desc">Estas informações aparecerão no cabeçalho dos PDFs de orçamento.</p>

		<form
			method="POST"
			action="?/salvar"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						salvo = true;
						setTimeout(() => salvo = false, 3000);
					}
					await update();
				};
			}}
		>
			<div class="field">
				<label for="nome">Nome da Empresa *</label>
				<input
					type="text"
					id="nome"
					name="nome"
					bind:value={formData.nome}
					placeholder="Ex: LaserArt"
					required
				/>
			</div>

			<div class="field">
				<label for="tagline">Tagline / Descrição</label>
				<input
					type="text"
					id="tagline"
					name="tagline"
					bind:value={formData.tagline}
					placeholder="Ex: CORTE A LASER"
				/>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="telefone">Telefone</label>
					<input
						type="text"
						id="telefone"
						name="telefone"
						bind:value={formData.telefone}
						placeholder="(00) 00000-0000"
					/>
				</div>

				<div class="field">
					<label for="cnpj">CNPJ</label>
					<input
						type="text"
						id="cnpj"
						name="cnpj"
						bind:value={formData.cnpj}
						placeholder="00.000.000/0000-00"
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
					placeholder="contato@empresa.com"
				/>
			</div>

			<div class="preview-section">
				<h3>Pré-visualização no PDF</h3>
				<div class="pdf-preview">
					<div class="preview-header">
						<span class="preview-title">ORÇAMENTO</span>
						<div class="preview-company">
							<span class="preview-tagline">
								{formData.tagline ? formData.tagline + ' • ' : ''}{formData.nome || 'Nome da Empresa'}
							</span>
							<span class="preview-contact">
								{[formData.telefone, formData.email, formData.cnpj ? 'CNPJ: ' + formData.cnpj : ''].filter(Boolean).join('  |  ') || 'telefone  |  email  |  CNPJ'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div class="form-actions">
				<button type="submit" class="btn-primary">
					<Icon icon="lucide:save" />
					Salvar Configurações
				</button>
			</div>

			{#if salvo}
				<div class="success-msg">
					<Icon icon="lucide:check-circle" />
					Configurações salvas com sucesso!
				</div>
			{/if}
		</form>
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

.config-container {
	max-width: 600px;
}

.form-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	padding: 24px;
}

h2 {
	font-size: 1.1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0 0 4px 0;
}

.section-desc {
	font-size: 0.85rem;
	color: #9ca3af;
	margin: 0 0 20px 0;
}

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

input {
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

/* Preview */
.preview-section {
	margin-top: 20px;
	margin-bottom: 16px;
}

.preview-section h3 {
	font-size: 0.85rem;
	font-weight: 500;
	color: #9ca3af;
	margin: 0 0 10px 0;
}

.pdf-preview {
	background: #fff;
	border-radius: 8px;
	overflow: hidden;
}

.preview-header {
	background: rgb(15, 23, 42);
	padding: 12px 16px;
	border-bottom: 3px solid rgb(255, 107, 0);
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.preview-title {
	font-size: 1.1rem;
	font-weight: 700;
	color: #fff;
}

.preview-company {
	text-align: right;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.preview-tagline {
	font-size: 0.75rem;
	color: rgb(255, 160, 100);
	font-weight: 500;
}

.preview-contact {
	font-size: 0.65rem;
	color: rgb(160, 180, 220);
}

/* Actions */
.form-actions {
	margin-top: 20px;
}

.btn-primary {
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
	width: 100%;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
}

.btn-primary:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.4);
}

.success-msg {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 12px;
	padding: 10px 14px;
	background: rgba(74, 222, 128, 0.1);
	border: 1px solid rgba(74, 222, 128, 0.3);
	border-radius: 7px;
	color: #4ade80;
	font-size: 0.85rem;
	font-weight: 500;
}

.success-msg :global(svg) {
	width: 18px;
	height: 18px;
	flex-shrink: 0;
}

@media (max-width: 768px) {
	.field-row {
		grid-template-columns: 1fr;
	}
}
</style>
