// VARIÁVEIS GLOBAIS TA3
let id_edicao_TA3 = null;
let lista_TA3 = [];

// ==========================================
// MÓDULO: TA3 (SERVIÇOS)
// ==========================================

function voltarListaTA3() {
    document.getElementById('view-form-TA3').classList.add('hidden');
    document.getElementById('view-lista-TA3').classList.remove('hidden');
}

function abrirFormTA3(A3_COD = null) {
    document.getElementById('view-lista-TA3').classList.add('hidden');
    document.getElementById('view-form-TA3').classList.remove('hidden');
    
    id_edicao_TA3 = A3_COD; 
    const titulo = document.getElementById('titulo-form-TA3');

    if (A3_COD) {
        titulo.innerText = "✏️ Editando Serviço";
        const srv = lista_TA3.find(s => s.a3_cod === A3_COD);
        document.getElementById('A3_NOME').value = srv.a3_nome || '';
        document.getElementById('A3_DESCRIC').value = srv.a3_descric || '';
        document.getElementById('A3_UNIDADE').value = srv.a3_unidade || 'Projeto';
        document.getElementById('A3_VALOR_BASE').value = srv.a3_valor_base || '';
    } else {
        titulo.innerText = "Novo Serviço";
        document.querySelectorAll('#view-form-TA3 input, #view-form-TA3 textarea').forEach(i => i.value = '');
        document.getElementById('A3_UNIDADE').value = 'Projeto';
    }
}

async function salvarTA3() {
    const dados_TA3 = {
        A3_NOME: document.getElementById('A3_NOME').value,
        A3_DESCRIC: document.getElementById('A3_DESCRIC').value,
        A3_UNIDADE: document.getElementById('A3_UNIDADE').value,
        A3_VALOR_BASE: document.getElementById('A3_VALOR_BASE').value || 0
    };

    if(!dados_TA3.A3_NOME) return alert("Preencha o Nome do Serviço!");

    try {
        const url = id_edicao_TA3 ? `http://localhost:3000/api/servicos/${id_edicao_TA3}` : 'http://localhost:3000/api/servicos';
        const res = await fetch(url, {
            method: id_edicao_TA3 ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados_TA3)
        });

        if (res.ok) {
            alert("Salvo com sucesso!");
            voltarListaTA3();
            carregarTA3(); 
        } else {
            alert("Erro ao salvar.");
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function alternarStatusTA3(A3_COD, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const res = await fetch(`http://localhost:3000/api/servicos/${A3_COD}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (res.ok) carregarTA3(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTA3(lista) {
    const tbody = document.getElementById('tabela-TA3-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 
    if (lista.length === 0) return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum serviço cadastrado.</td></tr>';

    lista.forEach(srv => {
        const tr = document.createElement('tr');
        const statusClass = srv.a3_status === 'Ativo' ? 'status-active' : 'status-inactive';
        tr.innerHTML = `
            <td><strong>${srv.a3_nome}</strong></td>
            <td>${srv.a3_unidade}</td>
            <td>R$ ${parseFloat(srv.a3_valor_base).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td><span class="status-badge ${statusClass}">${srv.a3_status}</span></td>
            <td class="actions-cell">
                <button class="btn-action" onclick="abrirFormTA3(${srv.a3_cod})">✏️ Editar</button>
                <button class="btn-action" onclick="alternarStatusTA3(${srv.a3_cod}, '${srv.a3_status}')">⇄ Status</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarTA3() {
    try {
        const res = await fetch('http://localhost:3000/api/servicos');
        if(res.ok) {
            lista_TA3 = await res.json();
            renderizarTA3(lista_TA3);
        }
    } catch (erro) { console.error(erro); }
}

function filtrarTA3() {
    const termo = document.getElementById('input-busca-TA3').value.toLowerCase();
    const filtrados = lista_TA3.filter(s => (s.a3_nome || '').toLowerCase().includes(termo));
    renderizarTA3(filtrados);
}