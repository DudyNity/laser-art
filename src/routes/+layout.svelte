<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar/Sidebar.svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	let { children, data } = $props();

	let isLoginPage = $derived($page.url.pathname === '/login');
	let isMobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="layout">
		<Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={closeMobileMenu} user={data.user} />

		<main>
			<button class="mobile-menu-btn" onclick={toggleMobileMenu}>
				<Icon icon={isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'} />
			</button>
			{@render children()}
		</main>
	</div>
{/if}

<style>
:global(html),
:global(body) {
	margin: 0;
	padding: 0;
	width: 100%;
	min-height: 100vh;
	font-family: 'Inter', system-ui, -apple-system, sans-serif;
	background: #2a2a2a;
}

.layout {
	display: flex;
	width: 100%;
	min-height: 100vh;
}

main {
	flex: 1;
	padding: 24px;
	overflow-y: auto;
	background: #2a2a2a;
	color: #e0e0e0;
	position: relative;
}

.mobile-menu-btn {
	display: none;
	position: fixed;
	top: 16px;
	left: 16px;
	z-index: 998;
	width: 48px;
	height: 48px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	border: none;
	border-radius: 12px;
	color: #1a1a1a;
	cursor: pointer;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.3);
	transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
	transform: scale(1.05);
	box-shadow: 0 6px 16px rgba(255, 154, 82, 0.4);
}

.mobile-menu-btn :global(svg) {
	width: 24px;
	height: 24px;
}

@media (max-width: 768px) {
	main {
		padding: 80px 16px 16px 16px;
	}

	.mobile-menu-btn {
		display: flex;
	}
}
</style>