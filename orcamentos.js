let listaOrcamentosGlobal = [];
let servicosCatalogo = [];

function voltarParaListaOrc() {
    document.getElementById('view-form-orc').classList.add('hidden');
    document.getElementById('view-lista-orcamentos').classList.remove('hidden');
    carregarOrcamentos();
}

// ==========================================
// MÁSCARAS E AUXILIARES
// ==========================================
function mascaraMoeda(i) {
    let v = i.value.replace(/\D/g,'');
    v = (v/100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
    i.value = v;
}

function moedaParaFloat(v) {
    if(!v) return 0;
    return parseFloat(v.replace(/\./g, '').replace(',', '.'));
}

function formatarMoedaBR(valor) {
    return (parseFloat(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==========================================
// CARREGAMENTO E EDICÃO
// ==========================================
async function prepararDropdownsOrc(leadIdParaSelecionar = null, callback = null) {
    try {
        // 1. Busca os Leads
        const resLeads = await fetch('/api/leads');
        const leads = await resLeads.json();
        const selectLead = document.getElementById('orc_lead_id');
        
        selectLead.innerHTML = '<option value="">-- Selecione a Oportunidade --</option>';
        leads.forEach(l => {
            const option = document.createElement('option');
            option.value = l.c0_cod;
            option.text = `${l.a1_nome} - ${l.c0_titulo}`;
            option.setAttribute('data-cliente', l.c0_cliente);
            option.setAttribute('data-doc', l.a1_cgc || ''); // Garante que o documento vá para o atributo
            selectLead.appendChild(option);
        });

        // 2. Se veio um ID da tela de Leads, seleciona e FORÇA a atualização do documento
        if (leadIdParaSelecionar) {
            selectLead.value = leadIdParaSelecionar;
            // ESSA É A LINHA CHAVE: Como o JS não dispara o 'onchange', chamamos a função na mão
            puxarDadosClienteOrc(); 
        }

        // 3. Busca o Catálogo de Serviços
        const resServs = await fetch('/api/servicos');
        servicosCatalogo = await resServs.json();
        const selectServ = document.getElementById('item_servico_id');
        selectServ.innerHTML = '<option value="">-- Selecione o Serviço --</option>';
        servicosCatalogo.forEach(s => {
            selectServ.innerHTML += `<option value="${s.a3_cod}" data-valor="${s.a3_valor_base}">${s.a3_nome}</option>`;
        });

        if(callback) callback(); 
    } catch (e) { console.error("Erro ao preparar a tela de orçamento:", e); }
}

function puxarDadosClienteOrc() {
    const select = document.getElementById('orc_lead_id');
    const opt = select.options[select.selectedIndex];
    const inputDoc = document.getElementById('info_cliente_doc');
    if (opt && opt.value !== "") {
        const doc = opt.getAttribute('data-doc');
        inputDoc.value = (doc && doc !== "null") ? doc : "⚠️ PENDENTE";
        inputDoc.style.color = (doc && doc !== "null") ? "green" : "red";
    } else {
        inputDoc.value = "";
    }
}

async function abrirFormularioOrc(idOrcamento = null, leadIdPreSelecionado = null) {
    document.getElementById('view-lista-orcamentos').classList.add('hidden');
    document.getElementById('view-form-orc').classList.remove('hidden');
    
    // Limpeza de campos
    document.getElementById('orc_numero').value = idOrcamento || '';
    document.getElementById('btn-imprimir-pdf').style.display = idOrcamento ? 'block' : 'none';
    
    if (!idOrcamento) {
        // MODO NOVO ORÇAMENTO
        document.getElementById('titulo-form-orc').innerText = "Nova Proposta Comercial";
        document.querySelectorAll('#view-form-orc input:not([readonly]), #view-form-orc textarea').forEach(i => i.value = '');
        document.getElementById('orc_data_emissao').value = new Date().toISOString().split('T')[0];
        document.getElementById('area-itens-orc').classList.add('hidden');
        document.getElementById('btn-salvar-cabecalho').classList.remove('hidden');
        document.getElementById('orc_lead_id').disabled = false;

        // Chama a preparação passando o Lead que veio da outra tela
        await prepararDropdownsOrc(leadIdPreSelecionado);
    } else {
            document.getElementById('orc_titulo').value = orc.c1_titulo || '';
            document.getElementById('orc_complemento').value = orc.c1_complemento || '';
            document.getElementById('orc_data_emissao').value = orc.c1_data_emissao.split('T')[0];
            document.getElementById('orc_validade').value = orc.c1_validade ? orc.c1_validade.split('T')[0] : '';
            document.getElementById('orc_cond_pagto').value = orc.c1_cond_pagto || '';
            puxarDadosClienteOrc();
            carregarItensDoOrcamento(idOrcamento);
        };
    
}

// ==========================================
// SALVAMENTO E ITENS
// ==========================================
async function salvarCabecalhoOrc() {
    const idOrc = document.getElementById('orc_numero').value;
    const selectLead = document.getElementById('orc_lead_id');
    const dados = {
        lead_id: selectLead.value,
        cliente_id: selectLead.options[selectLead.selectedIndex].getAttribute('data-cliente'),
        titulo: document.getElementById('orc_titulo').value,
        complemento: document.getElementById('orc_complemento').value,
        data_emissao: document.getElementById('orc_data_emissao').value,
        validade: document.getElementById('orc_validade').value || null,
        cond_pagto: document.getElementById('orc_cond_pagto').value
    };

    if(!dados.titulo || !dados.lead_id) return alert("Preencha Título e Lead!");

    try {
        const url = idOrc ? `/api/orcamentos/${idOrc}` : '/api/orcamentos';
        const metodo = idOrc ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            const orcSalvo = await res.json();
            document.getElementById('orc_numero').value = orcSalvo.c1_numero;
            document.getElementById('btn-salvar-cabecalho').classList.add('hidden');
            document.getElementById('area-itens-orc').classList.remove('hidden');
            document.getElementById('orc_lead_id').disabled = true;
            document.getElementById('btn-imprimir-pdf').style.display = 'block';
            alert("Informações do orçamento guardadas!");
        }
    } catch (e) { alert("Erro ao salvar."); }
}

async function adicionarItemOrc() {
    const numOrc = document.getElementById('orc_numero').value;
    const dados = {
        servico_id: document.getElementById('item_servico_id').value,
        quantidade: document.getElementById('item_qtd').value,
        valor_unit: moedaParaFloat(document.getElementById('item_valor').value),
        obs: document.getElementById('item_obs').value
    };
    if (!dados.servico_id || !dados.valor_unit) return alert("Preencha Serviço e Valor!");

    const res = await fetch(`/api/orcamentos/${numOrc}/itens`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });

    if(res.ok) {
        document.getElementById('item_obs').value = '';
        document.getElementById('item_valor').value = '';
        carregarItensDoOrcamento(numOrc);
    }
}

async function carregarItensDoOrcamento(numOrc) {
    const res = await fetch(`/api/orcamentos/${numOrc}/itens`);
    const itens = await res.json();
    const tbody = document.getElementById('tabela-itens-body');
    tbody.innerHTML = '';
    let soma = 0;
    itens.forEach(i => {
        soma += parseFloat(i.c2_total_item);
        tbody.innerHTML += `
            <tr>
                <td><strong>${i.a3_nome}</strong></td>
                <td>${i.c2_obs || '-'}</td>
                <td>${i.c2_quantidade}</td>
                <td>R$ ${formatarMoedaBR(i.c2_valor_unit)}</td>
                <td style="font-weight:bold;">R$ ${formatarMoedaBR(i.c2_total_item)}</td>
                <td><button class="btn-action" style="color:red" onclick="deletarItemOrc(${numOrc}, ${i.c2_item})">🗑️</button></td>
            </tr>`;
    });
    document.getElementById('lbl-total-orc').innerText = `R$ ${formatarMoedaBR(soma)}`;
}

async function deletarItemOrc(numOrc, idItem) {
    if(!confirm("Excluir item?")) return;
    await fetch(`/api/orcamentos/${numOrc}/itens/${idItem}`, { method: 'DELETE' });
    carregarItensDoOrcamento(numOrc);
}

function finalizarOrcamento() {
    // Como a edição agora salva o cabeçalho via PUT, finalizar apenas volta para a lista
    alert("Orçamento atualizado e finalizado com sucesso!");
    voltarParaListaOrc();
}

function gerarPDF() {
    const id = document.getElementById('orc_numero').value;
    alert(`Solicitação enviada para gerar PDF do Orçamento #${id}.\n\n(A rotina de layout será configurada na próxima etapa!)`);
}

// ==========================================
// LISTAGEM PRINCIPAL
// ==========================================
function renderizarTabelaOrcamentos(lista) {
    const tbody = document.getElementById('tabela-orcamentos-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 
    lista.forEach(orc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#ORC-${String(orc.c1_numero).padStart(4, '0')}</td>
            <td><strong>${orc.a1_nome}</strong></td>
            <td>${orc.c1_titulo || '-'}</td>
            <td style="font-weight:bold; color:#00b4b4;">R$ ${formatarMoedaBR(orc.c1_valor_total)}</td>
            <td><span class="badge bg-blue">${orc.c1_status}</span></td>
            <td>
                <button class="btn-action" onclick="abrirFormularioOrc(${orc.c1_numero})">✏️ Editar</button>
                <button class="btn-action" style="color:#f39c12" onclick="abrirFormularioOrc(${orc.c1_numero})">🖨️ PDF</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function carregarOrcamentos() {
    const res = await fetch('/api/orcamentos');
    if(res.ok) {
        listaOrcamentosGlobal = await res.json();
        renderizarTabelaOrcamentos(listaOrcamentosGlobal);
    }
}