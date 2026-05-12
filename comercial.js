let listaLeadsGlobal = [];

function voltarParaListaLead() {
    document.getElementById('view-form-lead').classList.add('hidden');
    document.getElementById('view-lista-leads').classList.remove('hidden');
}

// Quando a tela abre, busca os clientes para colocar na lista suspensa
async function carregarDropdownClientes() {
    try {
        const res = await fetch('/api/clientes');
        const clientes = await res.json();
        
        // REGRA DE NEGÓCIO: Filtra removendo os inativos
        const clientesAtivos = clientes.filter(c => c.a1_status !== 'Inativo');

        const select = document.getElementById('lead_cliente_id');
        select.innerHTML = '<option value="novo">➕ CADASTRAR NOVO CLIENTE...</option>';
        
        clientesAtivos.forEach(c => {
            // VISUAL LIMPO: Mostra apenas o Nome do Cliente
            select.innerHTML += `<option value="${c.a1_cod}">${c.a1_nome}</option>`;
        });
    } catch (e) { console.error("Erro ao carregar clientes."); }
}

function verificarClienteLead() {
    const select = document.getElementById('lead_cliente_id').value;
    const divNovo = document.getElementById('area-novo-cliente-lead');
    
    if (select === 'novo') {
        // Se escolheu NOVO, mostra os dois campos (Nome e Telefone)
        divNovo.style.display = 'flex';
    } else {
        // Se escolheu um cliente existente, esconde os campos e limpa os valores
        divNovo.style.display = 'none';
        document.getElementById('lead_nome').value = '';
        document.getElementById('lead_fone').value = '';
    }
}

function abrirFormularioLead() {
    document.getElementById('view-lista-leads').classList.add('hidden');
    document.getElementById('view-form-lead').classList.remove('hidden');
    
    document.querySelectorAll('#view-form-lead input').forEach(i => i.value = '');
    document.getElementById('lead_fase').value = '1 - Contato Inicial';
    document.getElementById('lead_data_cad').value = new Date().toISOString().split('T')[0];
    
    carregarDropdownClientes();
    verificarClienteLead();
}

async function salvarLead() {
    const dados = {
        data_cad: document.getElementById('lead_data_cad').value,
        cliente_id: document.getElementById('lead_cliente_id').value,
        nome: document.getElementById('lead_nome').value,
        fone: document.getElementById('lead_fone').value.replace(/\D/g, ''),
        titulo: document.getElementById('lead_titulo').value,
        fase: document.getElementById('lead_fase').value
    };

    if (dados.cliente_id === 'novo' && (!dados.nome || !dados.fone)) {
        return alert("Preencha o Nome e o Celular do novo cliente!");
    }
    if (!dados.titulo) return alert("Preencha o Título da Oportunidade!");

    try {
        const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("Oportunidade gerada com sucesso!");
            voltarParaListaLead();
            carregarLeads(); 
        } else {
            alert("Erro ao salvar.");
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function mudarFaseLead(id, novaFase) {
    try {
        await fetch(`/api/leads/${id}/funil`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novaFase: novaFase })
        });
        carregarLeads();
    } catch (erro) { alert("Erro ao atualizar."); }
}

function calcularTemperaturaVirtual(fase) {
    if (!fase) return '❄️ Frio';
    if (fase.includes('1')) return '❄️ Frio';
    if (fase.includes('2') || fase.includes('3')) return '🟡 Morno';
    if (fase.includes('4')) return '🔥 Quente';
    if (fase.includes('5')) return '✅ Aprovado';
    return '❄️ Frio';
}

function irParaOrcamento(leadId) {
    // 1. Navega para a página de orçamentos
    navegarPara('orcamentos');
    
    // 2. Aguarda um momento para o HTML carregar e abre o form com o ID do Lead
    setTimeout(() => {
        if (typeof abrirFormularioOrc === "function") {
            abrirFormularioOrc(null, leadId);
        }
    }, 350);
}

