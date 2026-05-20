const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. Listar todos os Leads
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT TC0.*, TA1.A1_NOME, TA1.A1_FONE 
            FROM TC0 
            INNER JOIN TA1 ON TC0.C0_CLIENTE = TA1.A1_COD 
            ORDER BY TC0.C0_COD DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) { res.status(500).json({ erro: 'Falha ao buscar oportunidades.' }); }
});

// 2. Inserir Novo Lead (Nasce na Fase 1 com Status Ativo)
router.post('/', async (req, res) => {
    try {
        const d = req.body;
        let clienteId = d.cliente_id;

        if (clienteId === 'novo') {
            const sqlCli = `INSERT INTO TA1 (A1_TIPO, A1_NOME, A1_FONE, A1_CATEG, A1_ORIGEM, A1_STATUS) VALUES ('PF', $1, $2, 'Cliente Final', 'Indicação', 'Ativo') RETURNING A1_COD`;
            const cliSalvo = await pool.query(sqlCli, [d.nome, d.fone]);
            clienteId = cliSalvo.rows[0].a1_cod;
        }

        const sqlLead = `INSERT INTO TC0 (C0_CLIENTE, C0_TITULO, C0_FASE, C0_DATA_CAD, C0_STATUS) VALUES ($1, $2, '1 - Contato Inicial', $3, 'Ativo') RETURNING *`;
        const novoLead = await pool.query(sqlLead, [clienteId, d.titulo, d.data_cad]);
        res.status(201).json(novoLead.rows[0]);
    } catch (erro) { res.status(500).json({ erro: erro.message }); }
});

// 3. Atualizar Dados (Edição permitida unicamente para o Título)
router.put('/:id', async (req, res) => {
    try {
        const { titulo } = req.body;
        const sql = `UPDATE TC0 SET C0_TITULO = $1 WHERE C0_COD = $2 RETURNING *`;
        const result = await pool.query(sql, [titulo, req.params.id]);
        res.json(result.rows[0]);
    } catch (erro) { res.status(500).json({ erro: 'Falha ao atualizar o lead.' }); }
});

// ==========================================
// ROTAS DE GATILHOS DA ESTEIRA (AÇÕES MESTRES)
// ==========================================

// Avançar Fase 1 -> Fase 2 (Agendamento de Reunião)
router.put('/:id/agendar-reuniao', async (req, res) => {
    try {
        await pool.query(`UPDATE TC0 SET C0_FASE = '2 - Reunião Agendada', C0_DATA_ATU = CURRENT_DATE WHERE C0_COD = $1`, [req.params.id]);
        res.json({ mensagem: 'Fase 2 estabelecida.' });
    } catch (erro) { res.status(500).json({ erro: erro.message }); }
});

// Avançar Fase 4 -> Fase 5 (Assinatura do Contrato e Encerramento)
router.put('/:id/finalizar-contrato-assinado', async (req, res) => {
    try {
        // Altera para a fase terminal 5 e muda o status de auditoria para 'Encerrado'
        const sql = `UPDATE TC0 SET C0_FASE = '5 - Encerrado', C0_STATUS = 'Encerrado', C0_DATA_ATU = CURRENT_DATE WHERE C0_COD = $1`;
        await pool.query(sql, [req.params.id]);
        res.json({ mensagem: 'Lead concluído e encerrado.' });
    } catch (erro) { res.status(500).json({ erro: erro.message }); }
});

// Trava Geral: Sinaliza cancelamento independente da fase
router.put('/:id/cancelar-lead', async (req, res) => {
    try {
        await pool.query(`UPDATE TC0 SET C0_STATUS = 'Cancelado', C0_DATA_ATU = CURRENT_DATE WHERE C0_COD = $1`, [req.params.id]);
        res.json({ mensagem: 'Lead cancelado.' });
    } catch (erro) { res.status(500).json({ erro: erro.message }); }
});

module.exports = router;