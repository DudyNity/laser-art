<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import jsPDF from 'jspdf';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate, formatCurrency, getOrcamentoStatusVariant, getOrcamentoStatusLabel } from '$lib/utils/format';

	type Orcamento = {
	id: string;
	cliente: {
		id: string;
		nome: string;
		telefone: string;
		email: string;
	} | null;
	nomeCliente: string | null;
	valorFinal: number;
	descricao: string | null;
	itensDetalhados: string | null;
	subtotal: number;
	margemLucro: number;
	gastosAdicionais: number;
	status: string;
	createdAt: Date;
	updatedAt: Date;
};

	
	type Cliente = {
		id: string;
		nome: string;
		telefone: string;
		email: string;
	};

	type ConfigEmpresa = {
		nome: string;
		tagline: string;
		telefone: string;
		email: string;
		cnpj: string;
	};

	type PageData = {
		user: { id: string; username: string };
		isCliente: boolean;
		orcamentos: Orcamento[];
		clientes: Cliente[];
		configEmpresa: ConfigEmpresa;
	};
	
	let { data }: { data: PageData } = $props();
	
	let statusFilter = $state('todos');
	let showModalAprovar = $state(false);
	let orcamentoSelecionado = $state<Orcamento | null>(null);
	let dataEntrega = $state('');
	let erroAprovar = $state('');
	
	let filteredOrcamentos = $derived(() => {
		if (statusFilter === 'todos') return data.orcamentos;
		return data.orcamentos.filter(o => o.status === statusFilter);
	});
	async function loadAutoTable() {
	if (typeof (window as any).jspdfAutoTable !== 'undefined') {
		return; // Já carregado
	}
	
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
		script.onload = () => resolve(true);
		script.onerror = () => reject(new Error('Falha ao carregar autoTable'));
		document.head.appendChild(script);
	});
}

	function abrirModalAprovar(orcamento: Orcamento) {
		orcamentoSelecionado = orcamento;
		showModalAprovar = true;
	}
	
	function fecharModal() {
		showModalAprovar = false;
		orcamentoSelecionado = null;
		dataEntrega = '';
		erroAprovar = '';
	}

	function getProdutos(orcamento: Orcamento): string {
		if (!orcamento.itensDetalhados) return orcamento.descricao || '-';
		try {
			const detalhes = JSON.parse(orcamento.itensDetalhados);
			const itens: any[] = detalhes.itens || [];
			const nomes = itens.map((i: any) => i.descricaoProduto).filter(Boolean);
			return nomes.length > 0 ? nomes.join(', ') : (orcamento.descricao || '-');
		} catch {
			return orcamento.descricao || '-';
		}
	}

	let showModalExcluir = $state(false);
	let orcamentoParaExcluir = $state<Orcamento | null>(null);

	function abrirModalExcluir(orcamento: Orcamento) {
		orcamentoParaExcluir = orcamento;
		showModalExcluir = true;
	}

	function fecharModalExcluir() {
		showModalExcluir = false;
		orcamentoParaExcluir = null;
	}

	let showModalVincular = $state(false);
	let orcamentoParaVincular = $state<Orcamento | null>(null);
	let clienteVincularId = $state('');

	function abrirModalVincular(orcamento: Orcamento) {
		orcamentoParaVincular = orcamento;
		clienteVincularId = orcamento.cliente?.id || '';
		showModalVincular = true;
	}

	function fecharModalVincular() {
		showModalVincular = false;
		orcamentoParaVincular = null;
		clienteVincularId = '';
	}
	

	
	// FUNÇÃO PARA GERAR PDF
