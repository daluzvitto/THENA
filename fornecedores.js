// VARIÁVEIS GLOBAIS TA2
let id_edicao_TA2 = null;
let lista_TA2 = [];

// ==========================================
// MÓDULO: TA2 (FORNECEDORES)
// ==========================================
function voltarListaTA2() {
    document.getElementById('view-form-TA2').classList.add('hidden');
    document.getElementById('view-lista-TA2').classList.remove('hidden');
}

function abrirFormTA2(A2_COD = null) {
    document.getElementById('view-lista-TA2').classList.add('hidden');
    document.getElementById('view-form-TA2').classList.remove('hidden');
    
    const titulo = document.getElementById('titulo-form-TA2');
    id_edicao_TA2 = A2_COD; 

    if (A2_COD) {
        titulo.innerText = "✏️ Editando Fornecedor";
        const forn = lista_TA2.find(f => f.a2_cod === A2_COD);
        
        document.getElementById('A2_TIPO').value = forn.a2_tipo || 'PJ';
        alternarMascara('A2'); 
        
        document.getElementById('A2_NOME').value = forn.a2_nome || '';
        document.getElementById('A2_NREDUZ').value = forn.a2_nreduz || '';
        document.getElementById('A2_CGC').value = forn.a2_cgc || '';
        document.getElementById('A2_FONE').value = forn.a2_fone || '';
        document.getElementById('A2_EMAIL').value = forn.a2_email || '';
        document.getElementById('A2_CEP').value = forn.a2_cep || '';
        document.getElementById('A2_ENDERE').value = forn.a2_endere || '';
        document.getElementById('A2_NUM').value = forn.a2_num || '';
        document.getElementById('A2_BAIRRO').value = forn.a2_bairro || '';
        document.getElementById('A2_CIDADE').value = forn.a2_cidade || '';
        document.getElementById('A2_UF').value = forn.a2_uf || '';
        document.getElementById('A2_CATEG').value = forn.a2_categ || 'Material';
        document.getElementById('A2_BANCO').value = forn.a2_banco || '';
        document.getElementById('A2_AGENCIA').value = forn.a2_agencia || '';
        document.getElementById('A2_CONTA').value = forn.a2_conta || '';
        document.getElementById('A2_OBS').value = forn.a2_obs || '';

        aplicarMascaraDoc(document.getElementById('A2_CGC'), 'A2_TIPO');
        mascaraTelefone(document.getElementById('A2_FONE'));
        mascaraCEP(document.getElementById('A2_CEP'));
    } else {
        titulo.innerText = "Novo Cadastro de Fornecedor";
        document.querySelectorAll('#view-form-TA2 input, #view-form-TA2 textarea').forEach(i => i.value = '');
        document.getElementById('A2_TIPO').value = 'PJ';
        alternarMascara('A2');
    }
}

async function salvarTA2() {
    const dados_TA2 = {
        A2_TIPO: document.getElementById('A2_TIPO').value,
        A2_NOME: document.getElementById('A2_NOME').value,
        A2_NREDUZ: document.getElementById('A2_NREDUZ').value,
        A2_CGC: document.getElementById('A2_CGC').value.replace(/\D/g, ''),
        A2_FONE: document.getElementById('A2_FONE').value.replace(/\D/g, ''),
        A2_EMAIL: document.getElementById('A2_EMAIL').value,
        A2_CEP: document.getElementById('A2_CEP').value.replace(/\D/g, ''),
        A2_ENDERE: document.getElementById('A2_ENDERE').value,
        A2_NUM: document.getElementById('A2_NUM').value,
        A2_BAIRRO: document.getElementById('A2_BAIRRO').value,
        A2_CIDADE: document.getElementById('A2_CIDADE').value,
        A2_UF: document.getElementById('A2_UF').value,
        A2_CATEG: document.getElementById('A2_CATEG').value,
        A2_BANCO: document.getElementById('A2_BANCO').value,
        A2_AGENCIA: document.getElementById('A2_AGENCIA').value,
        A2_CONTA: document.getElementById('A2_CONTA').value,
        A2_OBS: document.getElementById('A2_OBS').value
    };

    if(!dados_TA2.A2_NOME || !dados_TA2.A2_CGC || !dados_TA2.A2_FONE || !dados_TA2.A2_EMAIL) {
        return alert("Por favor, preencha os campos obrigatórios!");
    }

    try {
        const url = id_edicao_TA2 ? `http://localhost:3000/api/fornecedores/${id_edicao_TA2}` : 'http://localhost:3000/api/fornecedores';
        const resposta = await fetch(url, {
            method: id_edicao_TA2 ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados_TA2)
        });

        if (resposta.ok) {
            alert(id_edicao_TA2 ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
            voltarListaTA2();
            carregarTA2(); 
        } else {
            const dadosErro = await resposta.json();
            alert("❌ Bloqueado: " + dadosErro.erro);
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function alternarStatusTA2(A2_COD, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/fornecedores/${A2_COD}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (resposta.ok) carregarTA2(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTA2(lista) {
    const tbody = document.getElementById('tabela-TA2-body');
    if(!tbody) return; 
    tbody.innerHTML = ''; 
    if (lista.length === 0) return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum fornecedor encontrado.</td></tr>';

    lista.forEach(forn => {
        const tr = document.createElement('tr');
        const statusClass = forn.a2_status === 'Ativo' ? 'status-active' : 'status-inactive';
        const btnStatusTexto = forn.a2_status === 'Ativo' ? '🚫 Inativar' : '✅ Ativar';

        tr.innerHTML = `
            <td><strong>${forn.a2_nome}</strong><br><span style="font-size: 11px; color: #777;">${forn.a2_categ}</span></td>
            <td>${forn.a2_cgc}</td>
            <td>${forn.a2_fone}</td>
            <td><span class="status-badge ${statusClass}">${forn.a2_status}</span></td>
            <td class="actions-cell">
                <button class="btn-action" onclick="abrirFormTA2(${forn.a2_cod})">✏️ Editar</button>
                <button class="btn-action" onclick="alternarStatusTA2(${forn.a2_cod}, '${forn.a2_status}')">${btnStatusTexto}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarTA2() {
    try {
        const res = await fetch('http://localhost:3000/api/fornecedores');
        if(!res.ok) throw new Error("Erro DB");
        lista_TA2 = await res.json();
        renderizarTA2(lista_TA2);
    } catch (erro) { console.error(erro); }
}

function filtrarTA2() {
    const termoBusca = document.getElementById('input-busca-TA2').value.toLowerCase();
    const termoLimpo = termoBusca.replace(/\D/g, ''); 
    
    const filtrados = lista_TA2.filter(f => {
        const nome = (f.a2_nome || '').toLowerCase();
        const nomeReduzido = (f.a2_nreduz || '').toLowerCase();
        const documento = (f.a2_cgc || '');
        
        return nome.includes(termoBusca) || nomeReduzido.includes(termoBusca) || (termoLimpo.length > 0 && documento.includes(termoLimpo));
    });
    renderizarTA2(filtrados);
}