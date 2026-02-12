export function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString('pt-BR');
}

export function formatCurrency(value: number): string {
	return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Orçamentos ---
export function getOrcamentoStatusVariant(status: string): 'success' | 'warning' | 'error' {
	switch (status) {
		case 'Aprovado': return 'success';
		case 'Recusado': return 'error';
		default:         return 'warning';
	}
}

export function getOrcamentoStatusLabel(status: string): string {
	return status || 'Pendente';
}

// --- Pedidos ---
export function getPedidoStatusVariant(status: string): 'warning' | 'info' | 'success' {
	switch (status) {
		case 'EmProducao': return 'info';
		case 'Concluido':  return 'success';
		default:           return 'warning';
	}
}

export function getPedidoStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		Pendente:    'Pendente',
		EmProducao:  'Em Produção',
		Concluido:   'Concluído'
	};
	return labels[status] ?? status;
}

// --- Genérico (ativo/inativo) ---
export function getAtivoVariant(ativo: boolean): 'success' | 'inactive' {
	return ativo ? 'success' : 'inactive';
}

export function getAtivoLabel(ativo: boolean, labels = { active: 'Ativo', inactive: 'Inativo' }): string {
	return ativo ? labels.active : labels.inactive;
}
