<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import { jsPDF } from 'jspdf';
	import { formatDate } from '$lib/utils/format';
	import ClienteAutocomplete from '$lib/components/clientes/ClienteAutocomplete.svelte';

	type Maquina = {
		id: string;
		nome: string;
		custoHora: number;
	};
	
	type Material = {
		id: string;
		nome: string;
		precoMm2: number;
	};
	
	type Cliente = {
	id: string;
	nome: string;
	telefone: string;
	email: string;
};

	type ItemOrcamento = {
	id: string;
	descricaoProduto: string;
	
	// Dimensões
	larguraMm: number;
	alturaMm: number;
	areaPorPecaMm2: number;
	
	// Quantidade
	quantidade: number;
	areaTotal: number;
	
	// Material
	materialId: string;
	materialNome: string;
	materialValor: number;
	
	// Máquina
	maquinaId: string;
	maquinaNome: string;
	tempoPorPecaMin: number;
	tempoTotalHoras: number;
	maquinaValor: number;
	
	// Extras
	pintada: boolean;
	valorPintura: number;
	
	// Total
	valorTotal: number;
};
	
	type GastoAdicional = {
		id: string;
		descricao: string;
		valor: number;
	};
	
	type PageData = {
	user: { id: string; username: string };
	maquinas: Maquina[];
	materiais: Material[];
	clientes: Cliente[];
};

	
	let { data }: { data: PageData } = $props();
	
	// Estado do formulário principal
	let clienteSelecionadoId = $state('');
	let observacoes = $state('');
	let itens = $state<ItemOrcamento[]>([]);
	let gastosAdicionais = $state<GastoAdicional[]>([]);
	
	// Estado do item sendo adicionado
	let descricaoProduto = $state('');
	let materialSelecionadoId = $state(''); 
	let larguraMm = $state('');
	let alturaMm = $state('');
	let quantidade = $state('1');
	let maquinaSelecionadaId = $state('');
	let tempoPorPecaMin = $state('');
	let itemPintado = $state(false);
	let valorPintura = $state('');
	
	// Estado gasto adicional
	let descricaoGasto = $state('');
	let valorGasto = $state('');
	
	// Modais
	let showAddForm = $state(false);
	let showGastoForm = $state(false);
	
	// Cálculos
	let subtotal = $derived(itens.reduce((sum, item) => sum + item.valorTotal, 0));
	let totalGastosAdicionais = $derived(gastosAdicionais.reduce((sum, g) => sum + g.valor, 0));
	let totalComGastos = $derived(subtotal + totalGastosAdicionais);
	let margemLucro = $state(30);
	let valorFinal = $derived(totalComGastos * (1 + margemLucro / 100));


	function getMaterial(id: string) {
		return data.materiais.find(m => m.id === id);
	}
	
	function getMaquina(id: string) {
		return data.maquinas.find(m => m.id === id);
	}
	
	let areaPorPeca = $derived(() => {
	const l = parseFloat(larguraMm);
	const a = parseFloat(alturaMm);
	return l && a ? l * a : 0;
});

let areaTotal = $derived(() => {
	const area = areaPorPeca();
	const qtd = parseInt(quantidade) || 1;
	return area * qtd;
});

let tempoTotalHoras = $derived(() => {
	const tempo = parseFloat(tempoPorPecaMin);
	const qtd = parseInt(quantidade) || 1;
	return tempo && qtd ? (tempo * qtd) / 60 : 0;
});


	function calcularValorItem() {
	const material = getMaterial(materialSelecionadoId);
	const maquina = getMaquina(maquinaSelecionadaId);
	
	const l = parseFloat(larguraMm);
	const a = parseFloat(alturaMm);
	const qtd = parseInt(quantidade) || 1;
	const tempo = parseFloat(tempoPorPecaMin);
	
	if (!material || !maquina || !l || !a || !qtd || !tempo) {
		return 0;
	}
	
	const areaPeca = l * a;
	const areaT = areaPeca * qtd;
	const tempoH = (tempo * qtd) / 60;
	
	const valorMaterial = areaT * material.precoMm2;
	const valorMaquina = tempoH * maquina.custoHora;
	const valorPint = itemPintado && valorPintura ? parseFloat(valorPintura) : 0;
	
	return valorMaterial + valorMaquina + valorPint;
}

	
	let valorItemAtual = $derived(calcularValorItem());
	
	function adicionarItem() {
	const material = getMaterial(materialSelecionadoId);
	const maquina = getMaquina(maquinaSelecionadaId);
	
	const l = parseFloat(larguraMm);
	const a = parseFloat(alturaMm);
	const qtd = parseInt(quantidade) || 1;
	const tempo = parseFloat(tempoPorPecaMin);
	
	if (!descricaoProduto || !material || !maquina || !l || !a || !qtd || !tempo) {
		alert('Preencha todos os campos obrigatórios do item');
		return;
	}
	
	if (itemPintado && (!valorPintura || parseFloat(valorPintura) <= 0)) {
		alert('Informe o valor da pintura');
		return;
	}
	
	const areaPeca = l * a;
	const areaT = areaPeca * qtd;
	const tempoH = (tempo * qtd) / 60;
	
	const valorMaterial = areaT * material.precoMm2;
	const valorMaquina = tempoH * maquina.custoHora;
	const valorPint = itemPintado ? parseFloat(valorPintura) : 0;
	
	const novoItem: ItemOrcamento = {
		id: `item-${Date.now()}`,
		descricaoProduto: descricaoProduto,
		larguraMm: l,
		alturaMm: a,
		areaPorPecaMm2: areaPeca,
		quantidade: qtd,
		areaTotal: areaT,
		materialId: material.id,
		materialNome: material.nome,
		materialValor: valorMaterial,
		maquinaId: maquina.id,
		maquinaNome: maquina.nome,
		tempoPorPecaMin: tempo,
		tempoTotalHoras: tempoH,
		maquinaValor: valorMaquina,
		pintada: itemPintado,
		valorPintura: valorPint,
		valorTotal: valorMaterial + valorMaquina + valorPint
	};
	
	itens.push(novoItem);
	limparFormItem();
	showAddForm = false;
}
	
	function adicionarGasto() {
		if (!descricaoGasto || !valorGasto || parseFloat(valorGasto) <= 0) {
			alert('Preencha a descrição e o valor do gasto');
			return;
		}
		
		gastosAdicionais.push({
			id: `gasto-${Date.now()}`,
			descricao: descricaoGasto,
			valor: parseFloat(valorGasto)
		});
		
		descricaoGasto = '';
		valorGasto = '';
		showGastoForm = false;
	}
	
	function removerGasto(id: string) {
		gastosAdicionais = gastosAdicionais.filter(g => g.id !== id);
	}
	
	function limparFormItem() {
	descricaoProduto = '';
	materialSelecionadoId = '';
	larguraMm = '';
	alturaMm = '';
	quantidade = '1';
	maquinaSelecionadaId = '';
	tempoPorPecaMin = '';
	itemPintado = false;
	valorPintura = '';
}
	
	function removerItem(id: string) {
		if (confirm('Remover este item?')) {
			itens = itens.filter(i => i.id !== id);
		}
	}
	
	function limparTudo() {
		if (confirm('Deseja limpar todo o orçamento?')) {
			itens = [];
			gastosAdicionais = [];
			clienteSelecionadoId = '';
			observacoes = '';
			margemLucro = 30;
			limparFormItem();
			showAddForm = false;
			showGastoForm = false;
		}
	}
	
	function gerarItensJSON() {
		return JSON.stringify({
			itens,
			gastosAdicionais
		});
	}
	
