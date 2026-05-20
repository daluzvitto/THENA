// ==========================================
// VARIÁVEIS GLOBAIS DE MEMÓRIA
// ==========================================
let listaOrcamentosGlobal = [];
let servicosCatalogo = [];
let leadsDisponiveisOrc = [];
let itensTemporarios = []; // 💾 Lista local para manipulação rápida em tela

// ==========================================
// UTILITÁRIOS E MÁSCARAS
// ==========================================
function voltarParaListaOrc() {
    document.getElementById('view-form-orc').classList.add('hidden');
    document.getElementById('view-lista-orcamentos').classList.remove('hidden');
    carregarOrcamentos();
}

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

function formatarStatusOrcamento(status) {
    // Transforma em número caso o banco envie como string ('1' em vez de 1)
    const statusNum = Number(status); 
    
    switch (statusNum) {
        case 1:
            return "Em Negociação";
        case 2:
            return "Aprovado";
        case 3:
            return "Contrato Gerado";
        default:
            return "Indefinido"; // Caso venha algum número diferente ou vazio
    }
}

function formatarBadgeStatus(status) {
    const statusNum = Number(status);
    switch (statusNum) {
        case 1:
            // Amarelo
            return `<span class="badge bg-warning text-dark">Em Negociação</span>`;
        case 2:
            // Verde
            return `<span class="badge bg-success">Aprovado</span>`;
        case 3:
            // Azul ou Roxo
            return `<span class="badge bg-primary">Contrato Gerado</span>`;
        default:
            // Cinza
            return `<span class="badge bg-secondary">Indefinido</span>`;
    }
}
// ==========================================
// PREPARAÇÃO E DROPDOWNS
// ==========================================
async function prepararDropdownsOrc(leadIdParaSelecionar = null) {
    try {
        const resLeads = await fetch('/api/leads');
        leadsDisponiveisOrc = await resLeads.json();
        
        const selectLead = document.getElementById('c1_lead');
        selectLead.innerHTML = '<option value="">-- Selecione a Oportunidade --</option>';

        leadsDisponiveisOrc.forEach(l => {
            // ✨ NOVO ALINHAMENTO: Lista leads na Fase 2 (Momento de orçar) ou o lead dono do orçamento em edição
            if (l.c0_fase === '2 - Reunião Agendada' || l.c0_cod == leadIdParaSelecionar) {
                const selected = l.c0_cod == leadIdParaSelecionar ? 'selected' : '';
                selectLead.innerHTML += `<option value="${l.c0_cod}" ${selected}>${l.c0_cod} - ${l.c0_titulo}</option>`;
            }
        });
        
        await carregarSelectConpagOrcamento();
        await carregarServicosOrc(); 
    } catch (e) { console.error("Erro ao preparar dropdowns:", e); }
}

async function puxarDadosClienteOrc() {
    const leadId = document.getElementById('c1_lead').value;
    const campoNumLead = document.getElementById('display_lead_numero'); 
    const campoCliente = document.getElementById('display_cliente');

    if (!leadId) {
        if(campoNumLead) campoNumLead.value = '';
        if(campoCliente) campoCliente.value = '';
        return;
    }

    try {
        const lead = leadsDisponiveisOrc.find(l => l.c0_cod == leadId);
        if (lead) {
            if(campoNumLead) campoNumLead.value = `#LEAD-${String(lead.c0_cod).padStart(4, '0')}`;
            if(campoCliente) campoCliente.value = `${lead.c0_cliente} - ${lead.a1_nome}`;

            const idOrc = document.getElementById('c1_numero').value;
            if (!idOrc && lead.a1_conpag) {
                document.getElementById('c1_cond_pagto').value = lead.a1_conpag;
            }
        }
    } catch (e) { console.error("Erro ao puxar dados do cliente:", e); }
}

