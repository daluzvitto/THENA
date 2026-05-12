const express = require('express');
const router = express.Router();
const pool = require('../db');

// Buscar todos os Leads (Trazendo o nome do cliente através de um JOIN)
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT TC0.*, TA1.A1_NOME, TA1.A1_FONE, TA1.A1_CGC 
            FROM TC0 
            INNER JOIN TA1 ON TC0.C0_CLIENTE = TA1.A1_COD 
            ORDER BY TC0.C0_COD DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha ao buscar leads.' });
    }
});

// Criar um Novo Lead
router.post('/', async (req, res) => {
    try {
        const d = req.body;
        let clienteId = d.cliente_id;

        // Se for um cliente novo, cadastra na TA1 de forma segura
        if (!clienteId || clienteId === 'novo') {
            // Injetamos dados padrão ('Cliente Final', 'Indicação') para evitar erros de campos em branco no banco
            const sqlNovoCli = `
                INSERT INTO TA1 (A1_TIPO, A1_NOME, A1_FONE, A1_CATEG, A1_ORIGEM, A1_POTENC, A1_STATUS) 
                VALUES ('PF', $1, $2, 'Cliente Final', 'Indicação', 'B - Médio', 'Ativo') 
                RETURNING A1_COD
            `;
            const cliSalvo = await pool.query(sqlNovoCli, [d.nome, d.fone]);
            clienteId = cliSalvo.rows[0].a1_cod;
        }

        // Agora cria a Oportunidade (Lead) na TC0 amarrada ao cliente
        const sqlLead = `INSERT INTO TC0 (C0_CLIENTE, C0_TITULO, C0_FASE, C0_DATA_CAD, C0_STATUS) VALUES ($1, $2, $3, $4, 'Aberto') RETURNING *`;
        const novoLead = await pool.query(sqlLead, [clienteId, d.titulo, d.fase, d.data_cad]);
        
        res.status(201).json(novoLead.rows[0]);
    } catch (erro) {
        // Agora o servidor vai imprimir o erro exato no terminal do VS Code
        console.error("🕵️ ERRO DETETADO AO SALVAR LEAD:", erro.message);
        
        // E vai mandar o erro real para o balão de alerta da sua tela!
        res.status(500).json({ erro: 'Bloqueio do Banco: ' + erro.message });
    }
});

// Atualizar apenas a fase do funil
router.patch('/:id/funil', async (req, res) => {
    try {
        const sql = `UPDATE TC0 SET C0_FASE = $1, C0_DATA_ATU = CURRENT_DATE WHERE C0_COD = $2 RETURNING *`;
        const resultado = await pool.query(sql, [req.body.novaFase, req.params.id]);
        res.json(resultado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar fase do funil.' });
    }
});

module.exports = router;