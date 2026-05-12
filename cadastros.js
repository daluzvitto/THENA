// VARIÁVEIS GLOBAIS
let idClienteEmEdicao = null;
let listaClientesGlobal = [];
let idFornecedorEmEdicao = null;
let listaFornecedoresGlobal = [];
let idServicoEmEdicao = null;
let listaServicosGlobal = [];

// ==========================================
// FUNÇÕES GENÉRICAS (MÁSCARAS E ABAS)
// ==========================================
function switchTab(modulo, tabId, clickedElement) {
    const formCard = clickedElement.closest('.form-card');
    formCard.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
    formCard.querySelectorAll('.form-body').forEach(b => b.classList.remove('active'));
    clickedElement.classList.add('active');
    document.getElementById(modulo + '-' + tabId).classList.add('active');
}

function alternarMascara(prefixo) {
    const tipo = document.getElementById(prefixo + '_tipo').value;
    const lblDoc = document.getElementById(prefixo + '_lblDocumento');
    const inputDoc = document.getElementById(prefixo + '_cgc');
    inputDoc.value = ''; 

    if (tipo === 'PF') {
        lblDoc.innerText = 'CPF *';
        inputDoc.setAttribute('maxlength', '14');
    } else {
        lblDoc.innerText = 'CNPJ *';
        inputDoc.setAttribute('maxlength', '18');
    }
}

function aplicarMascaraDoc(campo, idTipo) {
    const tipo = document.getElementById(idTipo).value;
    let valor = campo.value.replace(/\D/g, ''); 

    if (tipo === 'PF') {
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
        valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    }
    campo.value = valor;
}

function mascaraTelefone(campo) {
    let valor = campo.value.replace(/\D/g, '');
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
    campo.value = valor;
}

function mascaraCEP(campo) {
    let valor = campo.value.replace(/\D/g, '');
    valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
    campo.value = valor;
}

// ==========================================
// MÓDULO: CLIENTES
// ==========================================
function voltarParaListaCliente() {
    document.getElementById('view-form-cliente').classList.add('hidden');
    document.getElementById('view-lista-clientes').classList.remove('hidden');
}

function abrirFormularioCliente(clienteId = null) {
    document.getElementById('view-lista-clientes').classList.add('hidden');
    document.getElementById('view-form-cliente').classList.remove('hidden');
    
    const titulo = document.getElementById('titulo-form-cliente');
    idClienteEmEdicao = clienteId; 

    if (clienteId) {
        titulo.innerText = "✏️ Editando Cliente";
        const cliente = listaClientesGlobal.find(c => c.a1_cod === clienteId);
        
        document.getElementById('a1_tipo').value = cliente.a1_tipo || 'PF';
        alternarMascara('a1'); 
        
        document.getElementById('a1_nome').value = cliente.a1_nome || '';
        document.getElementById('a1_nreduz').value = cliente.a1_nreduz || '';
        document.getElementById('a1_cgc').value = cliente.a1_cgc || '';
        document.getElementById('a1_fone').value = cliente.a1_fone || '';
        document.getElementById('a1_email').value = cliente.a1_email || '';
        document.getElementById('a1_cep').value = cliente.a1_cep || '';
        document.getElementById('a1_endere').value = cliente.a1_endere || '';
        document.getElementById('a1_num').value = cliente.a1_num || '';
        document.getElementById('a1_bairro').value = cliente.a1_bairro || '';
        document.getElementById('a1_cidade').value = cliente.a1_cidade || '';
        document.getElementById('a1_uf').value = cliente.a1_uf || '';
        document.getElementById('a1_categ').value = cliente.a1_categ || 'Cliente Final';
        document.getElementById('a1_origem').value = cliente.a1_origem || 'Indicação';
        document.getElementById('a1_potenc').value = cliente.a1_potenc || 'B - Médio';
        document.getElementById('a1_obs').value = cliente.a1_obs || '';

        aplicarMascaraDoc(document.getElementById('a1_cgc'), 'a1_tipo');
        mascaraTelefone(document.getElementById('a1_fone'));
        mascaraCEP(document.getElementById('a1_cep'));
    } else {
        titulo.innerText = "Novo Cadastro de Cliente";
        document.querySelectorAll('#view-form-cliente input, #view-form-cliente textarea').forEach(i => i.value = '');
        document.getElementById('a1_tipo').value = 'PF';
        alternarMascara('a1');
    }
}

