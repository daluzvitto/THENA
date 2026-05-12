async function navegarPara(pagina) {
    // 1. Remove destaque visual de todos os itens de menu
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    
    // 2. Mapeamento: Qual página pertence a qual "gaveta" (Submenu)?
    const relacaoMenuSubmenu = {
        'clientes': 'submenu-cadastros',
        'fornecedores': 'submenu-cadastros',
        'servicos': 'submenu-cadastros',
        'leads': 'submenu-comercial',
        'orcamentos': 'submenu-comercial',
        'contratos': 'submenu-comercial'
    };

    const idSubmenuAlvo = relacaoMenuSubmenu[pagina];

    // 3. Gerenciar as gavetas (Fechar as outras e abrir a correta)
    document.querySelectorAll('.submenu').forEach(sub => {
        if (sub.id === idSubmenuAlvo) {
            sub.classList.add('open'); // Abre a gaveta da página atual
        } else {
            sub.classList.remove('open'); // Fecha as outras
        }
    });

    // 4. Destaca o item específico que foi clicado
    const itemMenu = document.getElementById('menu-' + pagina);
    if(itemMenu) itemMenu.classList.add('active');

    // 5. Busca e injeta o conteúdo na tela
    try {
        const resposta = await fetch(`/pages/${pagina}.html`);
        if (!resposta.ok) throw new Error('Página não encontrada');
        const html = await resposta.text();
        
        document.getElementById('conteudo-principal').innerHTML = html;

        // Gatilhos de carregamento de dados do Banco
        if (pagina === 'clientes') carregarClientes();
        if (pagina === 'fornecedores') carregarFornecedores();
        if (pagina === 'servicos') carregarServicos();
        if (pagina === 'leads') carregarLeads();
        if (pagina === 'orcamentos') carregarOrcamentos();
        if (pagina === 'contratos') carregarContratos();
        
    } catch (erro) {
        console.error('Erro:', erro);
        document.getElementById('conteudo-principal').innerHTML = '<h2>⚠️ Módulo em desenvolvimento.</h2>';
    }
}

// Mantenha a função selecionarModuloPai para quando o usuário clicar no TÍTULO (ex: Cadastro)
function selecionarModuloPai(submenuId) {
    // Fecha todos os submenus primeiro
    document.querySelectorAll('.submenu').forEach(s => {
        if(s.id !== submenuId) s.classList.remove('open');
    });

    // Alterna (abre/fecha) apenas o que foi clicado
    const submenu = document.getElementById(submenuId);
    submenu.classList.toggle('open');

    // Limpa a tela (Tela Branca) conforme solicitado
    document.getElementById('conteudo-principal').innerHTML = '';
    document.querySelectorAll('.submenu li').forEach(li => li.classList.remove('active'));
}