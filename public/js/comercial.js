let listaLeadsGlobal = [];

// Retorna para a grade e força a atualização limpa dos registros
function voltarParaListaLead() {
    document.getElementById('view-form-lead').classList.add('hidden');
    document.getElementById('view-lista-leads').classList.remove('hidden');
    carregarLeads();
}

// Alimenta a caixa de seleção com os clientes ativos cadastrados no sistema
async function carregarDropdownClientes() {
    try {
        const res = await fetch('/api/clientes');
        const clientes = await res.json();
        const select = document.getElementById('c0_cliente');
        select.innerHTML = '<option value="novo">-- Criar e Vincular Novo Cliente --</option>';
        clientes.forEach(c => {
            if (c.a1_status !== 'Inactive' && c.a1_status !== 'Inativo') {
                select.innerHTML += `<option value="${c.a1_cod}">${c.a1_cod} - ${c.a1_nome}</option>`;
            }
        });
    } catch (e) { console.error("Falha ao sincronizar clientes", e); }
}

// Monitora se o usuário precisa registrar um cliente rápido na esteira
function verificarClienteLead() {
    const select = document.getElementById('c0_cliente').value;
    const divNovo = document.getElementById('area-novo-cliente-lead');
    divNovo.style.display = (select === 'novo') ? 'flex' : 'none';
}

// Configura o formulário respeitando as travas de governança comercial
async function abrirFormularioLead(idLead = null) {
    document.getElementById('view-lista-leads').classList.add('hidden');
    document.getElementById('view-form-lead').classList.remove('hidden');
    
    await carregarDropdownClientes();

    if (!idLead) {
        // Fluxo de Inserção Limpa
        document.getElementById('titulo-form-lead').innerText = "Nova Oportunidade";
        document.getElementById('c0_cod').value = '';
        document.getElementById('c0_titulo').value = '';
        document.getElementById('c0_cliente').value = 'novo';
        document.getElementById('c0_cliente').disabled = false;
        document.getElementById('display_fase_form').value = '1';
        document.getElementById('c0_nome_novo').value = '';
        document.getElementById('c0_fone_novo').value = '';
        verificarClienteLead();
    } else {
        // Fluxo de Edição Controlada
        document.getElementById('titulo-form-lead').innerText = "✏️ Refinar Dados do Lead";
        const lead = listaLeadsGlobal.find(l => l.c0_cod == idLead);
        
        if (lead) {
            document.getElementById('c0_cod').value = lead.c0_cod;
            document.getElementById('c0_titulo').value = lead.c0_titulo;
            document.getElementById('c0_cliente').value = lead.c0_cliente;
            document.getElementById('display_fase_form').value = lead.c0_fase;
            
            // Regra de segurança: Trava a troca de cliente após a criação do lead
            document.getElementById('c0_cliente').disabled = true; 
            document.getElementById('area-novo-cliente-lead').style.display = 'none';
        }
    }
}

function formatarFaseLead(faseNum) {
    switch (faseNum) {
        case 1:
            return "Contato Inicial";
        case 2:
            return "Reunião Agendada";
        case 3:
            return "Em negociação";
        case 4:
            return "Contratos";
        case 5:
            return "Encerrado";
        default:
            return "Fase Desconhecida";
    }
}

