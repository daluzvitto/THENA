let listaContratosGlobal = [];
let orcamentosPendentes = [];

function voltarParaListaCto() {
    document.getElementById('view-form-cto').classList.add('hidden');
    document.getElementById('view-lista-contratos').classList.remove('hidden');
    carregarContratos();
}

function formatarMoedaBR(valor) {
    return (parseFloat(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function abrirFormularioCto(orcamentoIdParaSelecionar = null) {
    document.getElementById('view-lista-contratos').classList.add('hidden');
    document.getElementById('view-form-cto').classList.remove('hidden');
    
    // Reset de campos
    document.getElementById('cto_valor').value = '';
    document.getElementById('cto_texto').value = '';
    document.getElementById('area-minuta').classList.add('hidden');
    document.getElementById('btn-salvar-cto').style.display = 'none';

    try {
        // Busca os orçamentos que podem virar contrato
        const res = await fetch('/api/contratos/orcamentos-pendentes');
        orcamentosPendentes = await res.json();
        
        const select = document.getElementById('cto_orcamento_id');
        select.innerHTML = '<option value="">-- Selecione o Orçamento Aprovado --</option>';
        
        orcamentosPendentes.forEach(o => {
            select.innerHTML += `<option value="${o.c1_numero}">#ORC-${String(o.c1_numero).padStart(4, '0')} - ${o.a1_nome}</option>`;
        });

        // A MÁGICA: Se recebemos um ID de orçamento vindo dos Leads, selecionamos ele agora!
        if (orcamentoIdParaSelecionar && orcamentoIdParaSelecionar !== "null") {
            select.value = orcamentoIdParaSelecionar;
            // Dispara manualmente a função que gera o texto do contrato
            puxarDadosDoOrcamento();
        }

    } catch (e) { console.error("Erro ao preparar contrato:", e); }
}

function puxarDadosDoOrcamento() {
    const idOrc = document.getElementById('cto_orcamento_id').value;
    if (!idOrc) {
        document.getElementById('area-minuta').classList.add('hidden');
        document.getElementById('btn-salvar-cto').style.display = 'none';
        document.getElementById('cto_valor').value = '';
        return;
    }

    const orc = orcamentosPendentes.find(o => o.c1_numero == idOrc);
    if (orc) {
        document.getElementById('cto_valor').value = formatarMoedaBR(orc.c1_valor_total);
        
        // Geração Automática da Minuta
        const dataHoje = new Date().toLocaleDateString('pt-BR');
        const minuta = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ARQUITETURA

CONTRATANTE: ${orc.a1_nome}
CONTRATADO: [NOME DO SEU ESCRITÓRIO]
REF. PROPOSTA: #ORC-${String(orc.c1_numero).padStart(4, '0')} (${orc.c1_titulo || 'Sem Título'})

CLÁUSULA 1 - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de arquitetura constantes no orçamento aprovado, totalizando o valor de R$ ${formatarMoedaBR(orc.c1_valor_total)}.

CLÁUSULA 2 - DO PAGAMENTO
O contratante compromete-se a efetuar o pagamento conforme a seguinte condição acordada: ${orc.c1_cond_pagto || 'A combinar'}.

CLÁUSULA 3 - DAS OBSERVAÇÕES E COMPLEMENTOS
${orc.c1_complemento || 'Sem observações adicionais.'}

E por estarem de acordo, assinam o presente.
Data: ${dataHoje}
`;
        
        document.getElementById('cto_texto').value = minuta;
        document.getElementById('area-minuta').classList.remove('hidden');
        document.getElementById('btn-salvar-cto').style.display = 'block';
    }
}

async function salvarContrato() {
    const idOrc = document.getElementById('cto_orcamento_id').value;
    const orc = orcamentosPendentes.find(o => o.c1_numero == idOrc);
    
    if (!orc) return alert("Erro ao identificar o orçamento.");

    const dados = {
        cliente_id: orc.c1_cliente,
        lead_id: orc.c1_lead,
        orcamento_id: orc.c1_numero,
        valor_final: orc.c1_valor_total,
        texto: document.getElementById('cto_texto').value
    };

    try {
        const res = await fetch('/api/contratos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("✅ Contrato gerado e vinculado com sucesso!\n\nO Orçamento e o Lead foram atualizados no sistema.");
            voltarParaListaCto();
        } else {
            alert("Erro ao gravar contrato.");
        }
    } catch (e) { alert("Erro de comunicação."); }
}

function renderizarTabelaContratos(lista) {
    const tbody = document.getElementById('tabela-contratos-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 
    lista.forEach(cto => {
        const tr = document.createElement('tr');
        const data = new Date(cto.c3_data_geracao).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        tr.innerHTML = `
            <td style="font-weight:bold;">#CTO-${String(cto.c3_numero).padStart(4, '0')}</td>
            <td><strong>${cto.a1_nome}</strong></td>
            <td>${cto.c0_titulo}</td>
            <td style="color:#28a745; font-weight:bold;">R$ ${formatarMoedaBR(cto.c3_valor_final)}</td>
            <td><span class="badge bg-green">${cto.c3_status}</span></td>
            <td>${data}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarContratos() {
    try {
        const res = await fetch('/api/contratos');
        if(res.ok) {
            listaContratosGlobal = await res.json();
            renderizarTabelaContratos(listaContratosGlobal);
        }
    } catch (e) { console.error(e); }
}

function filtrarContratos() {
    const termo = document.getElementById('input-busca-cto').value.toLowerCase();
    const filtrados = listaContratosGlobal.filter(c => 
        (c.a1_nome || '').toLowerCase().includes(termo) || 
        (c.c0_titulo || '').toLowerCase().includes(termo)
    );
    renderizarTabelaContratos(filtrados);
}