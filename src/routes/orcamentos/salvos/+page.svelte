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
	};
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

	
	type PageData = {
		user: { id: string; username: string };
		orcamentos: Orcamento[];
	};
	
	let { data }: { data: PageData } = $props();
	
	let statusFilter = $state('todos');
	let showModalAprovar = $state(false);
	let orcamentoSelecionado = $state<Orcamento | null>(null);
	let dataEntrega = $state('');
	
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
	}
	

	
	// FUNÇÃO PARA GERAR PDF
// ==================== PDF SIMPLES (CLIENTE) ====================
function gerarPDFSimples(orcamento: Orcamento) {
	try {
		// Verificar se o cliente existe
		if (!orcamento.cliente || !orcamento.cliente.nome) {
			alert('Erro: Orçamento sem cliente vinculado. Não é possível gerar PDF.');
			console.error('Orçamento sem cliente:', orcamento);
			return;
		}

		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 15;

		let y = 20;

		// Parsear itens
		let itensParaPDF: any[] = [];
		if (orcamento.itensDetalhados) {
			try {
				const detalhes = JSON.parse(orcamento.itensDetalhados);
				itensParaPDF = detalhes.itens || [];
			} catch (e) {
				console.error('Erro ao parsear itens:', e);
			}
		}
		
		// ==================== TÍTULO ====================
		doc.setFillColor(255, 154, 82);
		doc.rect(0, 0, pageWidth, 35, 'F');
		
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(18);
		doc.setFont('helvetica', 'bold');
		doc.text('ORÇAMENTO - CORTE A LASER', pageWidth / 2, 15, { align: 'center' });
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text('LaserArt - Soluções em Corte a Laser', pageWidth / 2, 23, { align: 'center' });
		
		doc.setFontSize(8);
		doc.text('Telefone: (47) 99999-9999', pageWidth / 2, 28, { align: 'center' });
		doc.text('Email: contato@laserart.com', pageWidth / 2, 32, { align: 'center' });
		
		y = 45;
		
		// ==================== DADOS DO CLIENTE ====================
		doc.setTextColor(40, 40, 40);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		
		doc.text('CLIENTE:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(orcamento.cliente.nome, margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('DATA:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(formatDate(orcamento.createdAt), margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('HORA:', margin, y);
		doc.setFont('helvetica', 'normal');
		const hora = new Date(orcamento.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
		doc.text(hora, margin + 25, y);
		
		y += 12;
		
		// ==================== ITENS ====================
		itensParaPDF.forEach((item: any, index: number) => {
			doc.setDrawColor(200, 200, 200);
			doc.setLineWidth(0.3);
			doc.line(margin, y, pageWidth - margin, y);
			
			y += 7;
			
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(60, 60, 60);
			doc.text(`Descrição: ${item.descricaoProduto || 'Item'}`, margin, y);
			
			y += 7;
			doc.setFontSize(9);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(80, 80, 80);
			const qtd = Number(item.quantidade || 1);
			doc.text(`Quantidade: ${qtd} ${qtd === 1 ? 'unidade' : 'unidades'}`, margin, y);
			
			y += 6;
			doc.text(`Material: ${item.materialNome || 'N/A'}`, margin, y);
			
			y += 10;
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(40, 40, 40);
			const valorUnitario = Number(item.valorTotal || 0) / qtd;
			doc.text('VALOR UNITÁRIO', margin, y);
			doc.text(`R$ ${valorUnitario.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

			y += 7;
			doc.text('VALOR TOTAL', margin, y);
			doc.text(`R$ ${Number(item.valorTotal || 0).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
			
			y += 12;
		});
		
		// ==================== TOTAL GERAL ====================
		if (itensParaPDF.length > 1) {
			doc.setDrawColor(255, 154, 82);
			doc.setLineWidth(0.5);
			doc.line(margin, y, pageWidth - margin, y);
			
			y += 8;
			
			doc.setFontSize(12);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 154, 82);
			doc.text('VALOR TOTAL GERAL', margin, y);
			doc.text(`R$ ${orcamento.valorFinal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
		}
		
		y += 12;
		
		// ==================== PREVISÃO DE ENTREGA ====================
		const dataEntrega = new Date();
		dataEntrega.setDate(dataEntrega.getDate() + 7);
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(100, 100, 100);
		doc.text(`Previsão de entrega: ${dataEntrega.toLocaleDateString('pt-BR')}`, margin, y);
		
		// ==================== SALVAR ====================
		doc.save(`orcamento-simples-${orcamento.cliente.nome.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
		
		console.log('✅ PDF Simples gerado!');
	} catch (error) {
		console.error('❌ Erro ao gerar PDF:', error);
		alert('Erro ao gerar PDF. Verifique o console.');
	}
}

// ==================== PDF COMPLETO (CONTROLE INTERNO) ====================
function gerarPDFCompleto(orcamento: Orcamento) {
	try {
		// Verificar se o cliente existe
		if (!orcamento.cliente || !orcamento.cliente.nome) {
			alert('Erro: Orçamento sem cliente vinculado. Não é possível gerar PDF.');
			console.error('Orçamento sem cliente:', orcamento);
			return;
		}

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
		
		// ==================== TÍTULO ====================
		doc.setFillColor(255, 154, 82);
		doc.rect(0, 0, pageWidth, 35, 'F');
		
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(16);
		doc.setFont('helvetica', 'bold');
		doc.text('ORÇAMENTO DETALHADO - CORTE A LASER', pageWidth / 2, 15, { align: 'center' });
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text('LaserArt - Soluções em Corte a Laser', pageWidth / 2, 23, { align: 'center' });
		
		doc.setFontSize(8);
		doc.text('Telefone: (47) 99999-9999', pageWidth / 2, 28, { align: 'center' });
		doc.text('Email: contato@laserart.com', pageWidth / 2, 32, { align: 'center' });
		
		y = 45;
		
		// ==================== DADOS DO CLIENTE ====================
		doc.setTextColor(40, 40, 40);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		
		doc.text('CLIENTE:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(orcamento.cliente.nome, margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('DATA:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(formatDate(orcamento.createdAt), margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('HORA:', margin, y);
		doc.setFont('helvetica', 'normal');
		const hora = new Date(orcamento.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
		doc.text(hora, margin + 25, y);
		
		y += 12;
		
		// ==================== ITENS DETALHADOS ====================
		itensParaPDF.forEach((item: any, index: number) => {
			doc.setDrawColor(200, 200, 200);
			doc.setLineWidth(0.3);
			doc.line(margin, y, pageWidth - margin, y);
			
			y += 7;
			
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(60, 60, 60);
			doc.text(`Descrição do Projeto: ${item.descricaoProduto || 'Item'}`, margin, y);
			
			y += 10;
			
			// DETALHES TÉCNICOS
			doc.setFillColor(245, 245, 245);
			doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
			
			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(80, 80, 80);
			doc.text('DETALHES TÉCNICOS', margin + 3, y + 5.5);
			
			y += 10;
			
			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(60, 60, 60);
			
			doc.text(`Área total`, margin + 3, y);
			doc.text(`${(item.materialQuantidade || 0).toFixed(4)} m²`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			doc.text(`Quantidade`, margin + 3, y);
			doc.text(`1 unidade`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			doc.text(`Material`, margin + 3, y);
			doc.text(item.materialNome || 'N/A', pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			doc.text(`Máquina`, margin + 3, y);
			doc.text(item.maquinaNome || 'N/A', pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			doc.text(`Tempo total`, margin + 3, y);
			doc.text(`${(item.maquinaHoras || 0).toFixed(2)} horas`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 10;
			
			// CUSTOS DETALHADOS
			doc.setFillColor(245, 245, 245);
			doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
			
			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(80, 80, 80);
			doc.text('CUSTOS DETALHADOS', margin + 3, y + 5.5);
			doc.text('VALOR', pageWidth - margin - 3, y + 5.5, { align: 'right' });
			
			y += 10;
			
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
			
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 154, 82);
			doc.text('VALOR FINAL', margin + 3, y);
			const valorItemFinal = (item.valorTotal || 0) * (1 + orcamento.margemLucro / 100);
			doc.text(`R$ ${valorItemFinal.toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 12;
		});
		
		// GASTOS ADICIONAIS
		if (gastosParaPDF.length > 0) {
			doc.setFillColor(255, 251, 235);
			doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
			
			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(180, 83, 9);
			doc.text('GASTOS ADICIONAIS', margin + 3, y + 5.5);
			
			y += 10;
			
			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(100, 100, 100);
			
			gastosParaPDF.forEach((gasto: any) => {
				doc.text(`• ${gasto.descricao}`, margin + 3, y);
				doc.text(`R$ ${gasto.valor.toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
				y += 5;
			});
			
			y += 5;
		}
		
		// TOTAL GERAL
		doc.setDrawColor(255, 154, 82);
		doc.setLineWidth(0.5);
		doc.line(margin, y, pageWidth - margin, y);
		
		y += 8;
		
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(255, 154, 82);
		doc.text('VALOR TOTAL GERAL', margin, y);
		doc.text(`R$ ${orcamento.valorFinal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
		
		y += 12;
		
		// PREVISÃO DE ENTREGA
		const dataEntrega = new Date();
		dataEntrega.setDate(dataEntrega.getDate() + 7);
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(100, 100, 100);
		doc.text(`Previsão de entrega: ${dataEntrega.toLocaleDateString('pt-BR')}`, margin, y);
		
		// SALVAR
		doc.save(`orcamento-completo-${orcamento.cliente.nome.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
		
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

<!-- Tabela de Orçamentos -->
<div class="table-section">
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Cliente</th>
					<th>Valor</th>
					<th>Descrição</th>
					<th>Data</th>
					<th>Status</th>
					<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredOrcamentos() as orcamento}
					<tr>
						<td class="cliente-cell">{orcamento.cliente?.nome || 'Cliente não informado'}</td>
						<td class="valor">{formatCurrency(orcamento.valorFinal)}</td>
						<td class="descricao">{orcamento.descricao || '-'}</td>
						<td>{formatDate(orcamento.createdAt)}</td>
						<td>
							<StatusBadge
								variant={getOrcamentoStatusVariant(orcamento.status)}
								label={getOrcamentoStatusLabel(orcamento.status)}
							/>
						</td>
						<td>
	<div class="action-buttons">
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
		
		<!-- PDF SIMPLES -->
		<button 
			class="btn-icon" 
			onclick={() => gerarPDFSimples(orcamento)}
			title="PDF Simples (Cliente)"
		>
			<Icon icon="lucide:file-text" />
		</button>
		
		<!-- PDF COMPLETO -->
		<button 
			class="btn-icon" 
			onclick={() => gerarPDFCompleto(orcamento)}
			title="PDF Completo (Interno)"
			style="color: #3b82f6;"
		>
			<Icon icon="lucide:file-check" />
		</button>
		
		<button class="btn-icon" title="Visualizar">
			<Icon icon="lucide:eye" />
		</button>
		
		<form 
			method="POST" 
			action="?/excluirOrcamento"
			use:enhance={() => {
				return async ({ update }) => {
					if (confirm('Deseja realmente excluir este orçamento?')) {
						await update();
					}
				};
			}}
			style="display: inline;"
		>
			<input type="hidden" name="id" value={orcamento.id} />
			<button type="submit" class="btn-icon danger" title="Excluir">
				<Icon icon="lucide:trash-2" />
			</button>
		</form>
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
					return async ({ result, update }) => {
						if (result.type === 'success') {
							fecharModal();
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={orcamentoSelecionado.id} />
				
				<div class="info-card">
					<h3>Informações do Orçamento</h3>
					<p><strong>Cliente:</strong> {orcamentoSelecionado.cliente.nome}</p>
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
				
				<div class="alert-info">
					<Icon icon="lucide:info" />
					<p>Ao aprovar, um pedido será criado automaticamente com status "Pendente".</p>
				</div>
				
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
</style>