// ==========================================
// GESTÃO DO FORMULÁRIO (NOVO OU EDIÇÃO)
// ==========================================
async function abrirFormularioOrc(idOrcamento = null, leadIdPreSelecionado = null) {
    document.getElementById('view-lista-orcamentos').classList.add('hidden');
    document.getElementById('view-form-orc').classList.remove('hidden');
    
    document.getElementById('display_cliente').value = '';
    if(document.getElementById('display_lead_numero')) document.getElementById('display_lead_numero').value = '';

    let leadIdParaDropdown = leadIdPreSelecionado;
    let orc = null;

    if (idOrcamento) {
        orc = listaOrcamentosGlobal.find(o => Number(o.c1_numero) === Number(idOrcamento));
        if (orc) leadIdParaDropdown = orc.c1_lead;
    }

    await carregarSelectConpagOrcamento();
    await prepararDropdownsOrc(leadIdParaDropdown);

    if (!idOrcamento) {
        // --- NOVO ORÇAMENTO ---
        document.getElementById('titulo-form-orc').innerText = "Nova Proposta Comercial";
        document.getElementById('c1_numero').value = '';
        document.getElementById('c1_titulo').value = '';
        document.getElementById('c1_complemento').value = '';
        document.getElementById('c1_data_emissao').value = new Date().toISOString().split('T')[0];
        document.getElementById('c1_validade').value = '';
        document.getElementById('c1_cond_pagto').value = '';
        document.getElementById('c1_lead').disabled = false;
        
        itensTemporarios = []; 
        renderizarTabelaItensLocal();

        if (leadIdPreSelecionado) {
            document.getElementById('c1_lead').value = leadIdPreSelecionado;
            puxarDadosClienteOrc();
        }
    } else {
        // --- EDIÇÃO DE ORÇAMENTO ---
        document.getElementById('titulo-form-orc').innerText = "✏️ Editando Proposta";
        
        if (orc) {
            document.getElementById('c1_numero').value = orc.c1_numero;
            document.getElementById('c1_lead').value = orc.c1_lead;
            document.getElementById('c1_titulo').value = orc.c1_titulo;
            document.getElementById('c1_complemento').value = orc.c1_complemento || '';
            document.getElementById('c1_data_emissao').value = orc.c1_data_emissao ? orc.c1_data_emissao.split('T')[0] : '';
            document.getElementById('c1_validade').value = orc.c1_validade ? orc.c1_validade.split('T')[0] : '';
            document.getElementById('c1_cond_pagto').value = orc.c1_cond_pagto || '';
            document.getElementById('c1_lead').disabled = true;

            await puxarDadosClienteOrc();
            await buscarItensDoBanco(orc.c1_numero); 
        }
    }
}

// ==========================================
// GRADE DE SERVIÇOS (MEMÓRIA LOCAL)
// ==========================================
async function carregarServicosOrc() {
    try {
        const res = await fetch('/api/servicos');
        servicosCatalogo = await res.json();
        const select = document.getElementById('c2_servico');
        if(!select) return;
        select.innerHTML = '<option value="">-- Selecione o Serviço --</option>';
        servicosCatalogo.forEach(s => {
            if(s.a3_status === 'Ativo') {
                select.innerHTML += `<option value="${s.a3_cod}">${s.a3_cod} - ${s.a3_nome}</option>`;
            }
        });
    } catch (e) { console.error(e); }
}

function sugerirValorServico() {
    const idServico = document.getElementById('c2_servico').value;
    const servico = servicosCatalogo.find(s => s.a3_cod == idServico);
    document.getElementById('c2_valor_unit').value = (servico && servico.a3_valor_base) ? formatarMoedaBR(servico.a3_valor_base) : '';
}

function adicionarItemLocal() {
    const servicoSelect = document.getElementById('c2_servico');
    const servicoId = servicoSelect.value;
    const servicoNome = servicoSelect.options[servicoSelect.selectedIndex].text;
    const descricao = document.getElementById('c2_descricao').value;
    const qtd = parseFloat(document.getElementById('c2_quantidade').value) || 0;
    const vUnit = moedaParaFloat(document.getElementById('c2_valor_unit').value);

    if (!servicoId || qtd <= 0 || vUnit <= 0) return alert("Preencha todos os campos do serviço.");

    itensTemporarios.push({
        c2_servico: servicoId,
        a3_nome: servicoNome.split(' - ')[1] || servicoNome,
        c2_descricao: descricao,
        c2_quantidade: qtd,
        c2_valor_unit: vUnit,
        c2_total_item: qtd * vUnit
    });

    document.getElementById('c2_servico').value = '';
    document.getElementById('c2_descricao').value = '';
    document.getElementById('c2_quantidade').value = '1';
    document.getElementById('c2_valor_unit').value = '';
    
    renderizarTabelaItensLocal();
}