// Função para saltar direto para a geração de contrato (Agora recebendo os DOIS parâmetros)
function irParaContrato(leadId, orcamentoId) {
    // 1. Navega para a aba de Contratos
    navegarPara('contratos');
    
    // 2. Aguarda a interface carregar e abre o formulário de Novo Contrato
    setTimeout(() => {
        if (typeof abrirFormularioCto === "function") {
            // Envia o ID do orçamento para preencher a lista automaticamente
            abrirFormularioCto(orcamentoId);
        }
    }, 350); 
}

function renderizarTabelaLeads(lista) {
    const tbody = document.getElementById('tabela-leads-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 

    lista.forEach(lead => {
        // 1. Calcula a temperatura visual (Frio, Morno, Quente)
        const temp = calcularTemperaturaVirtual(lead.c0_fase);
        
        // 2. Lógica Dinâmica dos Botões de Ação baseada na Fase do Funil
        let botaoAcao = '';
        if (lead.c0_fase.includes('1') || lead.c0_fase.includes('2')) {
            // Fases 1 e 2: Sem ação ainda. Botão desativado visualmente.
            botaoAcao = `<button class="btn-action" disabled style="color: #aaa; border-color: #eee; cursor: not-allowed; background: transparent;" title="Avance para a Fase 3 para liberar">⏳ Aguarde</button>`;
        } else if (lead.c0_fase.includes('3')) {
            // Fase 3: Botão de Orçar liberado (Azul/Ciano)
            botaoAcao = `<button class="btn-action" style="color: #00b4b4; border-color: #00b4b4; font-weight: bold;" onclick="irParaOrcamento(${lead.c0_cod})">📝 Orçar</button>`;
        } else if (lead.c0_fase.includes('4')) {
            // Fase 4: Botão de Contrato liberado (Agora chamando a função em vez do alert)
            botaoAcao = `<button class="btn-action" style="color: #28a745; border-color: #28a745; font-weight: bold; background: #e6f9ed;" onclick="irParaContrato(${lead.c0_cod}, ${lead.c0_orc_aprovado})">🤝 Contrato</button>`;
        }

        // 3. Monta a linha da tabela
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: #777; font-size: 12px;">#${String(lead.c0_cod).padStart(4, '0')}</td>
            <td><strong>${lead.a1_nome}</strong><br><small>${lead.a1_fone || ''}</small></td>
            <td>${lead.c0_titulo}</td>
            <td>
                <select onchange="mudarFaseLead(${lead.c0_cod}, this.value)" class="select-fase">
                    <option value="1 - Contato Inicial" ${lead.c0_fase === '1 - Contato Inicial' ? 'selected' : ''}>1. Contato Inicial</option>
                    <option value="2 - Reunião Agendada" ${lead.c0_fase === '2 - Reunião Agendada' ? 'selected' : ''}>2. Reunião</option>
                    <option value="3 - Proposta" ${lead.c0_fase === '3 - Proposta' ? 'selected' : ''}>3. Proposta</option>
                    <option value="4 - Em Negociação" ${lead.c0_fase === '4 - Em Negociação' ? 'selected' : ''}>4. Negociação</option>
                    <option value="5 - Aprovado" ${lead.c0_fase === '5 - Aprovado' ? 'selected' : ''}>5. Aprovado</option>
                </select>
            </td>
            <td style="font-weight: bold; font-size: 13px;">${temp}</td>
            <td class="actions-cell">
                <button class="btn-action" onclick="abrirFormularioLead(${lead.c0_cod})" title="Editar Oportunidade">✏️</button>
                ${botaoAcao}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarLeads() {
    const res = await fetch('/api/leads');
    if(res.ok) {
        listaLeadsGlobal = await res.json();
        renderizarTabelaLeads(listaLeadsGlobal);
    }
}

function filtrarLeads() {
    const termo = document.getElementById('input-busca-lead').value.toLowerCase();
    const faseSelecionada = document.getElementById('filtro-funil').value;

    const filtrados = listaLeadsGlobal.filter(l => {
        const bateuNome = (l.a1_nome || '').toLowerCase().includes(termo) || (l.c0_titulo || '').toLowerCase().includes(termo);
        const bateuFase = (faseSelecionada === 'Todos') ? true : (l.c0_fase === faseSelecionada);
        return bateuNome && bateuFase;
    });
    
    renderizarTabelaLeads(filtrados);
}