// ==================== PDF SIMPLES (CLIENTE) ====================
async function gerarPDFSimples(orcamentoData?: any) {
	const isOrcamentoSalvo = !!orcamentoData;
	
	if (!isOrcamentoSalvo && (!clienteSelecionadoId || itens.length === 0)) {
		alert('Preencha o cliente e adicione itens antes de gerar o PDF');
		return;
	}
	
	try {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 15;
		
		let y = 20;
		
		// Debug inicial
		console.log('🔍 Debug PDF Simples:', {
			isOrcamentoSalvo,
			clienteSelecionadoId,
			totalClientes: data.clientes.length
		});

		// Dados - Garantir que sejam strings válidas
		const dadosCliente = isOrcamentoSalvo
			? (orcamentoData.cliente?.nome || 'Cliente não informado')
			: (data.clientes.find(c => c.id === clienteSelecionadoId)?.nome || 'Cliente não informado');


		// Criar objeto Date uma única vez
		const dataAtual = new Date();
		
		// Validar e formatar data
		let dadosData: string;
		let dadosHora: string;
		
		if (isOrcamentoSalvo) {
			try {
				const dataOrcamento = new Date(orcamentoData.createdAt);
				if (!isNaN(dataOrcamento.getTime())) {
					dadosData = dataOrcamento.toLocaleDateString('pt-BR');
					dadosHora = dataOrcamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
				} else {
					throw new Error('Data inválida');
				}
			} catch (e) {
				console.error('Erro ao formatar data salva:', e);
				dadosData = dataAtual.toLocaleDateString('pt-BR');
				dadosHora = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
			}
		} else {
			dadosData = dataAtual.toLocaleDateString('pt-BR');
			dadosHora = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
		}
		
		const dadosValorFinal = Number(isOrcamentoSalvo ? orcamentoData.valorFinal : valorFinal) || 0;
		
		// Debug
		console.log('📋 Dados do PDF Simples:', { 
			cliente: dadosCliente, 
			data: dadosData, 
			hora: dadosHora,
			valorFinal: dadosValorFinal,
			isOrcamentoSalvo
		});
		
		let dadosItens: any[] = [];
		if (isOrcamentoSalvo && orcamentoData.itensDetalhados) {
			try {
				const detalhes = JSON.parse(orcamentoData.itensDetalhados);
				dadosItens = detalhes.itens || [];
			} catch (e) {
				console.error('Erro ao parsear itens:', e);
			}
		} else {
			dadosItens = itens;
		}
		
		// ==================== CABEÇALHO COM LOGO ====================
		doc.setFillColor(255, 154, 82);
		doc.rect(0, 0, pageWidth, 45, 'F');
		
		// Logo à esquerda (com tratamento de erro)
		try {
			const img = new Image();
			img.src = '/Logo.png';
			
			// Aguardar o carregamento da imagem
			await new Promise((resolve, reject) => {
				img.onload = () => {
					try {
						doc.addImage(img, 'PNG', margin, 8, 30, 30);
						resolve(true);
					} catch (e) {
						console.log('Erro ao adicionar logo:', e);
						resolve(false);
					}
				};
				img.onerror = () => {
					console.log('Logo não encontrada');
					resolve(false);
				};
				// Timeout de 2 segundos
				setTimeout(() => resolve(false), 2000);
			});
		} catch (e) {
			console.log('Erro ao carregar logo:', e);
		}
		
		// Título à direita
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(20);
		doc.setFont('helvetica', 'bold');
		doc.text('ORÇAMENTO', pageWidth - margin, 15, { align: 'right' });
		
		doc.setFontSize(18);
		doc.text('CORTE A LASER', pageWidth - margin, 24, { align: 'right' });
		
		y = 55;
		
		// ==================== INFO DA EMPRESA ====================
		doc.setTextColor(60, 60, 60);
		doc.setFontSize(14);
		doc.setFont('helvetica', 'bold');
		doc.text('LaserArt', margin, y);
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(80, 80, 80);
		doc.text('Soluções em Corte a Laser', margin, y + 6);
		
		doc.setFontSize(8);
		doc.setTextColor(100, 100, 100);
		doc.text('Telefone: (47) 99999-9999', margin, y + 11);
		doc.text('Email: contato@laserart.com', margin, y + 16);
		
		// Linha separadora
		y += 23;
		doc.setDrawColor(200, 200, 200);
		doc.setLineWidth(0.3);
		doc.line(margin, y, pageWidth - margin, y);
		
		y += 8;
		
		// ==================== DADOS DO CLIENTE ====================
		doc.setTextColor(40, 40, 40);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		
		doc.text('CLIENTE:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(dadosCliente, margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('DATA:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(dadosData, margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('HORA:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(dadosHora, margin + 25, y);
		
		y += 12;
		
		// ==================== ITENS ====================
		dadosItens.forEach((item: any, index: number) => {
			doc.setDrawColor(200, 200, 200);
			doc.setLineWidth(0.3);
			doc.line(margin, y, pageWidth - margin, y);
			
			y += 7;
			
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(60, 60, 60);
			doc.text(`Descrição: ${String(item.descricaoProduto || 'Item')}`, margin, y);
			
			y += 7;
			doc.setFontSize(9);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(80, 80, 80);
			const qtd = Number(item.quantidade || 1);
			doc.text(`Quantidade: ${qtd} ${qtd === 1 ? 'unidade' : 'unidades'}`, margin, y);

			y += 6;
			doc.text(`Material: ${String(item.materialNome || 'N/A')}`, margin, y);
			
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
		if (dadosItens.length > 1 || dadosItens.length === 0) {
			doc.setDrawColor(255, 154, 82);
			doc.setLineWidth(0.5);
			doc.line(margin, y, pageWidth - margin, y);
			
			y += 8;
			
			doc.setFontSize(12);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 154, 82);
			doc.text('VALOR TOTAL GERAL', margin, y);
			doc.text(`R$ ${Number(dadosValorFinal).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
		}
		
		y += 12;
		
		// ==================== PREVISÃO DE ENTREGA ====================
		const dataEntrega = new Date(dataAtual);
		dataEntrega.setDate(dataEntrega.getDate() + 7);
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(100, 100, 100);
		doc.text(`Previsão de entrega: ${dataEntrega.toLocaleDateString('pt-BR')}`, margin, y);
		
		// ==================== SALVAR ====================
		const nomeArquivo = `orcamento-simples-${dadosCliente.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
		doc.save(nomeArquivo);
		
		console.log('✅ PDF Simples gerado com sucesso:', nomeArquivo);
	} catch (error) {
		console.error('❌ Erro ao gerar PDF Simples:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		alert(`Erro ao gerar PDF: ${errorMessage}`);
	}
}

// ==================== PDF COMPLETO (CONTROLE INTERNO) ====================
async function gerarPDFCompleto(orcamentoData?: any) {
	const isOrcamentoSalvo = !!orcamentoData;
	
	if (!isOrcamentoSalvo && (!clienteSelecionadoId || itens.length === 0)) {
	alert('Selecione o cliente e adicione itens antes de gerar o PDF');
	return;
}
	
	try {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 15;
		
		let y = 20;
		
		// Debug inicial
		console.log('🔍 Debug PDF Completo:', {
			isOrcamentoSalvo,
			clienteSelecionadoId,
			totalClientes: data.clientes.length
		});

		// Dados - Garantir que sejam strings/números válidos
		const dadosCliente = isOrcamentoSalvo
			? (orcamentoData.cliente?.nome || 'Cliente não informado')
			: (data.clientes.find(c => c.id === clienteSelecionadoId)?.nome || 'Cliente não informado');
		
		// Criar objeto Date uma única vez
		const dataAtual = new Date();
		
		// Validar e formatar data
		let dadosData: string;
		let dadosHora: string;
		
		if (isOrcamentoSalvo) {
			try {
				const dataOrcamento = new Date(orcamentoData.createdAt);
				if (!isNaN(dataOrcamento.getTime())) {
					dadosData = dataOrcamento.toLocaleDateString('pt-BR');
					dadosHora = dataOrcamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
				} else {
					throw new Error('Data inválida');
				}
			} catch (e) {
				console.error('Erro ao formatar data salva:', e);
				dadosData = dataAtual.toLocaleDateString('pt-BR');
				dadosHora = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
			}
		} else {
			dadosData = dataAtual.toLocaleDateString('pt-BR');
			dadosHora = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
		}
		
		const dadosValorFinal = Number(isOrcamentoSalvo ? orcamentoData.valorFinal : valorFinal) || 0;
		const dadosMargemLucro = Number(isOrcamentoSalvo ? orcamentoData.margemLucro : margemLucro) || 0;
		
		let dadosItens: any[] = [];
		let dadosGastos: any[] = [];
		
		if (isOrcamentoSalvo && orcamentoData.itensDetalhados) {
			try {
				const detalhes = JSON.parse(orcamentoData.itensDetalhados);
				dadosItens = detalhes.itens || [];
				dadosGastos = detalhes.gastosAdicionais || [];
			} catch (e) {
				console.error('Erro ao parsear detalhes:', e);
			}
		} else {
			dadosItens = itens;
			dadosGastos = gastosAdicionais;
		}
		
		// ==================== CABEÇALHO COM LOGO ====================
		doc.setFillColor(255, 154, 82);
		doc.rect(0, 0, pageWidth, 45, 'F');
		
		// Logo à esquerda (com tratamento de erro)
		try {
			const img = new Image();
			img.src = '/Logo.png';
			
			// Aguardar o carregamento da imagem
			await new Promise((resolve, reject) => {
				img.onload = () => {
					try {
						doc.addImage(img, 'PNG', margin, 8, 30, 30);
						resolve(true);
					} catch (e) {
						console.log('Erro ao adicionar logo:', e);
						resolve(false);
					}
				};
				img.onerror = () => {
					console.log('Logo não encontrada');
					resolve(false);
				};
				// Timeout de 2 segundos
				setTimeout(() => resolve(false), 2000);
			});
		} catch (e) {
			console.log('Erro ao carregar logo:', e);
		}
		
		// Título à direita
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(18);
		doc.setFont('helvetica', 'bold');
		doc.text('ORÇAMENTO DETALHADO', pageWidth - margin, 15, { align: 'right' });
		
		doc.setFontSize(16);
		doc.text('CORTE A LASER', pageWidth - margin, 24, { align: 'right' });
		
		y = 55;
		
		// ==================== INFO DA EMPRESA ====================
		doc.setTextColor(60, 60, 60);
		doc.setFontSize(14);
		doc.setFont('helvetica', 'bold');
		doc.text('LaserArt', margin, y);
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(80, 80, 80);
		doc.text('Soluções em Corte a Laser', margin, y + 6);
		
		doc.setFontSize(8);
		doc.setTextColor(100, 100, 100);
		doc.text('Telefone: (47) 99999-9999', margin, y + 11);
		doc.text('Email: contato@laserart.com', margin, y + 16);
		
		// Linha separadora
		y += 23;
		doc.setDrawColor(200, 200, 200);
		doc.setLineWidth(0.3);
		doc.line(margin, y, pageWidth - margin, y);
		
		y += 8;
		
		// ==================== DADOS DO CLIENTE ====================
		doc.setTextColor(40, 40, 40);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		
		doc.text('CLIENTE:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(dadosCliente, margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('DATA:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(dadosData, margin + 25, y);
		
		y += 7;
		doc.setFont('helvetica', 'bold');
		doc.text('HORA:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.text(dadosHora, margin + 25, y);
		
		y += 12;
		
		// ==================== ITENS DETALHADOS ====================
		dadosItens.forEach((item: any, index: number) => {
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
			
			doc.text(`Dimensões`, margin + 3, y);
doc.text(`${Number(item.larguraMm || 0).toFixed(1)}mm × ${Number(item.alturaMm || 0).toFixed(1)}mm`, pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Área por peça`, margin + 3, y);
doc.text(`${Number(item.areaPorPecaMm2 || 0).toLocaleString('pt-BR')} mm²`, pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Quantidade`, margin + 3, y);
doc.text(`${Number(item.quantidade || 1)} unidades`, pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Área total`, margin + 3, y);
doc.text(`${Number(item.areaTotal || 0).toLocaleString('pt-BR')} mm²`, pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Material`, margin + 3, y);
doc.text(String(item.materialNome || 'N/A'), pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Máquina`, margin + 3, y);
doc.text(String(item.maquinaNome || 'N/A'), pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Tempo por peça`, margin + 3, y);
doc.text(`${Number(item.tempoPorPecaMin || 0).toFixed(1)} minutos`, pageWidth - margin - 3, y, { align: 'right' });

y += 5;
doc.text(`Tempo total`, margin + 3, y);
doc.text(`${Number(item.tempoTotalHoras || 0).toFixed(2)} horas`, pageWidth - margin - 3, y, { align: 'right' });
			
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
			doc.text(`R$ ${Number(item.materialValor || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			doc.text(`Custo de máquina`, margin + 3, y);
			doc.text(`R$ ${Number(item.maquinaValor || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			if (item.pintada) {
				doc.text(`Custos extras (pintura)`, margin + 3, y);
				doc.text(`R$ ${Number(item.valorPintura || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
				y += 5;
			}
			
			doc.setFont('helvetica', 'bold');
			doc.text(`Custo total`, margin + 3, y);
			doc.text(`R$ ${Number(item.valorTotal || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 5;
			doc.text(`Margem de lucro (${Number(dadosMargemLucro)}%)`, margin + 3, y);
			const margemItem = Number(item.valorTotal || 0) * (Number(dadosMargemLucro) / 100);
			doc.text(`R$ ${Number(margemItem).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 8;
			
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(255, 154, 82);
			doc.text('VALOR FINAL', margin + 3, y);
			const valorItemFinal = Number(item.valorTotal || 0) * (1 + Number(dadosMargemLucro) / 100);
			doc.text(`R$ ${Number(valorItemFinal).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
			
			y += 12;
		});
		
		// GASTOS ADICIONAIS
		if (dadosGastos.length > 0) {
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
			
			dadosGastos.forEach((gasto: any) => {
				doc.text(`• ${String(gasto.descricao || 'Gasto')}`, margin + 3, y);
				doc.text(`R$ ${Number(gasto.valor || 0).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
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
		doc.text(`R$ ${Number(dadosValorFinal).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
		
		y += 12;
		
		// PREVISÃO DE ENTREGA
		const dataEntrega = new Date(dataAtual);
		dataEntrega.setDate(dataEntrega.getDate() + 7);
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(100, 100, 100);
		doc.text(`Previsão de entrega: ${dataEntrega.toLocaleDateString('pt-BR')}`, margin, y);
		
		// SALVAR
		const nomeArquivo = `orcamento-completo-${dadosCliente.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
		doc.save(nomeArquivo);
		
		console.log('✅ PDF Completo gerado com sucesso:', nomeArquivo);
	} catch (error) {
		console.error('❌ Erro ao gerar PDF Completo:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		alert(`Erro ao gerar PDF: ${errorMessage}`);
	}
}
</script>

<div class="page-header">
	<div class="header-content">
		<Icon icon="lucide:calculator" class="header-icon" />
		<h1>Criar Orçamento</h1>
	</div>
	<div class="header-actions">
		<button
			class="btn-export"
			onclick={() => gerarPDFSimples()}
			disabled={!clienteSelecionadoId || itens.length === 0}
			title="PDF resumido para enviar ao cliente"
		>
			<Icon icon="lucide:file-text" />
			PDF Simples
		</button>
		<button
			class="btn-export"
			onclick={() => gerarPDFCompleto()}
			disabled={!clienteSelecionadoId || itens.length === 0}
			title="PDF detalhado para controle interno"
			style="background-color: #3b82f6;"
		>
			<Icon icon="lucide:file-check" />
			PDF Completo
		</button>
		<button class="btn-secondary" onclick={limparTudo}>
			<Icon icon="lucide:trash-2" />
			Limpar Tudo
		</button>
	</div>
</div>

<div class="content-grid">
	<!-- Coluna Esquerda: Itens -->
	<div class="form-section">
		<div class="section-header">
			<h2>Itens do Orçamento ({itens.length})</h2>
			<button 
				class="btn-add-item" 
				onclick={() => showAddForm = !showAddForm}
			>
				<Icon icon={showAddForm ? 'lucide:minus' : 'lucide:plus'} />
				{showAddForm ? 'Cancelar' : 'Novo Item'}
			</button>
		</div>
		
		<!-- Formulário Adicionar Item -->
		{#if showAddForm}
			<div class="add-item-form">
	<div class="field">
		<label for="desc-produto">Descrição do Produto *</label>
		<input 
			type="text" 
			id="desc-produto"
			bind:value={descricaoProduto}
			placeholder="Ex: Placa personalizada"
		/>
	</div>
	
	<!-- DIMENSÕES -->
	<div class="dimensoes-row">
		<div class="field">
			<label for="largura">Largura (mm) *</label>
			<input 
				type="number" 
				id="largura"
				bind:value={larguraMm}
				placeholder="100.0"
				step="0.1"
				min="0"
			/>
		</div>
		
		<span class="multiplicador">×</span>
		
		<div class="field">
			<label for="altura">Altura (mm) *</label>
			<input 
				type="number" 
				id="altura"
				bind:value={alturaMm}
				placeholder="50.0"
				step="0.1"
				min="0"
			/>
		</div>
	</div>
	
	{#if areaPorPeca() > 0}
		<div class="info-calculada">
			<Icon icon="lucide:ruler" />
			<span>Área por peça: <strong>{areaPorPeca().toLocaleString('pt-BR')} mm²</strong></span>
		</div>
	{/if}
	
	<!-- QUANTIDADE -->
	<div class="field">
		<label for="quantidade">Quantidade (unidades) *</label>
		<input 
			type="number" 
			id="quantidade"
			bind:value={quantidade}
			placeholder="1"
			step="1"
			min="1"
		/>
	</div>
	
	{#if areaTotal() > 0}
		<div class="info-calculada">
			<Icon icon="lucide:maximize-2" />
			<span>Área total: <strong>{areaTotal().toLocaleString('pt-BR')} mm²</strong></span>
		</div>
	{/if}
	
	<!-- MATERIAL -->
	<div class="field">
		<label for="material">Material *</label>
		<select id="material" bind:value={materialSelecionadoId}>
			<option value="">Selecione...</option>
			{#each data.materiais as material}
				<option value={material.id}>
					{material.nome} (R$ {material.precoMm2.toFixed(6)}/mm²)
				</option>
			{/each}
		</select>
	</div>
	
	<!-- MÁQUINA -->
	<div class="field">
		<label for="maquina">Máquina *</label>
		<select id="maquina" bind:value={maquinaSelecionadaId}>
			<option value="">Selecione...</option>
			{#each data.maquinas as maquina}
				<option value={maquina.id}>
					{maquina.nome} (R$ {maquina.custoHora.toFixed(2)}/h)
				</option>
			{/each}
		</select>
	</div>
	
	<!-- TEMPO -->
	<div class="field">
		<label for="tempo">Tempo por peça (minutos) *</label>
		<input 
			type="number" 
			id="tempo"
			bind:value={tempoPorPecaMin}
			placeholder="4.0"
			step="0.1"
			min="0"
		/>
	</div>
	
	{#if tempoTotalHoras() > 0}
		<div class="info-calculada">
			<Icon icon="lucide:clock" />
			<span>Tempo total: <strong>{(tempoTotalHoras() * 60).toFixed(1)} min ({tempoTotalHoras().toFixed(2)}h)</strong></span>
		</div>
	{/if}
	
	<!-- PINTURA -->
	<div class="checkbox-field">
		<label class="checkbox-label">
			<input 
				type="checkbox" 
				bind:checked={itemPintado}
			/>
			<span>Peça será pintada</span>
		</label>
	</div>
	
	{#if itemPintado}
		<div class="field">
			<label for="valor-pintura">Valor da Pintura (R$) *</label>
			<input 
				type="number" 
				id="valor-pintura"
				bind:value={valorPintura}
				placeholder="0.00"
				step="0.01"
				min="0"
			/>
		</div>
	{/if}
	
	{#if valorItemAtual > 0}
		<div class="valor-preview">
			<Icon icon="lucide:info" />
			<span>Valor do item: <strong>R$ {valorItemAtual.toFixed(2)}</strong></span>
		</div>
	{/if}
	
	<button class="btn-primary" onclick={adicionarItem}>
		<Icon icon="lucide:plus" />
		Adicionar Item
	</button>
</div>
		{/if}
		
		<!-- Lista de Itens -->
		<div class="itens-list">
			{#if itens.length === 0}
				<div class="empty-state-small">
					<Icon icon="lucide:inbox" />
					<p>Nenhum item adicionado</p>
					<small>Clique em "Novo Item" para começar</small>
				</div>
			{:else}
				{#each itens as item, index}
					<div class="item-card">
						<div class="item-header">
							<span class="item-numero">#{index + 1}</span>
							<h3>{item.descricaoProduto}</h3>
							{#if item.pintada}
								<span class="badge-pintada">
									<Icon icon="lucide:droplet" />
									Pintada
								</span>
							{/if}
							<button 
								class="btn-remove" 
								onclick={() => removerItem(item.id)}
								title="Remover item"
							>
								<Icon icon="lucide:trash-2" />
							</button>
						</div>
						
						<div class="item-details">
	<div class="detail-row">
		<Icon icon="lucide:ruler" />
		<span>Dimensões</span>
		<span class="detail-value">{item.larguraMm}×{item.alturaMm}mm</span>
		<span class="detail-total">{item.areaPorPecaMm2.toLocaleString('pt-BR')} mm²</span>
	</div>
	
	<div class="detail-row">
		<Icon icon="lucide:package" />
		<span>Quantidade</span>
		<span class="detail-value">{item.quantidade} un</span>
		<span class="detail-total">{item.areaTotal.toLocaleString('pt-BR')} mm²</span>
	</div>
	
	<div class="detail-row">
		<Icon icon="lucide:box" />
		<span>{item.materialNome}</span>
		<span class="detail-value">Material</span>
		<span class="detail-total">R$ {item.materialValor.toFixed(2)}</span>
	</div>
	
	<div class="detail-row">
		<Icon icon="lucide:clock" />
		<span>{item.maquinaNome}</span>
		<span class="detail-value">{item.tempoPorPecaMin}min × {item.quantidade}</span>
		<span class="detail-total">R$ {item.maquinaValor.toFixed(2)}</span>
	</div>
							
							{#if item.pintada}
								<div class="detail-row">
									<Icon icon="lucide:droplet" />
									<span>Pintura</span>
									<span class="detail-value">-</span>
									<span class="detail-total">R$ {item.valorPintura.toFixed(2)}</span>
								</div>
							{/if}
						</div>
						
						<div class="item-footer">
							<span>Subtotal do item:</span>
							<span class="item-total">R$ {item.valorTotal.toFixed(2)}</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
	
	<!-- Coluna Direita: Resumo -->
	<div class="summary-section">
		<h2>Resumo do Orçamento</h2>
		
		<div class="field">
	<label for="cliente">Cliente *</label>
	<ClienteAutocomplete 
		clientes={data.clientes}
		bind:value={clienteSelecionadoId}
		onchange={(id) => clienteSelecionadoId = id}
	/>
	<a href="/clientes" class="link-cadastrar">
		<Icon icon="lucide:user-plus" />
		Cadastrar novo cliente
	</a>
</div>
		
		<!-- Gastos Adicionais -->
		<div class="gastos-section">
			<div class="section-header-small">
				<h3>Gastos Adicionais</h3>
				<button 
					class="btn-add-small" 
					onclick={() => showGastoForm = !showGastoForm}
				>
					<Icon icon={showGastoForm ? 'lucide:minus' : 'lucide:plus'} />
				</button>
			</div>
			
			{#if showGastoForm}
				<div class="gasto-form">
					<div class="field">
						<label for="desc-gasto">Descrição *</label>
						<input 
							type="text" 
							id="desc-gasto"
							bind:value={descricaoGasto}
							placeholder="Ex: Chaveiro"
						/>
					</div>
					<div class="field">
						<label for="valor-gasto">Valor (R$) *</label>
						<input 
							type="number" 
							id="valor-gasto"
							bind:value={valorGasto}
							placeholder="0.00"
							step="0.01"
							min="0"
						/>
					</div>
					<button class="btn-primary btn-small" onclick={adicionarGasto}>
						<Icon icon="lucide:plus" />
						Adicionar
					</button>
				</div>
			{/if}
			
			{#if gastosAdicionais.length > 0}
				<div class="gastos-list">
					{#each gastosAdicionais as gasto}
						<div class="gasto-item">
							<span class="gasto-desc">{gasto.descricao}</span>
							<span class="gasto-valor">R$ {gasto.valor.toFixed(2)}</span>
							<button 
								class="btn-remove-small" 
								onclick={() => removerGasto(gasto.id)}
							>
								<Icon icon="lucide:x" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Cálculos -->
		<div class="calc-card">
			<div class="calc-row">
				<span>Subtotal ({itens.length} {itens.length === 1 ? 'item' : 'itens'}):</span>
				<span class="calc-value">R$ {subtotal.toFixed(2)}</span>
			</div>
			
			{#if totalGastosAdicionais > 0}
				<div class="calc-row">
					<span>Gastos Adicionais:</span>
					<span class="calc-value">R$ {totalGastosAdicionais.toFixed(2)}</span>
				</div>
			{/if}
			
			<div class="calc-row margem">
				<label for="margem">Margem de Lucro (%):</label>
				<input 
					type="number" 
					id="margem"
					bind:value={margemLucro}
					min="0"
					max="200"
					step="1"
				/>
			</div>
			
			<div class="calc-row total">
				<span>Valor Final:</span>
				<span class="calc-value-final">R$ {valorFinal.toFixed(2)}</span>
			</div>
		</div>
		
		<!-- Observações -->
		<div class="field">
			<label for="observacoes">Observações (opcional)</label>
			<textarea 
				id="observacoes"
				bind:value={observacoes}
				placeholder="Ex: Prazo de entrega, condições especiais..."
				rows="4"
			></textarea>
		</div>
		
		<!-- Preview -->
		<div class="preview-card">
			<h3>
				<Icon icon="lucide:eye" />
				Prévia
			</h3>
			<div class="preview-content">
				<p><strong>Cliente:</strong> {clienteSelecionadoId ? data.clientes.find(c => c.id === clienteSelecionadoId)?.nome : '(não selecionado)'}</p>
				<p><strong>Itens:</strong> {itens.length}</p>
				<p><strong>Gastos extras:</strong> {gastosAdicionais.length}</p>
				<p><strong>Valor final:</strong> R$ {valorFinal.toFixed(2)}</p>
			</div>
		</div>
		
		<!-- Salvar -->
		<form 
			method="POST" 
			action="?/criarOrcamento"
			use:enhance={() => {
	if (!clienteSelecionadoId) {
		alert('Selecione um cliente');
		return () => {};
	}

				if (itens.length === 0) {
					alert('Adicione pelo menos 1 item');
					return () => {};
				}
				return async ({ result, update }) => {
					await update();
				};
			}}
		>
			<input type="hidden" name="clienteId" value={clienteSelecionadoId} />
			<input type="hidden" name="descricao" value={observacoes} />
			<input type="hidden" name="itensDetalhados" value={gerarItensJSON()} />
			<input type="hidden" name="subtotal" value={subtotal.toFixed(2)} />
			<input type="hidden" name="margemLucro" value={margemLucro} />
			<input type="hidden" name="gastosAdicionais" value={totalGastosAdicionais.toFixed(2)} />
			<input type="hidden" name="valorFinal" value={valorFinal.toFixed(2)} />
			
			<button 
				type="submit" 
				class="btn-primary btn-large"
				disabled={!clienteSelecionadoId || itens.length === 0}
			>
				<Icon icon="lucide:save" />
				Salvar Orçamento
			</button>
		</form>
	</div>
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
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

.header-actions {
	display: flex;
	gap: 10px;
}

.btn-export {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 16px;
	background: rgba(59, 130, 246, 0.2);
	color: #60a5fa;
	border: 1px solid rgba(59, 130, 246, 0.3);
	border-radius: 7px;
	font-weight: 600;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-export:hover:not(:disabled) {
	background: rgba(59, 130, 246, 0.3);
	border-color: #60a5fa;
}

.btn-export:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-export :global(svg) {
	width: 16px;
	height: 16px;
}

.content-grid {
	display: grid;
	grid-template-columns: 1.2fr 1fr;
	gap: 20px;
}

.form-section, .summary-section {
	background: rgba(50, 50, 50, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 10px;
	padding: 20px;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
}

h2 {
	font-size: 1rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
}

h3 {
	font-size: 0.9rem;
	font-weight: 600;
	color: #f9fafb;
	margin: 0;
	flex: 1;
}

.btn-add-item {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	border-radius: 7px;
	font-weight: 600;
	font-size: 0.85rem;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-add-item:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.4);
}

.btn-add-item :global(svg) {
	width: 14px;
	height: 14px;
}

/* Add Item Form */
.add-item-form {
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 20px;
}

/* Dimensões Row */
.dimensoes-row {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	gap: 12px;
	align-items: end;
	margin-bottom: 14px;
}

.dimensoes-row .field {
	margin-bottom: 0;
}

.multiplicador {
	font-size: 1.5rem;
	font-weight: 700;
	color: #ffbf91;
	padding-bottom: 10px;
}

.info-calculada {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.3);
	border-radius: 6px;
	margin-bottom: 12px;
	font-size: 0.85rem;
	color: #bfdbfe;
}

.info-calculada :global(svg) {
	width: 14px;
	height: 14px;
	color: #60a5fa;
	flex-shrink: 0;
}

.info-calculada strong {
	color: #60a5fa;
}


.field {
	margin-bottom: 14px;
}


label {
	display: block;
	margin-bottom: 6px;
	font-size: 0.85rem;
	font-weight: 500;
	color: #d1d5db;
}

input, select, textarea {
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

input::placeholder, textarea::placeholder {
	color: #6b7280;
	font-size: 0.85rem;
}

input:focus, select:focus, textarea:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.1);
}

textarea {
	resize: vertical;
}

.checkbox-field {
	margin-bottom: 14px;
}

.checkbox-label {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	background: rgba(30, 30, 30, 0.5);
	border-radius: 7px;
	border: 1px solid rgba(255, 191, 145, 0.2);
	cursor: pointer;
	transition: all 0.2s ease;
}

.checkbox-label:hover {
	background: rgba(40, 40, 40, 0.7);
	border-color: #ffbf91;
}

.checkbox-label input[type="checkbox"] {
	width: 18px;
	height: 18px;
	margin: 0;
	accent-color: #ffbf91;
	cursor: pointer;
}

.checkbox-label span {
	color: #e0e0e0;
	font-size: 0.9rem;
}

.valor-preview {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.3);
	border-radius: 6px;
	margin-bottom: 12px;
	font-size: 0.9rem;
	color: #bfdbfe;
}

.valor-preview :global(svg) {
	width: 16px;
	height: 16px;
	color: #60a5fa;
}

/* Buttons */
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
	width: 100%;
}

.btn-primary {
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
}

.btn-primary:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.4);
}

.btn-primary:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-primary.btn-large {
	padding: 14px 20px;
	font-size: 1rem;
	margin-top: 20px;
}

.btn-primary.btn-small {
	padding: 8px 12px;
	font-size: 0.85rem;
}

.btn-secondary {
	background: rgba(60, 60, 60, 0.8);
	color: #e0e0e0;
	border: 1px solid rgba(255, 191, 145, 0.2);
	width: auto;
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

/* Items List */
.itens-list {
	margin-top: 20px;
}

.empty-state-small {
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;
}

.empty-state-small :global(svg) {
	width: 48px;
	height: 48px;
	margin-bottom: 12px;
	opacity: 0.5;
}

.empty-state-small p {
	margin: 0 0 4px 0;
	font-size: 0.9rem;
}

.empty-state-small small {
	font-size: 0.8rem;
	color: #4b5563;
}

.item-card {
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 8px;
	padding: 14px;
	margin-bottom: 12px;
	transition: all 0.2s ease;
}

.item-card:hover {
	border-color: #ffbf91;
	background: rgba(40, 40, 40, 0.7);
}

.item-header {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 12px;
	padding-bottom: 10px;
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
}

.item-numero {
	font-size: 0.75rem;
	font-weight: 700;
	color: #ffbf91;
	background: rgba(255, 191, 145, 0.1);
	padding: 4px 8px;
	border-radius: 4px;
}

.badge-pintada {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	color: #60a5fa;
	background: rgba(59, 130, 246, 0.1);
	padding: 4px 8px;
	border-radius: 4px;
}

.badge-pintada :global(svg) {
	width: 12px;
	height: 12px;
}

.btn-remove {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
}

.btn-remove:hover {
	background: rgba(239, 68, 68, 0.2);
	color: #ef4444;
}

.btn-remove :global(svg) {
	width: 16px;
	height: 16px;
}

.item-details {
	margin-bottom: 10px;
}

.detail-row {
	display: grid;
	grid-template-columns: 20px 1fr auto auto;
	gap: 10px;
	align-items: center;
	padding: 6px 0;
	font-size: 0.85rem;
	color: #d1d5db;
}

.detail-row :global(svg) {
	width: 16px;
	height: 16px;
	color: #9ca3af;
}

.detail-value {
	color: #9ca3af;
	font-size: 0.8rem;
}

.detail-total {
	font-weight: 600;
	color: #4ade80;
}

.item-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 10px;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
	font-size: 0.9rem;
	color: #d1d5db;
}

.item-total {
	font-weight: 700;
	font-size: 1.05rem;
	color: #4ade80;
}

/* Gastos Adicionais */
.gastos-section {
	background: rgba(30, 30, 30, 0.3);
	border: 1px solid rgba(255, 191, 145, 0.1);
	border-radius: 8px;
	padding: 14px;
	margin-bottom: 16px;
}

.section-header-small {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.btn-add-small {
	background: rgba(60, 60, 60, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	color: #ffbf91;
	cursor: pointer;
	padding: 6px;
	border-radius: 6px;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
}

.btn-add-small:hover {
	background: rgba(70, 70, 70, 0.9);
	border-color: #ffbf91;
}

.btn-add-small :global(svg) {
	width: 14px;
	height: 14px;
}

.gasto-form {
	background: rgba(20, 20, 20, 0.5);
	border-radius: 6px;
	padding: 12px;
	margin-bottom: 10px;
}

.gastos-list {
	margin-top: 10px;
}

.gasto-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 8px 10px;
	background: rgba(20, 20, 20, 0.5);
	border-radius: 6px;
	margin-bottom: 6px;
	font-size: 0.85rem;
}

.gasto-desc {
	flex: 1;
	color: #d1d5db;
}

.gasto-valor {
	font-weight: 600;
	color: #4ade80;
}

.btn-remove-small {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 2px;
	border-radius: 4px;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
}

.btn-remove-small:hover {
	background: rgba(239, 68, 68, 0.2);
	color: #ef4444;
}

.btn-remove-small :global(svg) {
	width: 14px;
	height: 14px;
}

/* Calc Card */
.calc-card {
	background: rgba(30, 30, 30, 0.5);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 16px;
}

.calc-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	font-size: 0.9rem;
	color: #d1d5db;
}

.calc-row.margem {
	padding: 12px 0;
	border-top: 1px solid rgba(255, 191, 145, 0.1);
	border-bottom: 1px solid rgba(255, 191, 145, 0.1);
	margin: 8px 0;
}

.calc-row.margem input {
	width: 80px;
	padding: 6px 10px;
	text-align: right;
}

.calc-row.total {
	padding: 12px 0;
	margin-top: 8px;
}

.calc-value {
	font-weight: 600;
	color: #f9fafb;
}

.calc-value-final {
	font-weight: 700;
	font-size: 1.3rem;
	color: #4ade80;
}

/* Preview Card */
.preview-card {
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.3);
	border-radius: 8px;
	padding: 16px;
	margin-top: 16px;
}

.preview-card h3 {
	color: #60a5fa;
	margin: 0 0 12px 0;
	display: flex;
	align-items: center;
	gap: 6px;
}

.preview-card h3 :global(svg) {
	width: 16px;
	height: 16px;
}

.preview-content p {
	margin: 6px 0;
	font-size: 0.9rem;
	color: #bfdbfe;
}

@media (max-width: 1200px) {
	.content-grid {
		grid-template-columns: 1fr;
	}
}

.link-cadastrar {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin-top: 8px;
	color: #60a5fa;
	font-size: 0.85rem;
	text-decoration: none;
	transition: all 0.2s ease;
}

.link-cadastrar:hover {
	color: #93c5fd;
	gap: 8px;
}

.link-cadastrar :global(svg) {
	width: 14px;
	height: 14px;
}
</style>