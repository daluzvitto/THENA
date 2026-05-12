// VARIÁVEIS GLOBAIS TA1
let id_edicao_TA1 = null;
let lista_TA1 = [];

// ==========================================
// MÓDULO: TA1 (CLIENTES)
// ==========================================
function voltarListaTA1() {
    document.getElementById('view-form-TA1').classList.add('hidden');
    document.getElementById('view-lista-TA1').classList.remove('hidden');
}

function abrirFormTA1(A1_COD = null) {
    document.getElementById('view-lista-TA1').classList.add('hidden');
    document.getElementById('view-form-TA1').classList.remove('hidden');
    
    const titulo = document.getElementById('titulo-form-TA1');
    id_edicao_TA1 = A1_COD; 

    if (A1_COD) {
        titulo.innerText = "✏️ Editando Cliente";
        const reg = lista_TA1.find(c => c.a1_cod === A1_COD);
        
        document.getElementById('A1_TIPO').value = reg.a1_tipo || 'PF';
        alternarMascara('A1'); 
        
        document.getElementById('A1_NOME').value = reg.a1_nome || '';
        document.getElementById('A1_NREDUZ').value = reg.a1_nreduz || '';
        document.getElementById('A1_CGC').value = reg.a1_cgc || '';
        document.getElementById('A1_FONE').value = reg.a1_fone || '';
        document.getElementById('A1_EMAIL').value = reg.a1_email || '';
        document.getElementById('A1_CEP').value = reg.a1_cep || '';
        document.getElementById('A1_ENDERE').value = reg.a1_endere || '';
        document.getElementById('A1_NUM').value = reg.a1_num || '';
        document.getElementById('A1_BAIRRO').value = reg.a1_bairro || '';
        document.getElementById('A1_CIDADE').value = reg.a1_cidade || '';
        document.getElementById('A1_UF').value = reg.a1_uf || '';
        document.getElementById('A1_CATEG').value = reg.a1_categ || 'Cliente Final';
        document.getElementById('A1_ORIGEM').value = reg.a1_origem || 'Indicação';
        document.getElementById('A1_POTENC').value = reg.a1_potenc || 'B - Médio';
        document.getElementById('A1_OBS').value = reg.a1_obs || '';

        aplicarMascaraDoc(document.getElementById('A1_CGC'), 'A1_TIPO');
        mascaraTelefone(document.getElementById('A1_FONE'));
        mascaraCEP(document.getElementById('A1_CEP'));
    } else {
        titulo.innerText = "Novo Cadastro de Cliente";
        document.querySelectorAll('#view-form-TA1 input, #view-form-TA1 textarea').forEach(i => i.value = '');
        document.getElementById('A1_TIPO').value = 'PF';
        alternarMascara('A1');
    }
}

async function salvarTA1() {
    // Objeto Payload identico as colunas do DB
    const dados_TA1 = {
        A1_TIPO: document.getElementById('A1_TIPO').value,
        A1_NOME: document.getElementById('A1_NOME').value,
        A1_NREDUZ: document.getElementById('A1_NREDUZ').value,
        A1_CGC: document.getElementById('A1_CGC').value.replace(/\D/g, ''),
        A1_FONE: document.getElementById('A1_FONE').value.replace(/\D/g, ''),
        A1_EMAIL: document.getElementById('A1_EMAIL').value,
        A1_CEP: document.getElementById('A1_CEP').value.replace(/\D/g, ''),
        A1_ENDERE: document.getElementById('A1_ENDERE').value,
        A1_NUM: document.getElementById('A1_NUM').value,
        A1_BAIRRO: document.getElementById('A1_BAIRRO').value,
        A1_CIDADE: document.getElementById('A1_CIDADE').value,
        A1_UF: document.getElementById('A1_UF').value,
        A1_CATEG: document.getElementById('A1_CATEG').value,
        A1_ORIGEM: document.getElementById('A1_ORIGEM').value,
        A1_POTENC: document.getElementById('A1_POTENC').value,
        A1_OBS: document.getElementById('A1_OBS').value
    };

    if(!dados_TA1.A1_NOME || !dados_TA1.A1_CGC || !dados_TA1.A1_FONE || !dados_TA1.A1_EMAIL) {
        return alert("Por favor, preencha os campos obrigatórios!");
    }

    try {
        const url = id_edicao_TA1 ? `http://localhost:3000/api/clientes/${id_edicao_TA1}` : 'http://localhost:3000/api/clientes';
        const resposta = await fetch(url, {
            method: id_edicao_TA1 ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados_TA1)
        });

        if (resposta.ok) {
            alert(id_edicao_TA1 ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
            voltarListaTA1();
            carregarTA1(); 
        } else {
            const dadosErro = await resposta.json();
            alert("❌ Bloqueado: " + dadosErro.erro);
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function alternarStatusTA1(A1_COD, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/clientes/${A1_COD}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (resposta.ok) carregarTA1(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTA1(lista) {
    const tbody = document.getElementById('tabela-TA1-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 
    if (lista.length === 0) return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum registo encontrado.</td></tr>';

    lista.forEach(reg => {
        const tr = document.createElement('tr');
        const statusClass = reg.a1_status === 'Ativo' ? 'status-active' : 'status-inactive';
        const btnStatusTexto = reg.a1_status === 'Ativo' ? '🚫 Inativar' : '✅ Ativar';

        tr.innerHTML = `
            <td><strong>${reg.a1_nome}</strong><br><span style="font-size: 11px; color: #777;">${reg.a1_tipo}</span></td>
            <td>${reg.a1_cgc}</td>
            <td>${reg.a1_fone}</td>
            <td><span class="status-badge ${statusClass}">${reg.a1_status}</span></td>
            <td class="actions-cell">
                <button class="btn-action" onclick="abrirFormTA1(${reg.a1_cod})">✏️ Editar</button>
                <button class="btn-action" onclick="alternarStatusTA1(${reg.a1_cod}, '${reg.a1_status}')">${btnStatusTexto}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarTA1() {
    try {
        const res = await fetch('http://localhost:3000/api/clientes');
        if(!res.ok) throw new Error("Erro DB");
        lista_TA1 = await res.json();
        renderizarTA1(lista_TA1);
    } catch (erro) { console.error(erro); }
}

function filtrarTA1() {
    const termoBusca = document.getElementById('input-busca-TA1').value.toLowerCase();
    const termoLimpo = termoBusca.replace(/\D/g, ''); 
    
    const filtrados = lista_TA1.filter(c => {
        const nome = (c.a1_nome || '').toLowerCase();
        const nomeReduzido = (c.a1_nreduz || '').toLowerCase();
        const documento = (c.a1_cgc || '');
        
        return nome.includes(termoBusca) || nomeReduzido.includes(termoBusca) || (termoLimpo.length > 0 && documento.includes(termoLimpo));
    });
    renderizarTA1(filtrados);
}