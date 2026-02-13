<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';

	type Props = {
		isMobileOpen?: boolean;
		onMobileClose?: () => void;
		user?: { id: string; username: string; role: string } | null;
	};

	let { isMobileOpen = false, onMobileClose, user = null }: Props = $props();

	let currentPath = $derived($page.url.pathname);
	let isExpanded = $state(false);

	function isActive(path: string) {
		// Para a home, verifica se é exatamente '/'
		if (path === '/') {
			return currentPath === '/';
		}
		// Para outros caminhos, verifica se começa com o path
		return currentPath === path || currentPath.startsWith(path + '/');
	}

	function handleMouseEnter() {
		isExpanded = true;
	}

	function handleMouseLeave() {
		isExpanded = false;
	}

	function handleLinkClick() {
		// Fecha a sidebar em mobile quando clica em um link
		if (onMobileClose) {
			onMobileClose();
		}
	}
</script>

{#if isMobileOpen}
	<div class="overlay" onclick={onMobileClose}></div>
{/if}

<nav class="sidebar {isExpanded ? 'expanded' : ''} {isMobileOpen ? 'mobile-open' : ''}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}>
	<div class="logo-section">
		<img src="/Logo.png" alt="Laser Art" class="logo" />
	</div>

	<div class="menu-section">

		{#if user?.role !== 'cliente'}
		<a href="/" class="menu-item {isActive('/') ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:layout-dashboard" />
			<span>Dashboard</span>
		</a>

		<a href="/orcamentos/criar" class="menu-item {currentPath === '/orcamentos/criar' ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:calculator" />
			<span>Criar Orçamento</span>
		</a>

		<a href="/orcamentos/salvos" class="menu-item {currentPath === '/orcamentos/salvos' ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:save" />
			<span>Orçamentos Salvos</span>
		</a>
		{/if}

		<a href="/pedidos" class="menu-item {isActive('/pedidos') ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:package" />
			<span>Pedidos</span>
		</a>

		{#if user?.role === 'cliente'}
		<a href="/orcamentos/salvos" class="menu-item {currentPath === '/orcamentos/salvos' ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:save" />
			<span>Orçamentos</span>
		</a>
		{/if}

		{#if user?.role !== 'cliente'}
		<a href="/clientes" class="menu-item {isActive('/clientes') ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:users" />
			<span>Clientes</span>
		</a>

		<a href="/recursos" class="menu-item {isActive('/recursos') ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:box" />
			<span>Recursos</span>
		</a>

		<a href="/usuarios" class="menu-item {isActive('/usuarios') ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:user-cog" />
			<span>Usuários</span>
		</a>

		<a href="/configuracoes" class="menu-item {isActive('/configuracoes') ? 'active' : ''}" onclick={handleLinkClick}>
			<Icon icon="lucide:settings" />
			<span>Configurações</span>
		</a>
		{/if}
	</div>

	<div class="user-section">
		<a href="/logout" class="user-avatar logout-btn" title="Sair">
			<Icon icon="lucide:log-out" />
		</a>
		<div class="user-extra">
			<div class="user-details">
				<p class="user-name">{user?.username ?? 'Usuário'}</p>
				<p class="user-role">{user?.role === 'cliente' ? 'Cliente' : 'Administrador'}</p>
			</div>
		</div>
	</div>
</nav>

<style>
.sidebar {
	width: 70px;
	background: linear-gradient(135deg, #1f2937, #374151);
	color: white;
	padding: 0;
	display: flex;
	flex-direction: column;
	height: 100vh;
	position: sticky;
	top: 0;
	transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
}

.sidebar.expanded {
	width: 260px;
}

/* Logo Section */
.logo-section {
	padding: 16px 8px;
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 80px;
}

.sidebar.expanded .logo-section,
.sidebar.mobile-open .logo-section {
	padding: 16px 20px;
}

.logo {
	height: 48px;
	width: auto;
	max-width: 54px;
	display: block;
	filter: drop-shadow(0 4px 16px rgba(255, 154, 82, 0.5));
	transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.expanded .logo,
.sidebar.mobile-open .logo {
	height: 60px;
	max-width: 200px;
}

/* Menu Section */
.menu-section {
	flex: 1;
	padding: 20px 12px;
	overflow-y: auto;
	overflow-x: hidden;
}

.menu-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 12px 12px 13px;
	margin-bottom: 4px;
	color: #d1d5db;
	text-decoration: none;
	border-radius: 8px;
	font-weight: 500;
	font-size: 0.9rem;
	white-space: nowrap;
	position: relative;
}

.menu-item :global(svg) {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
}

.menu-item span {
	opacity: 0;
	max-width: 0;
	overflow: hidden;
	transition: opacity 0.15s ease, max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.15s;
	white-space: nowrap;
}

.sidebar.expanded .menu-item span,
.sidebar.mobile-open .menu-item span {
	opacity: 1;
	max-width: 200px;
	transition: opacity 0.25s ease 0.15s, max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item:hover {
	background: #4b5563;
	color: #ffbf91;
}

.menu-item.active {
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	box-shadow: 0 2px 8px rgba(255, 154, 82, 0.3);
}

/* User Section */
.user-section {
	padding: 16px 12px 16px 15px;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
	display: flex;
	align-items: center;
	gap: 12px;
}

.sidebar.expanded .user-section,
.sidebar.mobile-open .user-section {
	padding: 16px;
}

.user-extra {
	display: flex;
	align-items: center;
	gap: 12px;
	max-width: 0;
	overflow: hidden;
	opacity: 0;
	transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, opacity 0.15s ease;
}

.sidebar.expanded .user-extra,
.sidebar.mobile-open .user-extra {
	max-width: 200px;
	opacity: 1;
	transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease 0.15s;
}

.user-avatar {
	width: 40px;
	height: 40px;
	background: rgba(255, 191, 145, 0.15);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffbf91;
	flex-shrink: 0;
}

.user-avatar :global(svg) {
	width: 20px;
	height: 20px;
}

.user-details {
	flex: 1;
	min-width: 0;
}

.user-name {
	font-size: 0.85rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0 0 2px 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.user-role {
	font-size: 0.7rem;
	color: #9ca3af;
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.logout-btn {
	text-decoration: none;
	cursor: pointer;
	border: 1px solid rgba(255, 191, 145, 0.2);
	transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.logout-btn:hover {
	background: rgba(239, 68, 68, 0.25) !important;
	border-color: #ef4444 !important;
	color: #ef4444 !important;
}

/* Scrollbar customizado */
.menu-section::-webkit-scrollbar {
	width: 6px;
}

.menu-section::-webkit-scrollbar-track {
	background: rgba(0, 0, 0, 0.1);
	border-radius: 3px;
}

.menu-section::-webkit-scrollbar-thumb {
	background: rgba(255, 191, 145, 0.3);
	border-radius: 3px;
}

.menu-section::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 191, 145, 0.5);
}

/* Overlay para mobile */
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	z-index: 999;
	backdrop-filter: blur(2px);
}

/* Responsividade Mobile */
@media (max-width: 768px) {
	.sidebar {
		position: fixed;
		left: -260px;
		width: 260px !important;
		z-index: 1000;
		transition: left 0.3s ease;
	}

	.sidebar.mobile-open {
		left: 0;
	}
}
</style>
