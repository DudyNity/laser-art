<script lang="ts">
	import Icon from '@iconify/svelte';

	type Props = {
		icon?: string;
		message: string;
		actionHref?: string;
		actionLabel?: string;
	};

	let { icon = 'lucide:inbox', message, actionHref, actionLabel }: Props = $props();
</script>

<div class="empty-state">
	<Icon {icon} />
	<p>{message}</p>
	{#if actionHref && actionLabel}
		<a href={actionHref} class="btn-primary">
			<Icon icon="lucide:plus" />
			{actionLabel}
		</a>
	{/if}
</div>

<style>
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 48px 24px;
	color: #9ca3af;
	text-align: center;
}

.empty-state :global(svg) {
	width: 64px;
	height: 64px;
	opacity: 0.5;
}

.empty-state p {
	font-size: 1rem;
	margin: 0;
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
	opacity: 1;
}
</style>