async function buscarItensDoBanco(numOrc) {
    try {
        const res = await fetch(`/api/orcamentos/${numOrc}/itens`);
        itensTemporarios = await res.json(); 
        renderizarTabelaItensLocal();
    } catch (e) { console.error(e); }
}

function removerItemLocal(index) {
    itensTemporarios.splice(index, 1);
    renderizarTabelaItensLocal();
}

function renderizarTabelaItensLocal() {
    const tbody = document.getElementById('tabela-itens-body');
    tbody.innerHTML = '';
    let soma = 0;

    if (itensTemporarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhum serviço adicionado.</td></tr>';
    } else {
        itensTemporarios.forEach((item, index) => {
            soma += parseFloat(item.c2_total_item);
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.c2_servico} - ${item.a3_nome}</strong></td>
                    <td>${item.c2_descricao || '-'}</td>
                    <td style="text-align: center;">${item.c2_quantidade}</td>
                    <td style="text-align: right;">R$ ${formatarMoedaBR(item.c2_valor_unit)}</td>
                    <td style="text-align: right; font-weight:bold; color:#00b4b4;">R$ ${formatarMoedaBR(item.c2_total_item)}</td>
                    <td style="text-align: center;">
                        <button class="btn-action" style="color:red" onclick="removerItemLocal(${index})">❌</button>
                    </td>
                </tr>`;
        });
    }
    document.getElementById('lbl-total-orc').innerText = `R$ ${formatarMoedaBR(soma)}`;
}

// ==========================================
// GRAVAÇÃO COMPLETA DO PACOTE
// ==========================================
async function salvarOrcamentoCompleto() {
    const orcamento = {
        c1_lead: document.getElementById('c1_lead').value,
        c1_titulo: document.getElementById('c1_titulo').value,
        c1_complemento: document.getElementById('c1_complemento').value,
        c1_data_emissao: document.getElementById('c1_data_emissao').value,
        c1_validade: document.getElementById('c1_validade').value,
        c1_cond_pagto: document.getElementById('c1_cond_pagto').value || null,
        itens: itensTemporarios 
    };

    if (!orcamento.c1_lead || !orcamento.c1_titulo) return alert("⚠️ Selecione a Oportunidade e informe o Título.");
    if (itensTemporarios.length === 0) return alert("⚠️ Adicione pelo menos 1 serviço à proposta.");

    const idExistente = document.getElementById('c1_numero').value;
    const metodo = idExistente ? 'PUT' : 'POST';
    const url = idExistente ? `/api/orcamentos/${idExistente}` : '/api/orcamentos';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orcamento)
        });

        if (res.ok) {
            alert("✅ Proposta gravada com sucesso! Este lead avançou para a Fase 3.");
            voltarParaListaOrc();
        } else {
            const err = await res.json();
            alert("❌ Erro ao salvar: " + err.erro);
        }
    } catch (e) { alert("Erro de conexão."); }
}

// ==========================================
// RENDERIZAÇÃO E UTILITÁRIOS DE LISTA
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
            <td>${formatarBadgeStatus(orc.c1_status)}</td>
            <td>
                <button class="btn-action" onclick="abrirFormularioOrc(${orc.c1_numero})">✏️ Editar</button>
                <button class="btn-action" style="color:#f39c12" onclick="gerarPDF()">🖨️ PDF</button>
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

async function carregarSelectConpagOrcamento() {
    const select = document.getElementById('c1_cond_pagto');
    if(!select) return;
    try {
        const res = await fetch('/api/conpag');
        const condicoes = await res.json();
        select.innerHTML = '<option value="">-- Selecione a Condição --</option>';
        condicoes.forEach(c => {
            if(c.a4_status === 'Ativo') {
                const cod = String(c.a4_cod).padStart(3, '0');
                select.innerHTML += `<option value="${c.a4_cod}">${cod} - ${c.a4_nome}</option>`;
            }
        });
    } catch (e) { console.error(e); }
}

function gerarPDF() {
    alert("Layout do PDF será integrado nas próximas etapas.");
}