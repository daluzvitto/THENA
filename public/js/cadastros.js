// VARIÁVEIS GLOBAIS
let idClienteEmEdicao = null;
let listaClientesGlobal = [];
let idFornecedorEmEdicao = null;
let listaFornecedoresGlobal = [];
let idServicoEmEdicao = null;
let listaServicosGlobal = [];
let idConpagEmEdicao = null;
let listaConpagGlobal = [];

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

function formatarDocListagem(documento) {
    if (!documento) return '';
    let num = String(documento).replace(/\D/g, ''); 
    
    if (num.length === 11) { // CPF
        return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (num.length === 14) { // CNPJ
        return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return documento;
}

function formatarTelefoneListagem(telefone) {
    if (!telefone) return '';
    let num = String(telefone).replace(/\D/g, '');
    
    if (num.length === 11) { // Celular
        return num.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (num.length === 10) { // Fixo
        return num.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone; 
}

// ==========================================
// MÓDULO: CLIENTES
// ==========================================
function voltarParaListaCliente() {
    document.getElementById('view-form-cliente').classList.add('hidden');
    document.getElementById('view-lista-clientes').classList.remove('hidden');
}

async function abrirFormularioCliente(clienteId = null) {
    document.getElementById('view-lista-clientes').classList.add('hidden');
    document.getElementById('view-form-cliente').classList.remove('hidden');
    
    const titulo = document.getElementById('titulo-form-cliente');
    idClienteEmEdicao = clienteId; 

    await atualizarSelectConpagCliente();   
    
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
        document.getElementById('a1_canal').value = cliente.a1_canal || 'WhatsApp';
        document.getElementById('a1_cep').value = cliente.a1_cep || '';
        document.getElementById('a1_endere').value = cliente.a1_endere || '';
        document.getElementById('a1_num').value = cliente.a1_num || '';
        document.getElementById('a1_bairro').value = cliente.a1_bairro || '';
        document.getElementById('a1_cidade').value = cliente.a1_cidade || '';
        document.getElementById('a1_uf').value = cliente.a1_uf || '';
        document.getElementById('a1_categ').value = cliente.a1_categ || 'Cliente Final';
        document.getElementById('a1_origem').value = cliente.a1_origem || 'Indicação';
        document.getElementById('a1_potenc').value = cliente.a1_potenc || 'B - Médio';
        document.getElementById('a1_conpag').value = cliente.a1_conpag || '';
        document.getElementById('a1_obs').value = cliente.a1_obs || '';

        aplicarMascaraDoc(document.getElementById('a1_cgc'), 'a1_tipo');
        mascaraTelefone(document.getElementById('a1_fone'));
        mascaraCEP(document.getElementById('a1_cep'));
    } else {
        titulo.innerText = "Novo Cadastro de Cliente";
        document.querySelectorAll('#view-form-cliente input, #view-form-cliente textarea').forEach(i => i.value = '');
        document.getElementById('a1_tipo').value = 'PF';
        document.getElementById('a1_conpag').value = ''; // Limpa o select
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
        a1_canal: document.getElementById('a1_canal').value,
        a1_cep: document.getElementById('a1_cep').value.replace(/\D/g, ''),
        a1_endere: document.getElementById('a1_endere').value,
        a1_num: document.getElementById('a1_num').value,
        a1_bairro: document.getElementById('a1_bairro').value,
        a1_cidade: document.getElementById('a1_cidade').value,
        a1_uf: document.getElementById('a1_uf').value,
        a1_categ: document.getElementById('a1_categ').value,
        a1_origem: document.getElementById('a1_origem').value,
        a1_potenc: document.getElementById('a1_potenc').value,
        a1_conpag: document.getElementById('a1_conpag').value || null,
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
    if(!tbody) return; 
    tbody.innerHTML = ''; 
    if (lista.length === 0) return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum registo encontrado.</td></tr>';

    lista.forEach(cliente => {
        const tr = document.createElement('tr');
        const statusClass = cliente.a1_status === 'Ativo' ? 'status-active' : 'status-inactive';
        const btnStatusTexto = cliente.a1_status === 'Ativo' ? '🚫 Inativar' : '✅ Ativar';

        // Aplicando as máscaras visuais
        const docFormatado = formatarDocListagem(cliente.a1_cgc);
        const foneFormatado = formatarTelefoneListagem(cliente.a1_fone);

        tr.innerHTML = `
            <td><strong>${cliente.a1_nome}</strong><br><span style="font-size: 11px; color: #777;">${cliente.a1_tipo}</span></td>
            <td>${docFormatado}</td> <td>${foneFormatado}</td> <td><span class="status-badge ${statusClass}">${cliente.a1_status}</span></td>
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

        // Aplicando as máscaras visuais
        const docFormatado = formatarDocListagem(forn.a2_cgc);
        const foneFormatado = formatarTelefoneListagem(forn.a2_fone);

        tr.innerHTML = `
            <td><strong>${forn.a2_nome}</strong><br><span style="font-size: 11px; color: #777;">${forn.a2_categ}</span></td>
            <td>${docFormatado}</td> <td>${foneFormatado}</td> <td><span class="status-badge ${statusClass}">${forn.a2_status}</span></td>
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

// ==========================================
// MÓDULO: CONDIÇÕES PAGAMENTO
// ==========================================

function voltarParaListaConpag() {
    document.getElementById('view-form-conpag').classList.add('hidden');
    document.getElementById('view-lista-conpag').classList.remove('hidden');
}

function atualizarDicaRegra() {
    const tipo = document.getElementById('a4_tipo').value;
    const input = document.getElementById('a4_regra');
    const dica = document.getElementById('dica-regra');

    if (tipo === '1') {
        input.placeholder = "Ex: 00,30,60";
        dica.innerText = "Regra de Dias: Divide o valor total em parcelas iguais. Ex: '00,30,60' = 3 parcelas (Entrada, 30 e 60 dias).";
    } else if (tipo === '2') {
        input.placeholder = "Ex: 50-00,25-30,25-60";
        dica.innerText = "Regra Percentual: 'Porcentagem-Dia'. Ex: '50-00,25-30,25-60' = 50% de entrada, 25% em 30 dias, 25% em 60 dias.";
    }
}

async function abrirFormularioConpag(id = null) {
    document.getElementById('view-lista-conpag').classList.add('hidden');
    document.getElementById('view-form-conpag').classList.remove('hidden');
    
    idConpagEmEdicao = id;
    const titulo = document.getElementById('titulo-form-conpag');

    if (id) {
        // MODO EDIÇÃO
        titulo.innerText = "✏️ Editando Condição";
        const conpag = listaConpagGlobal.find(c => c.a4_cod === id);
    
        document.getElementById('a4_nome').value = conpag.a4_nome || '';
        document.getElementById('a4_tipo').value = conpag.a4_tipo || '1';
        document.getElementById('a4_regra').value = conpag.a4_regra || '';
        atualizarDicaRegra();
    } else {
        // NOVO CADASTRO
        titulo.innerText = "Nova Condição de Pagamento";
        document.querySelectorAll('#view-form-conpag input').forEach(i => i.value = ''); 
        
        document.getElementById('a4_tipo').value = '1';
        atualizarDicaRegra();
    }
}

async function salvarConpag() {
    const dados = {
        a4_nome: document.getElementById('a4_nome').value,
        a4_tipo: document.getElementById('a4_tipo').value, // Novo campo
        a4_regra: document.getElementById('a4_regra').value
    };

    if(!dados.a4_nome || !dados.a4_regra) {
        return alert("Por favor, preencha todos os campos da condição!");
    }

    try {
        // ATENÇÃO AQUI: Garanta que a URL e a porta estão corretas!
        const url = idConpagEmEdicao ? `http://localhost:3000/api/conpag/${idConpagEmEdicao}` : 'http://localhost:3000/api/conpag';
        const resposta = await fetch(url, {
            method: idConpagEmEdicao ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alert("Salvo com sucesso!");
            voltarParaListaConpag();
            carregarConpag(); 
        } else {
            alert("Erro ao gravar no banco.");
        }
    } catch (erro) { 
        alert("Falha de conexão com a API. Verifique se o servidor está rodando."); 
    }
}

async function alternarStatusConpag(id, statusAtual) {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    if (!confirm(`Mudar status para ${novoStatus}?`)) return;

    try {
        const res = await fetch(`http://localhost:3000/api/conpag/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        if (res.ok) carregarConpag(); 
    } catch (erro) { alert("Falha de conexão."); }
}

function renderizarTabelaConpag(lista) {
    const tbody = document.getElementById('tabela-conpag-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (lista.length === 0) {
        return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma condição cadastrada.</td></tr>';
    }

    lista.forEach(item => {
        const statusClass = item.a4_status === 'Ativo' ? 'status-active' : 'status-inactive';
        const btnStatusTexto = item.a4_status === 'Ativo' ? '🚫 Inativar' : '✅ Ativar';
        
        // Formata o código para aparecer 001, 002...
        const codFormatado = String(item.a4_cod).padStart(3, '0');
        
        // Traduz o código 1/2 para o texto na tela
        const tipoTexto = item.a4_tipo == 1 ? 'Regra 01' : 'Regra 02';

        tbody.innerHTML += `
            <tr>
                <td>${codFormatado}</td>
                <td><strong>${item.a4_nome}</strong><br><small style="color: #666;">${tipoTexto}</small></td>
                <td><code>${item.a4_regra}</code></td>
                <td><span class="status-badge ${statusClass}">${item.a4_status}</span></td>
                <td class="actions-cell">
                    <button class="btn-action" onclick="abrirFormularioConpag(${item.a4_cod})">✏️ Editar</button>
                    <button class="btn-action" onclick="alternarStatusConpag(${item.a4_cod}, '${item.a4_status}')">${btnStatusTexto}</button>
                </td>
            </tr>
        `;
    });
}

async function carregarConpag() {
    try {
        const res = await fetch('http://localhost:3000/api/conpag');
        if(!res.ok) throw new Error("Erro DB");
        listaConpagGlobal = await res.json();
        renderizarTabelaConpag(listaConpagGlobal);
        atualizarSelectConpagCliente(); 
    } catch (erro) { console.error(erro); }
}

async function atualizarSelectConpagCliente() {
    const select = document.getElementById('a1_conpag');
    if(!select) return;

    // Guarda o valor que estava selecionado antes de atualizar
    const valorAtual = select.value; 
    select.innerHTML = '<option value="">Carregando...</option>';

    try {
        // Busca os dados fresquinhos direto da API
        const res = await fetch('/api/conpag');
        const condicoes = await res.json();
        
        select.innerHTML = '<option value="">Selecione uma condição...</option>';
        
        condicoes.forEach(c => {
            if(c.a4_status === 'Ativo') {
                // Formata o ID que vem do banco (ex: 1) para "001"
                const codFormatado = String(c.a4_cod).padStart(3, '0');
                // O value="c.a4_cod" salva o número real (1) no banco do Cliente
                select.innerHTML += `<option value="${c.a4_cod}">${codFormatado} - ${c.a4_nome}</option>`;
            }
        });

        // Devolve o valor selecionado caso seja uma edição
        if (valorAtual) select.value = valorAtual;

    } catch (e) {
        console.error("Erro ao carregar condições no cliente:", e);
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}