function renderizarTabelaLeads(lista) {
    const tbody = document.getElementById('tabela-leads-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 

    lista.forEach(lead => {
        const faseNum = parseInt(lead.c0_fase.charAt(0));
        let bolinhaStatus = '';
        let acoesHtml = '';

        // 1. MAPEAMENTO DE CORES DO STATUS (Legenda de Auditoria)
        if (lead.c0_status === 'Cancelado') {
            bolinhaStatus = `<span style="display:inline-block; width:14px; height:14px; background:#dc3545; border-radius:50%;" title="Cancelado"></span>`;
            acoesHtml = `<span style="color:#dc3545; font-weight:bold; font-size:12px;">🚫 Negócio Cancelado</span>`;
        } else if (lead.c0_status === 'Encerrado' || faseNum === 5) {
            bolinhaStatus = `<span style="display:inline-block; width:14px; height:14px; background:#28a745; border-radius:50%;" title="Encerrado"></span>`;
            acoesHtml = `<span style="color:#28a745; font-weight:bold; font-size:12px;">🎉 Lead Encerrado</span>`;
        } else {
            // Lead Ativo (Aberto)
            bolinhaStatus = `<span style="display:inline-block; width:14px; height:14px; background:#ffc107; border-radius:50%;" title="Ativo"></span>`;
            
            // 2. GERAÇÃO DOS BOTÕES DINÂMICOS DA ESTEIRA AUTOMÁTICA
            let botoesFluxo = '';

            if (faseNum === 1) {
                botoesFluxo += `<button class="btn-action" onclick="abrirFormularioLead(${lead.c0_cod})">✏️ Editar</button>`;
                botoesFluxo += `<button class="btn-action" style="background:#ffc107; color:#333;" onclick="avancarParaReuniao(${lead.c0_cod})">📅 Agendar Reunião</button>`;
            } 
            else if (faseNum === 2) {
                botoesFluxo += `<button class="btn-action" onclick="abrirFormularioLead(${lead.c0_cod})">✏️ Editar</button>`;
                botoesFluxo += `<button class="btn-action" style="background:#17a2b8; color:white;" onclick="irParaOrcamento(${lead.c0_cod})">📝 Orçar Proposta</button>`;
            } 
            else if (faseNum === 3) {
                botoesFluxo += `<button class="btn-action" style="background:#007bff; color:white;" onclick="irParaContrato(${lead.c0_cod})">🤝 Gerar Contrato</button>`;
            } 
            else if (faseNum === 4) {
                botoesFluxo += `<button class="btn-action" style="background:#28a745; color:white;" onclick="confirmarAssinaturaContrato(${lead.c0_cod})">🖋️ Contrato Assinado</button>`;
            }

            // Botão Mestre de Cancelamento: Disponível em qualquer fase ativa
            const botaoCancelar = `<button class="btn-action" style="color:#dc3545; background:none; border:1px solid #dc3545;" onclick="cancelarLeadDefinitivo(${lead.c0_cod})">❌ Cancelar</button>`;
            acoesHtml = `<div style="display:flex; justify-content:flex-end; gap:10px;">${botoesFluxo} ${botaoCancelar}</div>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center; vertical-align:middle;">${bolinhaStatus}</td>
            <td><strong>#LEAD-${String(lead.c0_cod).padStart(4, '0')}</strong></td>
            <td><strong>${lead.a1_nome}</strong></td>
            <td>${lead.c0_titulo}</td>
            <td><span class="badge ${faseNum >= 5 ? 'bg-green' : 'bg-blue'}">${formatarFaseLead(faseNum)}</span></td>
            <td>${acoesHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

// GATILHO DA FASE 1: Registra o agendamento simulado e avança o funil
async function avancarParaReuniao(leadId) {
    if (!confirm("Confirmar agendamento de reunião com o cliente e avançar o Lead para a Fase 2?")) return;
    try {
        const res = await fetch(`/api/leads/${leadId}/agendar-reuniao`, { method: 'PUT' });
        if (res.ok) {
            alert("📅 Reunião agendada virtualmente! O Lead agora encontra-se na Fase 2.");
            carregarLeads();
        }
    } catch(e) { console.error(e); }
}

// GATILHO DA FASE 4: Coleta a assinatura jurídica e encerra com chave de ouro
async function confirmarAssinaturaContrato(leadId) {
    if (!confirm("⚠️ Deseja validar a assinatura do contrato? Esta ação encerrará a oportunidade comercial (Fase 5) e consolidará os status.")) return;
    try {
        const res = await fetch(`/api/leads/${leadId}/finalizar-contrato-assinado`, { method: 'PUT' });
        if (res.ok) {
            alert("🎉 Parabéns! Contrato assinado, negócio fechado e Lead encerrado com sucesso.");
            carregarLeads();
        }
    } catch(e) { console.error(e); }
}

// GATILHO GLOBAL: Interrompe a esteira e altera a cor de auditoria para vermelho
async function cancelarLeadDefinitivo(leadId) {
    if (!confirm("🛑 Tem certeza que deseja cancelar este Lead? Esta operação travará o histórico da oportunidade.")) return;
    try {
        const res = await fetch(`/api/leads/${leadId}/cancelar-lead`, { method: 'PUT' });
        if (res.ok) {
            alert("Lead arquivado com status de Cancelado.");
            carregarLeads();
        }
    } catch(e) { console.error(e); }
}

// Gravação ou atualização física dos dados do Lead
async function salvarLead() {
    const idLead = document.getElementById('c0_cod').value;
    const dados = {
        cliente_id: document.getElementById('c0_cliente').value,
        titulo: document.getElementById('c0_titulo').value,
        data_cad: new Date().toISOString().split('T')[0]
    };

    if (!dados.titulo) return alert("Defina o título da oportunidade!");

    const url = idLead ? `/api/leads/${idLead}` : '/api/leads';
    const metodo = idLead ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        if(res.ok) {
            alert("Registro gravado com sucesso!");
            voltarParaListaLead();
        }
    } catch(e) { console.error(e); }
}

// REDIRECIONADORES DE MÓDULOS (Navegação interna da aplicação)
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

function irParaContrato(leadId) {
    // 1. Navega para a aba de Contratos
    navegarPara('contratos');

    // 2. Aguarda a interface carregar e abre o formulário de Novo Contrato
    setTimeout(() => {
        if (typeof abrirFormularioCto === "function") {
            // Passa 'null' para idContrato (pois é um contrato novo) 
            // e 'leadId' para o leadIdPreSelecionado
            abrirFormularioCto(null, leadId);
        }
    }, 350);
}

// Sincronizadores padrão de tela
async function carregarLeads() {
    try {
        const res = await fetch('/api/leads');
        if(res.ok) {
            listaLeadsGlobal = await res.json();
            filtrarLeads();
        }
    } catch (e) { console.error(e); }
}

function filtrarLeads() {
    const termo = (document.getElementById('input-busca-lead').value || '').toLowerCase();
    const faseFiltro = document.getElementById('filtro-funil').value;
    const filtrados = listaLeadsGlobal.filter(l => {
        const bateuTexto = (l.a1_nome || '').toLowerCase().includes(termo) || (l.c0_titulo || '').toLowerCase().includes(termo);
        const bateuFase = (faseFiltro === 'Todos') ? true : (l.c0_fase === faseFiltro);
        return bateuTexto && bateuFase;
    });
    renderizarTabelaLeads(filtrados);
}