async function salvarCliente() {
    const dados = {
        a1_tipo: document.getElementById('a1_tipo').value,
        a1_nome: document.getElementById('a1_nome').value,
        a1_nreduz: document.getElementById('a1_nreduz').value,
        a1_cgc: document.getElementById('a1_cgc').value.replace(/\D/g, ''),
        a1_fone: document.getElementById('a1_fone').value.replace(/\D/g, ''),
        a1_email: document.getElementById('a1_email').value,
        a1_cep: document.getElementById('a1_cep').value.replace(/\D/g, ''),
        a1_endere: document.getElementById('a1_endere').value,
        a1_num: document.getElementById('a1_num').value,
        a1_bairro: document.getElementById('a1_bairro').value,
        a1_cidade: document.getElementById('a1_cidade').value,
        a1_uf: document.getElementById('a1_uf').value,
        a1_categ: document.getElementById('a1_categ').value,
        a1_origem: document.getElementById('a1_origem').value,
        a1_potenc: document.getElementById('a1_potenc').value,
        a1_obs: document.getElementById('a1_obs').value
        
    };

    if(!dados.a1_nome || !dados.a1_cgc || !dados.a1_fone || !dados.a1_email) return alert("Por favor, preencha os campos obrigatórios!");

    try {
        const url = idClienteEmEdicao ? `http://localhost:3000/api/clientes/${idClienteEmEdicao}` : 'http://localhost:3000/api/clientes';
        const resposta = await fetch(url, {
            method: idClienteEmEdicao ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alert(idClienteEmEdicao ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
            voltarParaListaCliente();
            carregarClientes(); 
        } else {
            const dadosErro = await resposta.json();
            alert("❌ Bloqueado: " + dadosErro.erro);
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function alternarStatusCliente(id, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/clientes/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (resposta.ok) carregarClientes(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTabelaClientes(lista) {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return; // Evita erro se a tela não estiver carregada
    tbody.innerHTML = ''; 
    if (lista.length === 0) return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum registo encontrado.</td></tr>';

    lista.forEach(cliente => {
        const tr = document.createElement('tr');
        const statusClass = cliente.a1_status === 'Ativo' ? 'status-active' : 'status-inactive';
        const btnStatusTexto = cliente.a1_status === 'Ativo' ? '🚫 Inativar' : '✅ Ativar';

        tr.innerHTML = `
            <td><strong>${cliente.a1_nome}</strong><br><span style="font-size: 11px; color: #777;">${cliente.a1_tipo}</span></td>
            <td>${cliente.a1_cgc}</td>
            <td>${cliente.a1_fone}</td>
            <td><span class="status-badge ${statusClass}">${cliente.a1_status}</span></td>
            <td class="actions-cell">
                <button class="btn-action" onclick="abrirFormularioCliente(${cliente.a1_cod})">✏️ Editar</button>
                <button class="btn-action" onclick="alternarStatusCliente(${cliente.a1_cod}, '${cliente.a1_status}')">${btnStatusTexto}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarClientes() {
    try {
        const res = await fetch('http://localhost:3000/api/clientes');
        if(!res.ok) throw new Error("Erro DB");
        listaClientesGlobal = await res.json();
        renderizarTabelaClientes(listaClientesGlobal);
    } catch (erro) { console.error(erro); }
}

function filtrarClientes() {
    const termoBusca = document.getElementById('input-busca-cliente').value.toLowerCase();
    const termoLimpo = termoBusca.replace(/\D/g, ''); 
    
    const filtrados = listaClientesGlobal.filter(c => {
        const nome = (c.a1_nome || '').toLowerCase();
        const nomeReduzido = (c.a1_nreduz || '').toLowerCase();
        const documento = (c.a1_cgc || '');
        
        return nome.includes(termoBusca) || nomeReduzido.includes(termoBusca) || (termoLimpo.length > 0 && documento.includes(termoLimpo));
    });
    renderizarTabelaClientes(filtrados);
}

// ==========================================
// MÓDULO: FORNECEDORES
// ==========================================
function voltarParaListaFornecedor() {
    document.getElementById('view-form-fornecedor').classList.add('hidden');
    document.getElementById('view-lista-fornecedores').classList.remove('hidden');
}

function abrirFormularioFornecedor(fornecedorId = null) {
    document.getElementById('view-lista-fornecedores').classList.add('hidden');
    document.getElementById('view-form-fornecedor').classList.remove('hidden');
    
    const titulo = document.getElementById('titulo-form-fornecedor');
    idFornecedorEmEdicao = fornecedorId; 

    if (fornecedorId) {
        titulo.innerText = "✏️ Editando Fornecedor";
        const forn = listaFornecedoresGlobal.find(f => f.a2_cod === fornecedorId);
        
        document.getElementById('a2_tipo').value = forn.a2_tipo || 'PJ';
        alternarMascara('a2'); 
        
        document.getElementById('a2_nome').value = forn.a2_nome || '';
        document.getElementById('a2_nreduz').value = forn.a2_nreduz || '';
        document.getElementById('a2_cgc').value = forn.a2_cgc || '';
        document.getElementById('a2_fone').value = forn.a2_fone || '';
        document.getElementById('a2_email').value = forn.a2_email || '';
        document.getElementById('a2_cep').value = forn.a2_cep || '';
        document.getElementById('a2_endere').value = forn.a2_endere || '';
        document.getElementById('a2_num').value = forn.a2_num || '';
        document.getElementById('a2_bairro').value = forn.a2_bairro || '';
        document.getElementById('a2_cidade').value = forn.a2_cidade || '';
        document.getElementById('a2_uf').value = forn.a2_uf || '';
        document.getElementById('a2_categ').value = forn.a2_categ || 'Material';
        document.getElementById('a2_banco').value = forn.a2_banco || '';
        document.getElementById('a2_agencia').value = forn.a2_agencia || '';
        document.getElementById('a2_conta').value = forn.a2_conta || '';
        document.getElementById('a2_obs').value = forn.a2_obs || '';

        aplicarMascaraDoc(document.getElementById('a2_cgc'), 'a2_tipo');
        mascaraTelefone(document.getElementById('a2_fone'));
        mascaraCEP(document.getElementById('a2_cep'));
    } else {
        titulo.innerText = "Novo Cadastro de Fornecedor";
        document.querySelectorAll('#view-form-fornecedor input, #view-form-fornecedor textarea').forEach(i => i.value = '');
        document.getElementById('a2_tipo').value = 'PJ';
        alternarMascara('a2');
    }
}

async function salvarFornecedor() {
    const dados = {
        a2_tipo: document.getElementById('a2_tipo').value,
        a2_nome: document.getElementById('a2_nome').value,
        a2_nreduz: document.getElementById('a2_nreduz').value,
        a2_cgc: document.getElementById('a2_cgc').value.replace(/\D/g, ''),
        a2_fone: document.getElementById('a2_fone').value.replace(/\D/g, ''),
        a2_email: document.getElementById('a2_email').value,
        a2_cep: document.getElementById('a2_cep').value.replace(/\D/g, ''),
        a2_endere: document.getElementById('a2_endere').value,
        a2_num: document.getElementById('a2_num').value,
        a2_bairro: document.getElementById('a2_bairro').value,
        a2_cidade: document.getElementById('a2_cidade').value,
        a2_uf: document.getElementById('a2_uf').value,
        a2_categ: document.getElementById('a2_categ').value,
        a2_banco: document.getElementById('a2_banco').value,
        a2_agencia: document.getElementById('a2_agencia').value,
        a2_conta: document.getElementById('a2_conta').value,
        a2_obs: document.getElementById('a2_obs').value
    };

    if(!dados.a2_nome || !dados.a2_cgc || !dados.a2_fone || !dados.a2_email) return alert("Por favor, preencha os campos obrigatórios!");

    try {
        const url = idFornecedorEmEdicao ? `http://localhost:3000/api/fornecedores/${idFornecedorEmEdicao}` : 'http://localhost:3000/api/fornecedores';
        const resposta = await fetch(url, {
            method: idFornecedorEmEdicao ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alert(idFornecedorEmEdicao ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
            voltarParaListaFornecedor();
            carregarFornecedores(); 
        } else {
            const dadosErro = await resposta.json();
            alert("❌ Bloqueado: " + dadosErro.erro);
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function alternarStatusFornecedor(id, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/fornecedores/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (resposta.ok) carregarFornecedores(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTabelaFornecedores(lista) {
    const tbody = document.getElementById('tabela-fornecedores-body');
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
                <button class="btn-action" onclick="abrirFormularioFornecedor(${forn.a2_cod})">✏️ Editar</button>
                <button class="btn-action" onclick="alternarStatusFornecedor(${forn.a2_cod}, '${forn.a2_status}')">${btnStatusTexto}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarFornecedores() {
    try {
        const res = await fetch('http://localhost:3000/api/fornecedores');
        if(!res.ok) throw new Error("Erro DB");
        listaFornecedoresGlobal = await res.json();
        renderizarTabelaFornecedores(listaFornecedoresGlobal);
    } catch (erro) { console.error(erro); }
}

function filtrarFornecedores() {
    const termoBusca = document.getElementById('input-busca-fornecedor').value.toLowerCase();
    const termoLimpo = termoBusca.replace(/\D/g, ''); 
    
    const filtrados = listaFornecedoresGlobal.filter(f => {
        const nome = (f.a2_nome || '').toLowerCase();
        const nomeReduzido = (f.a2_nreduz || '').toLowerCase();
        const documento = (f.a2_cgc || '');
        
        return nome.includes(termoBusca) || nomeReduzido.includes(termoBusca) || (termoLimpo.length > 0 && documento.includes(termoLimpo));
    });
    renderizarTabelaFornecedores(filtrados);
}

// ==========================================
// MÓDULO: SERVIÇOS
// ==========================================

function voltarParaListaServico() {
    document.getElementById('view-form-servico').classList.add('hidden');
    document.getElementById('view-lista-servicos').classList.remove('hidden');
}

function abrirFormularioServico(id = null) {
    document.getElementById('view-lista-servicos').classList.add('hidden');
    document.getElementById('view-form-servico').classList.remove('hidden');
    
    idServicoEmEdicao = id; 
    const titulo = document.getElementById('titulo-form-servico');

    if (id) {
        titulo.innerText = "✏️ Editando Serviço";
        const srv = listaServicosGlobal.find(s => s.a3_cod === id);
        document.getElementById('a3_nome').value = srv.a3_nome || '';
        document.getElementById('a3_descric').value = srv.a3_descric || '';
        document.getElementById('a3_unidade').value = srv.a3_unidade || 'Projeto';
        document.getElementById('a3_valor_base').value = srv.a3_valor_base || '';
    } else {
        titulo.innerText = "Novo Serviço";
        document.querySelectorAll('#view-form-servico input, #view-form-servico textarea').forEach(i => i.value = '');
        document.getElementById('a3_unidade').value = 'Projeto';
    }
}

async function salvarServico() {
    const dados = {
        a3_nome: document.getElementById('a3_nome').value,
        a3_descric: document.getElementById('a3_descric').value,
        a3_unidade: document.getElementById('a3_unidade').value,
        a3_valor_base: document.getElementById('a3_valor_base').value || 0
    };

    if(!dados.a3_nome) return alert("Preencha o Nome do Serviço!");

    try {
        const url = idServicoEmEdicao ? `http://localhost:3000/api/servicos/${idServicoEmEdicao}` : 'http://localhost:3000/api/servicos';
        const res = await fetch(url, {
            method: idServicoEmEdicao ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("Salvo com sucesso!");
            voltarParaListaServico();
            carregarServicos(); 
        } else {
            alert("Erro ao salvar.");
        }
    } catch (erro) { alert("Falha de conexão."); }
}

async function alternarStatusServico(id, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const res = await fetch(`http://localhost:3000/api/servicos/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (res.ok) carregarServicos(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTabelaServicos(lista) {
    const tbody = document.getElementById('tabela-servicos-body');
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
                <button class="btn-action" onclick="abrirFormularioServico(${srv.a3_cod})">✏️ Editar</button>
                <button class="btn-action" onclick="alternarStatusServico(${srv.a3_cod}, '${srv.a3_status}')">⇄ Status</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarServicos() {
    try {
        const res = await fetch('http://localhost:3000/api/servicos');
        if(res.ok) {
            listaServicosGlobal = await res.json();
            renderizarTabelaServicos(listaServicosGlobal);
        }
    } catch (erro) { console.error(erro); }
}

function filtrarServicos() {
    const termo = document.getElementById('input-busca-servico').value.toLowerCase();
    const filtrados = listaServicosGlobal.filter(s => (s.a3_nome || '').toLowerCase().includes(termo));
    renderizarTabelaServicos(filtrados);
}