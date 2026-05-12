const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. Listar Contratos
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT TC3.*, TA1.A1_NOME, TC0.C0_TITULO 
            FROM TC3 
            INNER JOIN TA1 ON TC3.C3_CLIENTE = TA1.A1_COD
            INNER JOIN TC0 ON TC3.C3_LEAD = TC0.C0_COD
            ORDER BY TC3.C3_NUMERO DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) { res.status(500).json({ erro: 'Falha ao buscar contratos.' }); }
});

// 2. Buscar Orçamentos "Livres" (Que ainda não viraram contrato)
router.get('/orcamentos-pendentes', async (req, res) => {
    try {
        const sql = `
            SELECT TC1.*, TA1.A1_NOME 
            FROM TC1 
            INNER JOIN TA1 ON TC1.C1_CLIENTE = TA1.A1_COD
            WHERE TC1.C1_CONTRATO IS NULL 
            ORDER BY TC1.C1_NUMERO DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) { res.status(500).json({ erro: 'Falha ao buscar orçamentos.' }); }
});

// 3. Gerar Novo Contrato (Com Amarração Bilateral)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const d = req.body;

        // A. Cria o Contrato na TC3
        const sqlContrato = `
            INSERT INTO TC3 (C3_CLIENTE, C3_LEAD, C3_ORCAMENTO, C3_VALOR_FINAL, C3_TEXTO) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const resContrato = await client.query(sqlContrato, [d.cliente_id, d.lead_id, d.orcamento_id, d.valor_final, d.texto]);
        const novoContrato = resContrato.rows[0];

        // B. Carimba o Orçamento (TC1) como Aprovado e vincula o Contrato
        await client.query(`UPDATE TC1 SET C1_CONTRATO = $1, C1_STATUS = '2 - Aprovado' WHERE C1_NUMERO = $2`, 
                           [novoContrato.c3_numero, d.orcamento_id]);

        // C. Carimba o Lead (TC0) como Ganho e vincula o Contrato
        await client.query(`UPDATE TC0 SET C0_CONTRATO = $1, C0_ORC_APROVADO = $2, C0_FASE = '5 - Contrato Fechado (Ganho)' WHERE C0_COD = $3`, 
                           [novoContrato.c3_numero, d.orcamento_id, d.lead_id]);

        await client.query('COMMIT');
        res.status(201).json(novoContrato);
    } catch (erro) {
        await client.query('ROLLBACK');
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao gerar contrato.' });
    } finally {
        client.release();
    }
});

module.exports = router;