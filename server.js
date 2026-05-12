const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos (O seu Front-end)
app.use(express.static('public'));

// ==========================================
// IMPORTANDO OS MÓDULOS (ROTAS)
// ==========================================
const rotasClientes = require('./routes/clientes');
const rotasFornecedores = require('./routes/fornecedores');
const rotasServicos = require('./routes/servicos');
const rotasLeads = require('./routes/leads');
const rotasOrcamentos = require('./routes/orcamentos');
const rotasContratos = require('./routes/contratos');

// ==========================================
// LIGANDO AS ROTAS
// ==========================================
app.use('/api/clientes', rotasClientes);
app.use('/api/fornecedores', rotasFornecedores);
app.use('/api/servicos', rotasServicos);
app.use('/api/leads', rotasLeads);
app.use('/api/orcamentos', rotasOrcamentos);
app.use('/api/contratos', rotasContratos);

// ==========================================
// INICIANDO O SERVIDOR
// ==========================================
const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor modular rodando na porta ${PORTA} 🚀`);
});