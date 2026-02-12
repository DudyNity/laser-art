<script lang="ts">
	type Props = {
		variant: 'success' | 'warning' | 'error' | 'info' | 'inactive';
		label: string;
	};

	let { variant, label }: Props = $props();
</script>

<span class="badge {variant}">{label}</span>

<style>
.badge {
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 0.8rem;
	font-weight: 600;
	display: inline-block;
	white-space: nowrap;
}

.badge.success {
	background: rgba(34, 197, 94, 0.2);
	color: #4ade80;
}

.badge.warning {
	background: rgba(251, 191, 36, 0.2);
	color: #fbbf24;
}

.badge.error {
	background: rgba(239, 68, 68, 0.2);
	color: #ef4444;
}

.badge.info {
	background: rgba(59, 130, 246, 0.2);
	color: #60a5fa;
}

.badge.inactive {
	background: rgba(107, 114, 128, 0.2);
	color: #9ca3af;
}
</style>
