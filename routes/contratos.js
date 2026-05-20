// routes/contratos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. Listar Contratos salvos na grade principal
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT TC3.*, TA1.A1_NOME, TC0.C0_TITULO 
            FROM TC3 
            LEFT JOIN TA1 ON TC3.C3_CLIENTE = TA1.A1_COD
            LEFT JOIN TC0 ON TC3.C3_LEAD = TC0.C0_COD
            ORDER BY TC3.C3_NUMERO DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) { res.status(500).json({ erro: 'Falha ao buscar contratos.' }); }
});

router.get('/orcamentos-pendentes', async (req, res) => {
    try {
        const sql = `
            SELECT 
                TC1.C1_NUMERO,
                TC1.C1_TITULO,
                TC1.C1_LEAD,
                TC1.C1_CLIENTE,
                TC1.C1_VALOR_TOTAL,
                TC1.C1_COND_PAGTO,
                TA1.A1_NOME, 
                TA1.A1_CGC,
                TA4.A4_NOME AS condpag_nome,
                TC0.C0_TITULO
            FROM TC1 
            INNER JOIN TA1 ON TC1.C1_CLIENTE = TA1.A1_COD
            LEFT JOIN TA4 ON TC1.C1_COND_PAGTO = TA4.A4_COD
            LEFT JOIN TC0 ON TC1.C1_LEAD = TC0.C0_COD
            WHERE TC1.C1_CONTRATO IS NULL 
              AND TC1.C1_STATUS = '2')
            ORDER BY TC1.C1_NUMERO DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) { 
        console.error("Erro na rota de orçamentos pendentes:", erro.message);
        res.status(500).json({ erro: 'Falha ao coletar propostas em aberto.' }); 
    }
});

// 3. Gravação Unificada (Contrato, Atualiza Lead para Fase 5 e Orçamento para Aprovado)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // 🛡️ Transação Atômica (Tudo ou Nada)
        const d = req.body;

        // A. Cria o Contrato na TC3
        const sqlContrato = `
            INSERT INTO TC3 (C3_CLIENTE, C3_LEAD, C3_ORCAMENTO, C3_VALOR_FINAL, C3_TEXTO, C3_STATUS) 
            VALUES ($1, $2, $3, $4, $5, 'Ativo') RETURNING C3_NUMERO
        `;
        const resContrato = await client.query(sqlContrato, [d.c3_cliente, d.c3_lead, d.c3_orcamento, d.c3_valor_final, d.c3_texto]);
        const novoContratoId = resContrato.rows[0].c3_numero;

        // B. Altera o Orçamento (TC1): Status vai para '3' e preenche 'C1_CONTRATO'
        await client.query(`
            UPDATE TC1 
            SET C1_CONTRATO = $1, 
                C1_STATUS = '3' 
            WHERE C1_NUMERO = $2
        `, [novoContratoId, d.c3_orcamento]);

        // C. Altera o Lead (TC0): Fase vai para '5 - Encerrado' e preenche 'C0_CONTRATO'
        await client.query(`
            UPDATE TC0 
            SET C0_CONTRATO = $1, 
                C0_FASE = '5 - Encerrado', 
                C0_STATUS = 'Encerrado',
                C0_DATA_ATU = CURRENT_DATE 
            WHERE C0_COD = $2
        `, [novoContratoId, d.c3_lead]);

        await client.query('COMMIT'); // ✅ Aplica no banco de dados com segurança
        res.status(201).json({ c3_numero: novoContratoId });

    } catch (erro) {
        await client.query('ROLLBACK'); // ❌ Aborta tudo se algo falhar
        console.error("Erro transacional ao salvar contrato:", erro.message);
        res.status(500).json({ erro: erro.message });
    } finally { client.release(); }
});

module.exports = router;