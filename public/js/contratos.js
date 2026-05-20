// public/js/contratos.js
let listaContratosGlobal = [];
let orcamentosDisponiveisCto = []; // Lista temporária na memória do navegador

function voltarParaListaCto() {
    document.getElementById('view-form-cto').classList.add('hidden');
    document.getElementById('view-lista-contratos').classList.remove('hidden');
    carregarContratos();
}

function formatarMoedaBR(valor) {
    return (parseFloat(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moedaParaFloat(v) { 
    return v ? parseFloat(v.replace(/\./g, '').replace(',', '.')) : 0;
}

// Carrega os orçamentos elegíveis
async function prepararDropdownsCto(leadIdRecebido = null) {
    try {
        const res = await fetch('/api/contratos/orcamentos-pendentes');
        orcamentosDisponiveisCto = await res.json();
        
        const select = document.getElementById('c3_orcamento');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Selecione o Orçamento --</option>';
        let idOrcamentoAuto = null;

        orcamentosDisponiveisCto.forEach(orc => {
            select.innerHTML += `<option value="${orc.c1_numero}">${orc.c1_numero} - ${orc.c1_titulo} (Lead #${orc.c1_lead})</option>`;
            
            // Se a navegação partiu de um Lead, acha automaticamente o orçamento associado
            if (leadIdRecebido && orc.c1_lead == leadIdRecebido) {
                idOrcamentoAuto = orc.c1_numero;
            }
        });

        if (idOrcamentoAuto) {
            select.value = idOrcamentoAuto;
            // Opcional: select.disabled = true se quiser travar para o operador não trocar
        } else {
            select.disabled = false;
            select.value = "";
        }

        // ✨ GATILHO AUTOMÁTICO: Força o preenchimento da tela logo após carregar e selecionar
        puxarDadosDoOrcamento();

    } catch (e) { 
        console.error("Erro ao preparar dropdown de orçamentos:", e);
    }
}

function puxarDadosDoOrcamento() {
    const selectElement = document.getElementById('c3_orcamento');
    if (!selectElement) return;
    const idOrc = selectElement.value;

    if (!idOrc) {
        document.getElementById('display_lead').value = '';
        document.getElementById('display_cliente').value = '';
        document.getElementById('display_documento').value = '';
        document.getElementById('display_cond_pagto').value = '';
        document.getElementById('display_valor').value = '';
        document.getElementById('c3_texto').value = '';
        if(document.getElementById('hidden_c3_lead')) document.getElementById('hidden_c3_lead').value = '';
        if(document.getElementById('hidden_c3_cliente')) document.getElementById('hidden_c3_cliente').value = '';
        return;
    }

    // Procura na lista local carregada pelo dropdown
    const orc = orcamentosDisponiveisCto.find(o => o.c1_numero == idOrc);
    
    if (orc) {
        // Vincula as chaves ocultas para envio no POST de salvamento
        if(document.getElementById('hidden_c3_lead')) document.getElementById('hidden_c3_lead').value = orc.c1_lead;
        if(document.getElementById('hidden_c3_cliente')) document.getElementById('hidden_c3_cliente').value = orc.c1_cliente;

        // Preenche os displays de conferência visual
        document.getElementById('display_lead').value = `#LEAD-${String(orc.c1_lead).padStart(4, '0')}`;
        document.getElementById('display_cliente').value = `${orc.c1_cliente} - ${orc.a1_nome}`;
        document.getElementById('display_documento').value = orc.a1_cgc || 'Não informado';
        
        // Tratamento mais robusto para a condição de pagamento
        const condPagtoDisplay = orc.condpag_nome ? `${orc.c1_cond_pagto} - ${orc.condpag_nome}` : (orc.c1_cond_pagto ? `${orc.c1_cond_pagto} - Registrada` : 'Não informada');
        document.getElementById('display_cond_pagto').value = condPagtoDisplay;
        
        document.getElementById('display_valor').value = `R$ ${formatarMoedaBR(orc.c1_valor_total)}`;
        
        // Desenha a minuta contratual padrão apenas se o campo estiver vazio (evita sobrescrever em edições)
        if (!document.getElementById('c3_numero').value) {
            const modeloMinuta = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ARQUITETURA\n\n` +
                `CONTRATANTE: ${orc.a1_nome}, inscrito(a) sob o CPF/CNPJ número ${orc.a1_cgc || '____________'}.\n` +
                `OBJETO DE PROJETO: ${orc.c1_titulo}.\n` +
                `VALOR DO CONTRATO: R$ ${formatarMoedaBR(orc.c1_valor_total)}.\n` +
                `FORMA DE LIQUIDAÇÃO: ${orc.condpag_nome || 'Conforme acordado'}.\n\n` +
                `As partes assinam este documento eletrônico para validade jurídica...`;
            document.getElementById('c3_texto').value = modeloMinuta;
        }
    }
}

// Inicializa a abertura do formulário
async function abrirFormularioCto(idContrato = null, leadIdPreSelecionado = null) {
    document.getElementById('view-lista-contratos').classList.add('hidden');
    document.getElementById('view-form-cto').classList.remove('hidden');

    // Limpeza de cache de tela
    document.getElementById('c3_numero').value = '';
    document.getElementById('c3_texto').value = '';
    document.getElementById('c3_texto').disabled = false;
    document.getElementById('btn-salvar-cto').style.display = 'block';

    if (!idContrato) {
        document.getElementById('titulo-form-cto').innerText = "Geração de Novo Contrato";
        // Passa o ID do Lead para a função preparar os dropdowns e auto-selecionar
        await prepararDropdownsCto(leadIdPreSelecionado);
    } else {
        document.getElementById('titulo-form-cto').innerText = "Visualização de Contrato Salvo";
        const cto = listaContratosGlobal.find(c => c.c3_numero == idContrato);
        if (cto) {
            document.getElementById('c3_numero').value = cto.c3_numero;
            document.getElementById('c3_orcamento').innerHTML = `<option value="${cto.c3_orcamento}">${cto.c3_orcamento} - Contrato Salvo</option>`;
            document.getElementById('c3_orcamento').disabled = true;

            document.getElementById('display_lead').value = `#LEAD-${String(cto.c3_lead).padStart(4, '0')}`;
            document.getElementById('display_cliente').value = cto.a1_nome;
            document.getElementById('display_valor').value = `R$ ${formatarMoedaBR(cto.c3_valor_final)}`;
            document.getElementById('c3_texto').value = cto.c3_texto || '';
            document.getElementById('c3_texto').disabled = true;
            document.getElementById('btn-salvar-cto').style.display = 'none';
        }
    }
}

async function salvarContrato() {
    const idOrc = document.getElementById('c3_orcamento').value;
    if (!idOrc) return alert("Selecione um orçamento base.");

    const dados = {
        c3_lead: document.getElementById('hidden_c3_lead').value,
        c3_cliente: document.getElementById('hidden_c3_cliente').value,
        c3_orcamento: idOrc,
        c3_valor_final: moedaParaFloat(document.getElementById('display_valor').value.replace('R$ ', '')),
        c3_texto: document.getElementById('c3_texto').value
    };
    try {
        const res = await fetch('/api/contratos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            // Ajustado para refletir a fase correta na esteira comercial
            alert("✅ Contrato salvo com sucesso! O Lead avançou para a Fase 4 (Contratos).");
            voltarParaListaCto();
        } else {
            const err = await res.json();
            alert("Erro ao gravar contrato: " + err.erro);
        }
    } catch (e) { 
        alert("Falha ao salvar contrato.");
    }
}

async function carregarContratos() {
    try {
        const res = await fetch('/api/contratos');
        if (res.ok) {
            listaContratosGlobal = await res.json();
            renderizarTabelaContratos(listaContratosGlobal);
        }
    } catch (e) { console.error(e); }
}

function renderizarTabelaContratos(lista) {
    const tbody = document.getElementById('tabela-contratos-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    lista.forEach(cto => {
        const data = new Date(cto.c3_data_geracao).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold;">#CTO-${String(cto.c3_numero).padStart(4, '0')}</td>
            <td><strong>${cto.a1_nome}</strong></td>
            <td>${cto.c0_titulo || '-'}</td>
            <td style="color:#28a745; font-weight:bold;">R$ ${formatarMoedaBR(cto.c3_valor_final)}</td>
            <td><span class="badge bg-green">${cto.c3_status}</span></td>
            <td>${data}</td>
            <td><button class="btn-action" onclick="abrirFormularioCto(${cto.c3_numero})">🔍 Ver</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function imprimirContrato() { alert("Impressão em PDF será configurada futuramente."); }