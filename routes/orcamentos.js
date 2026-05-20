const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// LISTAGEM PRINCIPAL
// ==========================================
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT TC1.*, TA1.A1_NOME, TC0.C0_TITULO 
            FROM TC1 
            LEFT JOIN TA1 ON TC1.C1_CLIENTE = TA1.A1_COD
            LEFT JOIN TC0 ON TC1.C1_LEAD = TC0.C0_COD
            ORDER BY TC1.C1_NUMERO DESC
        `;
        const resultado = await pool.query(sql);
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha ao buscar orçamentos.' });
    }
});

// ==========================================
// CRIAÇÃO (SALVAMENTO UNIFICADO)
// ==========================================
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // 🛡️ Inicia Transação Segura

        const d = req.body; 

        // 1. Busca cliente_id através do Lead informado
        const resLead = await client.query('SELECT C0_CLIENTE FROM TC0 WHERE C0_COD = $1', [d.c1_lead]);
        if (resLead.rows.length === 0) throw new Error("Lead não encontrado.");
        const clienteIdDB = resLead.rows[0].c0_cliente;

        // 2. Insere Cabeçalho do Orçamento na TC1
        const sqlOrc = `
            INSERT INTO TC1 (C1_LEAD, C1_CLIENTE, C1_TITULO, C1_COMPLEMENTO, C1_DATA_EMISSAO, C1_VALIDADE, C1_COND_PAGTO, C1_STATUS) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, '1') RETURNING C1_NUMERO
        `;
        const resOrc = await client.query(sqlOrc, [d.c1_lead, clienteIdDB, d.c1_titulo, d.c1_complemento, d.c1_data_emissao, d.c1_validade, d.c1_cond_pagto]);
        const novoOrcId = resOrc.rows[0].c1_numero;

        // 3. Insere a lista de Serviços na TC2
        const sqlItem = `INSERT INTO TC2 (C2_NUM_ORC, C2_SERVICO, C2_DESCRICAO, C2_QUANTIDADE, C2_VALOR_UNIT, C2_TOTAL_ITEM) VALUES ($1, $2, $3, $4, $5, $6)`;
        for (const item of d.itens) {
            await client.query(sqlItem, [novoOrcId, item.c2_servico, item.c2_descricao || '', item.c2_quantidade, item.c2_valor_unit, item.c2_total_item]);
        }

        // 4. Recalcula e atualiza o Valor Total na TC1
        await client.query(`UPDATE TC1 SET C1_VALOR_TOTAL = (SELECT COALESCE(SUM(C2_TOTAL_ITEM), 0) FROM TC2 WHERE C2_NUM_ORC = $1) WHERE C1_NUMERO = $1`, [novoOrcId]);
        
        // 5. ✨ GATILHO DA ESTEIRA COMERCIAL: Atualiza a TC0 com o novo Orçamento e move para a Fase 3
        await client.query(`
            UPDATE TC0 
            SET C0_FASE = '3 - Orçamento', 
                C0_ORC_APROVADO = $1, -- Grava o número do orçamento gerado no Lead!
                C0_DATA_ATU = CURRENT_DATE 
            WHERE C0_COD = $2
        `, [novoOrcId, d.c1_lead]);

        await client.query('COMMIT'); // ✅ Consolida todas as gravações juntas
        res.status(201).json({ c1_numero: novoOrcId });
    } catch (erro) {
        await client.query('ROLLBACK'); // ❌ Desfaz tudo em caso de qualquer falha
        res.status(500).json({ erro: erro.message });
    } finally { client.release(); }
});

// ==========================================
// EDIÇÃO (SALVAMENTO UNIFICADO)
// ==========================================
router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const numOrc = req.params.id;
        const d = req.body;

        // 1. Atualiza dados do cabeçalho
        const sqlCab = `UPDATE TC1 SET C1_TITULO = $1, C1_COMPLEMENTO = $2, C1_DATA_EMISSAO = $3, C1_VALIDADE = $4, C1_COND_PAGTO = $5 WHERE C1_NUMERO = $6`;
        await client.query(sqlCab, [d.c1_titulo, d.c1_complemento, d.c1_data_emissao, d.c1_validade, d.c1_cond_pagto, numOrc]);

        // 2. Limpa os itens antigos da TC2
        await client.query('DELETE FROM TC2 WHERE C2_NUM_ORC = $1', [numOrc]);

        // 3. Insere a nova lista atualizada de serviços
        const sqlItem = `INSERT INTO TC2 (C2_NUM_ORC, C2_SERVICO, C2_DESCRICAO, C2_QUANTIDADE, C2_VALOR_UNIT, C2_TOTAL_ITEM) VALUES ($1, $2, $3, $4, $5, $6)`;
        for (const item of d.itens) {
            await client.query(sqlItem, [numOrc, item.c2_servico, item.c2_descricao || '', item.c2_quantidade, item.c2_valor_unit, item.c2_total_item]);
        }

        // 4. Recalcula o total geral da proposta
        await client.query(`UPDATE TC1 SET C1_VALOR_TOTAL = (SELECT COALESCE(SUM(C2_TOTAL_ITEM), 0) FROM TC2 WHERE C2_NUM_ORC = $1) WHERE C1_NUMERO = $1`, [numOrc]);

        await client.query('COMMIT');
        res.json({ mensagem: 'Orçamento atualizado com sucesso.' });
    } catch (erro) {
        await client.query('ROLLBACK');
        res.status(500).json({ erro: erro.message });
    } finally { client.release(); }
});

// ==========================================
// ROTAS AUXILIARES E DE CONSULTA
// ==========================================
router.get('/:id/itens', async (req, res) => {
    try {
        const sql = `SELECT TC2.*, TA3.A3_NOME FROM TC2 LEFT JOIN TA3 ON TC2.C2_SERVICO = TA3.A3_COD WHERE C2_NUM_ORC = $1 ORDER BY C2_ITEM ASC`;
        const resultado = await pool.query(sql, [req.params.id]);
        res.json(resultado.rows);
    } catch (erro) { res.status(500).json({ erro: 'Erro ao buscar itens.' }); }
});

router.get('/:id', async (req, res) => {
    try {
        const sql = `SELECT TC1.*, TA1.A1_CGC FROM TC1 INNER JOIN TA1 ON TC1.C1_CLIENTE = TA1.A1_COD WHERE C1_NUMERO = $1`;
        const resultado = await pool.query(sql, [req.params.id]);
        res.json(resultado.rows[0]);
    } catch (e) { res.status(500).json({ erro: 'Erro ao buscar dados.' }); }
});

// Rota de aprovação direta via clique do CRM
router.put('/:id/aprovar-via-lead', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orcamentoId = req.params.id;
        const { lead_id } = req.body;

        await client.query(`UPDATE TC1 SET C1_STATUS = '2' WHERE C1_NUMERO = $1`, [orcamentoId]);
        await client.query(`UPDATE TC0 SET C0_FASE = '4 - Contratos', C0_ORC_APROVADO = $1, C0_DATA_ATU = CURRENT_DATE WHERE C0_COD = $2`, [orcamentoId, lead_id]);

        await client.query('COMMIT');
        res.json({ mensagem: 'Orçamento aprovado!' });
    } catch (erro) {
        await client.query('ROLLBACK');
        res.status(500).json({ erro: erro.message });
    } finally { client.release(); }
});

module.exports = router;