// ==================== PDF SIMPLES (CLIENTE) ====================
function gerarPDFSimples(orcamento: Orcamento) {
	try {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 15;

		let y = 20;

		// Parsear itens
		let itensParaPDF: any[] = [];
		let gastosParaPDFSimples: any[] = [];
		if (orcamento.itensDetalhados) {
			try {
				const detalhes = JSON.parse(orcamento.itensDetalhados);
				itensParaPDF = detalhes.itens || [];
				gastosParaPDFSimples = detalhes.gastosAdicionais || [];
			} catch (e) {
				console.error('Erro ao parsear itens:', e);
			}
		}
		
		// ==================== CABEÇALHO ====================
		doc.setFillColor(15, 23, 42);
		doc.rect(0, 0, pageWidth, 42, 'F');
		doc.setFillColor(255, 107, 0);
		doc.rect(0, 39, pageWidth, 4, 'F');

		doc.setTextColor(255, 255, 255);
		doc.setFontSize(22);
		doc.setFont('helvetica', 'bold');
		doc.text('ORÇAMENTO', pageWidth - margin, 16, { align: 'right' });
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(255, 160, 100);
		doc.text((data.configEmpresa.tagline ? data.configEmpresa.tagline + ' • ' : '') + data.configEmpresa.nome, pageWidth - margin, 25, { align: 'right' });
		doc.setFontSize(8);
		doc.setTextColor(160, 180, 220);
		doc.text([data.configEmpresa.telefone, data.configEmpresa.email, data.configEmpresa.cnpj ? 'CNPJ: ' + data.configEmpresa.cnpj : ''].filter(Boolean).join('  |  '), pageWidth - margin, 33, { align: 'right' });

		y = 53;

		// ==================== CAIXA DO CLIENTE ====================
		const horaFormatada = new Date(orcamento.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

		doc.setFillColor(255, 247, 237);
		doc.rect(margin, y, pageWidth - (margin * 2), 26, 'F');
		doc.setFillColor(255, 107, 0);
		doc.rect(margin, y, 4, 26, 'F');

		doc.setTextColor(255, 107, 0);
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.text('CLIENTE', margin + 8, y + 7);

		doc.setTextColor(15, 23, 42);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text(orcamento.cliente?.nome || orcamento.nomeCliente || 'Cliente', margin + 8, y + 14);

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		doc.text(`Data: ${formatDate(orcamento.createdAt)}   |   Hora: ${horaFormatada}`, margin + 8, y + 21);

		y += 34;

		// ==================== CABEÇALHO DE ITENS ====================
		doc.setTextColor(255, 107, 0);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		doc.text('ITENS DO ORÇAMENTO', margin + 4, y + 6);
		y += 14;

		// ==================== ITENS ====================
		itensParaPDF.forEach((item: any, index: number) => {
			// Nome do produto com fundo cinza e acento laranja
			doc.setFillColor(245, 247, 250);
			doc.rect(margin, y, pageWidth - (margin * 2), 9, 'F');
			doc.setFillColor(255, 107, 0);
			doc.rect(margin, y, 3, 9, 'F');

			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(15, 23, 42);
			doc.text(String(item.descricaoProduto || 'Item'), margin + 6, y + 6);
			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(150, 150, 150);
			doc.text(`#${index + 1}`, pageWidth - margin - 3, y + 6, { align: 'right' });

			y += 16;

			doc.setFontSize(8.5);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(80, 80, 80);
			const qtd = Number(item.quantidade || 1);
			doc.text(`Qtd: ${qtd} ${qtd === 1 ? 'unidade' : 'unidades'}   |   Material: ${item.materialNome || 'N/A'}`, margin + 3, y);
			y += 7;

			if (item.pintada && item.valorPintura > 0) {
				doc.text(`Pintura: R$ ${Number(item.valorPintura).toFixed(2)}`, margin + 3, y);
				y += 6;
			}

			const gastosPorItem: any[] = item.gastosAdicionais || [];
			gastosPorItem.forEach((g: any) => {
				doc.text(`${String(g.descricao || 'Gasto')}: R$ ${Number(g.valor || 0).toFixed(2)}`, margin + 3, y);
				y += 6;
			});

			const margem = orcamento.margemLucro / 100;
			const valorUnitario = (Number(item.valorTotal || 0) / qtd) * (1 + margem);
			const valorTotalItem = Number(item.valorTotal || 0) * (1 + margem);

			doc.setFillColor(255, 250, 245);
			doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
			doc.setFontSize(8.5);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(80, 80, 80);
			doc.text('Valor unitário', margin + 3, y + 5);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(15, 23, 42);
			doc.text(`R$ ${valorUnitario.toFixed(2)}`, pageWidth - margin - 3, y + 5, { align: 'right' });
			y += 8;

			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 107, 0);
			doc.text('VALOR TOTAL DO ITEM', margin + 3, y + 5.5);
			doc.text(`R$ ${valorTotalItem.toFixed(2)}`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
			y += 14;
		});

		// ==================== TOTAL GERAL ====================
		doc.setTextColor(5, 150, 105);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text('VALOR TOTAL GERAL', margin + 5, y + 10);
		doc.text(`R$ ${orcamento.valorFinal.toFixed(2)}`, pageWidth - margin - 5, y + 10, { align: 'right' });

		y += 22;

		// ==================== RODAPÉ ====================
		doc.setFontSize(8);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(130, 130, 130);
		doc.text('Orçamento válido por 7 dias', pageWidth / 2, y, { align: 'center' });

		// ==================== SALVAR ====================
		doc.save(`orcamento-${(orcamento.cliente?.nome || orcamento.nomeCliente || 'cliente').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
		
		console.log('✅ PDF Simples gerado!');
	} catch (error) {
		console.error('❌ Erro ao gerar PDF:', error);
		alert('Erro ao gerar PDF. Verifique o console.');
	}
}

// ==================== PDF COMPLETO (CONTROLE INTERNO) ====================
function gerarPDFCompleto(orcamento: Orcamento) {
	try {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 15;

		let y = 20;

		// Parsear itens e gastos
		let itensParaPDF: any[] = [];
		let gastosParaPDF: any[] = [];

		if (orcamento.itensDetalhados) {
			try {
				const detalhes = JSON.parse(orcamento.itensDetalhados);
				itensParaPDF = detalhes.itens || [];
				gastosParaPDF = detalhes.gastosAdicionais || [];
			} catch (e) {
				console.error('Erro ao parsear itens:', e);
			}
		}
		
		// ==================== CABEÇALHO ====================
		doc.setFillColor(15, 23, 42);
		doc.rect(0, 0, pageWidth, 42, 'F');
		doc.setFillColor(255, 107, 0);
		doc.rect(0, 39, pageWidth, 4, 'F');

		doc.setTextColor(255, 255, 255);
		doc.setFontSize(20);
		doc.setFont('helvetica', 'bold');
		doc.text('ORÇAMENTO COMPLETO', pageWidth - margin, 16, { align: 'right' });
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(255, 160, 100);
		doc.text((data.configEmpresa.tagline ? data.configEmpresa.tagline + ' • ' : '') + data.configEmpresa.nome, pageWidth - margin, 25, { align: 'right' });
		doc.setFontSize(8);
		doc.setTextColor(160, 180, 220);
		doc.text([data.configEmpresa.telefone, data.configEmpresa.email, data.configEmpresa.cnpj ? 'CNPJ: ' + data.configEmpresa.cnpj : ''].filter(Boolean).join('  |  '), pageWidth - margin, 33, { align: 'right' });

		y = 53;

		// ==================== CAIXA DO CLIENTE ====================
		const horaCompletoFormatada = new Date(orcamento.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

		doc.setFillColor(255, 247, 237);
		doc.rect(margin, y, pageWidth - (margin * 2), 26, 'F');
		doc.setFillColor(255, 107, 0);
		doc.rect(margin, y, 4, 26, 'F');

		doc.setTextColor(255, 107, 0);
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.text('CLIENTE', margin + 8, y + 7);

		doc.setTextColor(15, 23, 42);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text(orcamento.cliente?.nome || orcamento.nomeCliente || 'Cliente', margin + 8, y + 14);

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		doc.text(`Data: ${formatDate(orcamento.createdAt)}   |   Hora: ${horaCompletoFormatada}`, margin + 8, y + 21);

		y += 34;

		const pageHeight = doc.internal.pageSize.getHeight();
		const bottomMargin = 20;

		function checkPage(needed: number) {
			if (y + needed > pageHeight - bottomMargin) {
				doc.addPage();
				y = 20;
			}
		}

		// ==================== CABEÇALHO DE ITENS ====================
		doc.setTextColor(255, 107, 0);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		doc.text('ITENS DETALHADOS', margin + 4, y + 6);
		y += 14;

		// ==================== ITENS DETALHADOS ====================
		itensParaPDF.forEach((item: any, index: number) => {
			checkPage(80);

			// Nome do produto
			doc.setFillColor(245, 247, 250);
			doc.rect(margin, y, pageWidth - (margin * 2), 9, 'F');
			doc.setFillColor(255, 107, 0);
			doc.rect(margin, y, 3, 9, 'F');

			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(15, 23, 42);
			doc.text(String(item.descricaoProduto || 'Item'), margin + 6, y + 6);
			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(150, 150, 150);
			doc.text(`#${index + 1}`, pageWidth - margin - 3, y + 6, { align: 'right' });

			y += 17;

			checkPage(50);

			// DETALHES TÉCNICOS
			doc.setFillColor(15, 23, 42);
			doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');

			doc.setFontSize(8.5);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 255, 255);
			doc.text('DETALHES TÉCNICOS', margin + 3, y + 5.5);

			y += 15;

			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(60, 60, 60);

			doc.text(`Área total`, margin + 3, y);
			const areaTotalM2 = (item.areaTotal || 0) / 1_000_000;
			doc.text(`${areaTotalM2.toFixed(4)} m²`, pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			doc.text(`Quantidade`, margin + 3, y);
			const qtdCompleto = Number(item.quantidade || 1);
			doc.text(`${qtdCompleto} ${qtdCompleto === 1 ? 'unidade' : 'unidades'}`, pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			doc.text(`Material`, margin + 3, y);
			doc.text(item.materialNome || 'N/A', pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			doc.text(`Máquina`, margin + 3, y);
			doc.text(item.maquinaNome || 'N/A', pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			doc.text(`Tempo total`, margin + 3, y);
			doc.text(`${(item.tempoTotalHoras || 0).toFixed(2)} horas`, pageWidth - margin - 3, y, { align: 'right' });

			y += 10;

			checkPage(60);

			// CUSTOS DETALHADOS
			doc.setFillColor(15, 23, 42);
			doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');

			doc.setFontSize(8.5);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 255, 255);
			doc.text('CUSTOS DETALHADOS', margin + 3, y + 5.5);
			doc.text('VALOR', pageWidth - margin - 3, y + 5.5, { align: 'right' });

			y += 15;

			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(60, 60, 60);

			doc.text(`Custo de material`, margin + 3, y);
			doc.text(`R$ ${(item.materialValor || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			doc.text(`Custo de máquina`, margin + 3, y);
			doc.text(`R$ ${(item.maquinaValor || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			if (item.pintada) {
				doc.text(`Custos extras (pintura)`, margin + 3, y);
				doc.text(`R$ ${(item.valorPintura || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
				y += 5;
			}

			doc.setFont('helvetica', 'bold');
			doc.text(`Custo total`, margin + 3, y);
			doc.text(`R$ ${(item.valorTotal || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });

			y += 5;
			doc.text(`Margem de lucro (${orcamento.margemLucro}%)`, margin + 3, y);
			const margemItem = (item.valorTotal || 0) * (orcamento.margemLucro / 100);
			doc.text(`R$ ${margemItem.toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });

			y += 8;

			// Valor final do item
			const valorItemFinal = (item.valorTotal || 0) * (1 + orcamento.margemLucro / 100);
			doc.setFontSize(9.5);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 107, 0);
			doc.text('VALOR FINAL DO ITEM', margin + 3, y + 6);
			doc.text(`R$ ${valorItemFinal.toFixed(2)}`, pageWidth - margin - 3, y + 6, { align: 'right' });

			y += 15;
		});

		// TOTAL GERAL
		checkPage(20);
		doc.setTextColor(5, 150, 105);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text('VALOR TOTAL GERAL', margin + 5, y + 10);
		doc.text(`R$ ${orcamento.valorFinal.toFixed(2)}`, pageWidth - margin - 5, y + 10, { align: 'right' });

		y += 22;

		// RODAPÉ
		doc.setFontSize(8);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(130, 130, 130);
		doc.text('Orçamento válido por 7 dias', pageWidth / 2, y, { align: 'center' });

		// SALVAR
		doc.save(`orcamento-completo-${(orcamento.cliente?.nome || orcamento.nomeCliente || 'cliente').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
		
		console.log('✅ PDF Completo gerado!');
	} catch (error) {
		console.error('❌ Erro ao gerar PDF:', error);
		alert('Erro ao gerar PDF. Verifique o console.');
	}
}
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:save" class="header-icon" />
		<h1>Orçamentos</h1>
	</div>
</div>

<!-- Filtros -->
{#if !data.isCliente}
<div class="filters-section">
	<div class="filter-chips">
		<button 
			class="chip {statusFilter === 'todos' ? 'active' : ''}"
			onclick={() => statusFilter = 'todos'}
		>
			<Icon icon="lucide:list" />
			Todos
		</button>
		<button 
			class="chip {statusFilter === 'Pendente' ? 'active' : ''}"
			onclick={() => statusFilter = 'Pendente'}
		>
			<Icon icon="lucide:clock" />
			Pendentes
		</button>
		<button 
			class="chip {statusFilter === 'Aprovado' ? 'active' : ''}"
			onclick={() => statusFilter = 'Aprovado'}
		>
			<Icon icon="lucide:check-circle" />
			Aprovados
		</button>
		<button 
			class="chip {statusFilter === 'Recusado' ? 'active' : ''}"
			onclick={() => statusFilter = 'Recusado'}
		>
			<Icon icon="lucide:x-circle" />
			Recusados
		</button>
	</div>
</div>
{/if}

<!-- Tabela de Orçamentos -->
<div class="table-section">
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Cliente</th>
					<th>Valor</th>
					<th>Produto</th>
					<th>Data</th>
					<th>Status</th>
					<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredOrcamentos() as orcamento}
					<tr>
						<td class="cliente-cell">{orcamento.cliente?.nome || orcamento.nomeCliente || 'Cliente não informado'}</td>
						<td class="valor">{formatCurrency(orcamento.valorFinal)}</td>
						<td class="descricao">{getProdutos(orcamento)}</td>
						<td>{formatDate(orcamento.createdAt)}</td>
						<td>
							<StatusBadge
								variant={getOrcamentoStatusVariant(orcamento.status)}
								label={getOrcamentoStatusLabel(orcamento.status)}
							/>
						</td>
						<td>
	<div class="action-buttons">
		<!-- PDF SIMPLES - visível para todos -->
		<button
			class="btn-icon"
			onclick={() => gerarPDFSimples(orcamento)}
			title="Orçamento"
		>
			<Icon icon="lucide:file-text" />
		</button>

		{#if !data.isCliente}
		{#if orcamento.status === 'Pendente'}
			<button
				class="btn-icon success"
				onclick={() => abrirModalAprovar(orcamento)}
				title="Aprovar"
			>
				<Icon icon="lucide:check" />
			</button>
			<form
				method="POST"
				action="?/recusarOrcamento"
				use:enhance
				style="display: inline;"
			>
				<input type="hidden" name="id" value={orcamento.id} />
				<button type="submit" class="btn-icon danger" title="Recusar">
					<Icon icon="lucide:x" />
				</button>
			</form>
		{/if}

		<!-- PDF COMPLETO -->
		<button
			class="btn-icon"
			onclick={() => gerarPDFCompleto(orcamento)}
			title="Orçamento Completo"
			style="color: #3b82f6;"
		>
			<Icon icon="lucide:file-check" />
		</button>

		<a
			class="btn-icon"
			href="/orcamentos/criar?edit={orcamento.id}"
			title="Editar"
			style="color: #fbbf24;"
		>
			<Icon icon="lucide:pencil" />
		</a>

		<button
			class="btn-icon"
			onclick={() => abrirModalVincular(orcamento)}
			title="Vincular cliente"
			style="color: #a78bfa;"
		>
			<Icon icon="lucide:user-check" />
		</button>

		<button
			class="btn-icon danger"
			onclick={() => abrirModalExcluir(orcamento)}
			title="Excluir"
		>
			<Icon icon="lucide:trash-2" />
		</button>
		{/if}
	</div>
</td>
					</tr>
				{/each}
			</tbody>
		</table>
		
		{#if filteredOrcamentos().length === 0}
			<EmptyState message="Nenhum orçamento encontrado" />
		{/if}
	</div>
</div>

<!-- Modal Aprovar Orçamento -->
{#if showModalAprovar && orcamentoSelecionado}
	<div 
		class="modal-overlay" 
		onclick={fecharModal}
		onkeydown={(e) => e.key === 'Escape' && fecharModal()}
		role="button"
		tabindex="-1"
		aria-label="Fechar modal"
	>
		<div 
			class="modal-drawer" 
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<h2>Aprovar Orçamento</h2>
				<button class="btn-close" onclick={fecharModal}>
					<Icon icon="lucide:x" />
				</button>
			</div>
			
			<form 
				class="modal-body" 
				method="POST" 
				action="?/aprovarOrcamento"
				use:enhance={() => {
					erroAprovar = '';
					return async ({ result, update }) => {
						if (result.type === 'success') {
							fecharModal();
						} else if (result.type === 'failure') {
							erroAprovar = (result.data as any)?.error || 'Erro ao aprovar orçamento';
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={orcamentoSelecionado.id} />
				
				<div class="info-card">
					<h3>Informações do Orçamento</h3>
					<p><strong>Cliente:</strong> {orcamentoSelecionado.cliente?.nome || orcamentoSelecionado.nomeCliente || 'Não informado'}</p>
					<p><strong>Valor:</strong> {formatCurrency(orcamentoSelecionado.valorFinal)}</p> <!-- MUDOU AQUI -->
					{#if orcamentoSelecionado.descricao}
						<p><strong>Descrição:</strong> {orcamentoSelecionado.descricao}</p>
					{/if}
				</div>
				
				<div class="field">
					<label for="dataEntrega">Data de Entrega do Pedido</label>
					<input 
						type="date" 
						id="dataEntrega"
						name="dataEntrega"
						bind:value={dataEntrega}
						required
					/>
				</div>
				
				{#if erroAprovar}
					<div class="alert-erro">
						<Icon icon="lucide:alert-circle" />
						<p>{erroAprovar}</p>
					</div>
				{:else}
					<div class="alert-info">
						<Icon icon="lucide:info" />
						<p>Ao aprovar, um pedido será criado automaticamente com status "Pendente".</p>
					</div>
				{/if}
				
				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={fecharModal}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary">
						<Icon icon="lucide:check" />
						Aprovar e Criar Pedido
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Vincular Cliente -->
{#if showModalVincular && orcamentoParaVincular}
	<div
		class="modal-overlay"
		onclick={fecharModalVincular}
		onkeydown={(e) => e.key === 'Escape' && fecharModalVincular()}
		role="button"
		tabindex="-1"
		aria-label="Fechar modal"
	>
		<div
			class="modal-drawer"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<h2>Vincular Cliente</h2>
				<button class="btn-close" onclick={fecharModalVincular}>
					<Icon icon="lucide:x" />
				</button>
			</div>

			<form
				class="modal-body"
				method="POST"
				action="?/vincularCliente"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							fecharModalVincular();
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={orcamentoParaVincular.id} />

				<div class="info-card">
					<h3>Orçamento</h3>
					<p><strong>Cliente atual:</strong> {orcamentoParaVincular.cliente?.nome || orcamentoParaVincular.nomeCliente || 'Não vinculado'}</p>
					<p><strong>Valor:</strong> {formatCurrency(orcamentoParaVincular.valorFinal)}</p>
				</div>

				<div class="field">
					<label for="clienteVincular">Selecionar Cliente Cadastrado</label>
					<select id="clienteVincular" name="clienteId" bind:value={clienteVincularId}>
						<option value="">— Remover vínculo —</option>
						{#each data.clientes as c}
							<option value={c.id}>{c.nome} {c.telefone ? `· ${c.telefone}` : ''}</option>
						{/each}
					</select>
				</div>

				{#if clienteVincularId}
					{@const clienteSel = data.clientes.find(c => c.id === clienteVincularId)}
					{#if clienteSel}
						<div class="cliente-preview">
							<Icon icon="lucide:user-check" />
							<div>
								<p class="preview-nome">{clienteSel.nome}</p>
								{#if clienteSel.email}<p class="preview-info">{clienteSel.email}</p>{/if}
								{#if clienteSel.telefone}<p class="preview-info">{clienteSel.telefone}</p>{/if}
							</div>
						</div>
					{/if}
				{/if}

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={fecharModalVincular}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary">
						<Icon icon="lucide:link" />
						Salvar Vínculo
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Excluir Orçamento -->
{#if showModalExcluir && orcamentoParaExcluir}
	<div
		class="modal-overlay modal-overlay-center"
		onclick={fecharModalExcluir}
		onkeydown={(e) => e.key === 'Escape' && fecharModalExcluir()}
		role="button"
		tabindex="-1"
		aria-label="Fechar modal"
	>
		<div
			class="modal-center"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-excluir-icon">
				<Icon icon="lucide:trash-2" />
			</div>
			<h2 class="modal-excluir-title">Excluir Orçamento</h2>
			<p class="modal-excluir-desc">
				Tem certeza que deseja excluir o orçamento de
				<strong>{orcamentoParaExcluir.cliente?.nome || orcamentoParaExcluir.nomeCliente || 'cliente não informado'}</strong>?
				Esta ação não pode ser desfeita.
			</p>
			<form
				method="POST"
				action="?/excluirOrcamento"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							fecharModalExcluir();
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={orcamentoParaExcluir.id} />
				<div class="modal-excluir-footer">
					<button type="button" class="btn-secondary" onclick={fecharModalExcluir}>
						Cancelar
					</button>
					<button type="submit" class="btn-danger">
						<Icon icon="lucide:trash-2" />
						Excluir
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

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
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

/* Filters */
.filters-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	padding: 16px;
	margin-bottom: 20px;
}

.filter-chips {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.chip {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 16px;
	color: #d1d5db;
	font-size: 0.85rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
}

.chip:hover {
	background: rgba(40, 40, 40, 0.7);
	border-color: #ffbf91;
}

.chip.active {
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	border-color: transparent;
}

.chip :global(svg) {
	width: 15px;
	height: 15px;
}

/* Table */
.table-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	overflow: hidden;
}

.table-container {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
}

thead {
	background: rgba(30, 30, 30, 0.5);
}

th {
	text-align: left;
	padding: 12px 14px;
	color: #9ca3af;
	font-weight: 600;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

td {
	padding: 12px 14px;
	color: #e5e7eb;
	font-size: 0.9rem;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
}

tr:hover td {
	background: rgba(40, 40, 40, 0.5);
}

.cliente-cell {
	color: #60a5fa;
	font-weight: 600;
}

.valor {
	color: #4ade80;
	font-weight: 600;
}

.descricao {
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}


.action-buttons {
	display: flex;
	gap: 6px;
}

.btn-icon {
	background: rgba(60, 60, 60, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	color: #e0e0e0;
	cursor: pointer;
	padding: 6px;
	border-radius: 6px;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	text-decoration: none;
}

.btn-icon:hover {
	background: rgba(70, 70, 70, 0.9);
	border-color: #ffbf91;
	color: #ffbf91;
}

.btn-icon.success:hover {
	background: rgba(34, 197, 94, 0.2);
	border-color: #4ade80;
	color: #4ade80;
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


/* Modal */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	z-index: 1000;
	display: flex;
	justify-content: flex-end;
}

.modal-drawer {
	width: 100%;
	max-width: 450px;
	background: #2a2a2a;
	border-left: 1px solid rgba(255, 191, 145, 0.2);
	display: flex;
	flex-direction: column;
	animation: slideIn 0.3s ease;
}

@keyframes slideIn {
	from {
		transform: translateX(100%);
	}
	to {
		transform: translateX(0);
	}
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
}

.modal-header h2 {
	font-size: 1.1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.btn-close {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.2s ease;
}

.btn-close:hover {
	background: rgba(255, 191, 145, 0.1);
	color: #ffbf91;
}

.btn-close :global(svg) {
	width: 22px;
	height: 22px;
}

.modal-body {
	flex: 1;
	padding: 20px;
	overflow-y: auto;
}

.info-card {
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 20px;
}

.info-card h3 {
	font-size: 0.9rem;
	font-weight: 600;
	color: #ffbf91;
	margin: 0 0 12px 0;
}

.info-card p {
	font-size: 0.9rem;
	color: #d1d5db;
	margin: 6px 0;
}

.field {
	margin-bottom: 20px;
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

input:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
}

.alert-info {
	display: flex;
	gap: 10px;
	padding: 12px;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.3);
	border-radius: 7px;
	margin-bottom: 20px;
}

.alert-info :global(svg) {
	width: 18px;
	height: 18px;
	color: #60a5fa;
	flex-shrink: 0;
	margin-top: 2px;
}

.alert-info p {
	font-size: 0.85rem;
	color: #bfdbfe;
	margin: 0;
	line-height: 1.5;
}

.alert-erro {
	display: flex;
	gap: 10px;
	padding: 12px;
	background: rgba(239, 68, 68, 0.1);
	border: 1px solid rgba(239, 68, 68, 0.3);
	border-radius: 7px;
	margin-bottom: 20px;
}

.alert-erro :global(svg) {
	width: 18px;
	height: 18px;
	color: #ef4444;
	flex-shrink: 0;
	margin-top: 2px;
}

.alert-erro p {
	font-size: 0.85rem;
	color: #fca5a5;
	margin: 0;
	line-height: 1.5;
}

.modal-footer {
	display: flex;
	gap: 10px;
	padding-top: 20px;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
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

/* Select dentro do modal */
select {
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
	cursor: pointer;
}

select:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
}

.cliente-preview {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	background: rgba(167, 139, 250, 0.1);
	border: 1px solid rgba(167, 139, 250, 0.3);
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 20px;
	color: #a78bfa;
}

.cliente-preview :global(svg) {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	margin-top: 2px;
}

.preview-nome {
	font-size: 0.95rem;
	font-weight: 600;
	color: #e5e7eb;
	margin: 0 0 4px 0;
}

.preview-info {
	font-size: 0.8rem;
	color: #9ca3af;
	margin: 2px 0 0 0;
}

/* Overlay centralizado para modal de exclusão */
.modal-overlay-center {
	align-items: center;
	justify-content: center;
}

/* Modal de Exclusão (centralizado) */
.modal-center {
	background: #2a2a2a;
	border: 1px solid rgba(239, 68, 68, 0.3);
	border-radius: 16px;
	padding: 32px 28px 24px;
	max-width: 420px;
	width: 90%;
	margin: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	animation: popIn 0.25s ease;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

@keyframes popIn {
	from {
		opacity: 0;
		transform: scale(0.9);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

.modal-excluir-icon {
	width: 64px;
	height: 64px;
	background: rgba(239, 68, 68, 0.15);
	border: 2px solid rgba(239, 68, 68, 0.4);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20px;
	color: #ef4444;
}

.modal-excluir-icon :global(svg) {
	width: 28px;
	height: 28px;
}

.modal-excluir-title {
	font-size: 1.2rem;
	font-weight: 700;
	color: #f9fafb;
	margin: 0 0 12px 0;
}

.modal-excluir-desc {
	font-size: 0.9rem;
	color: #9ca3af;
	margin: 0 0 28px 0;
	line-height: 1.6;
}

.modal-excluir-desc strong {
	color: #e5e7eb;
}

.modal-excluir-footer {
	display: flex;
	gap: 10px;
	width: 100%;
}

.btn-danger {
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
	background: linear-gradient(135deg, #ef4444, #dc2626);
	color: #fff;
}

.btn-danger:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
}

.btn-danger :global(svg) {
	width: 16px;
	height: 16px;
}
</style>