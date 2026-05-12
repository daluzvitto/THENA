const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// CABEÇALHO DO ORÇAMENTO (TC1)
// ==========================================

// Listar Orçamentos
router.get('/', async (req, res) => {
    try {
        // Usamos LEFT JOIN para garantir que o orçamento apareça sempre!
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
        console.error("🕵️ ERRO AO LISTAR ORÇAMENTOS:", erro.message);
        res.status(500).json({ erro: 'Falha ao buscar orçamentos.' });
    }
});

// Criar novo Cabeçalho de Orçamento
router.post('/', async (req, res) => {
    // Usamos um 'client' do pool para garantir que as duas operações ocorram juntas (Transação)
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia a transação
        
        const d = req.body;
        
        // 1. Cria o Orçamento na TC1
        const sqlOrc = `
            INSERT INTO TC1 (C1_LEAD, C1_CLIENTE, C1_TITULO, C1_COMPLEMENTO, C1_DATA_EMISSAO, C1_VALIDADE, C1_COND_PAGTO, C1_STATUS) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, '1 - Em Digitação') RETURNING *
        `;
        const resultadoOrc = await client.query(sqlOrc, [d.lead_id, d.cliente_id, d.titulo, d.complemento, d.data_emissao, d.validade, d.cond_pagto]);
        const novoOrc = resultadoOrc.rows[0];

        // 2. ATUALIZAÇÃO AUTOMÁTICA: Move o Lead para a Fase 4 e marca como Quente
        const sqlUpdateLead = `
            UPDATE TC0 
            SET C0_FASE = '4 - Em Negociação', 
                C0_DATA_ATU = CURRENT_DATE 
            WHERE C0_COD = $1
        `;
        await client.query(sqlUpdateLead, [d.lead_id]);

        await client.query('COMMIT'); // Finaliza e grava as duas alterações
        res.status(201).json(novoOrc);

    } catch (erro) {
        await client.query('ROLLBACK'); // Se der erro em um, cancela os dois
        console.error("Erro na transação de orçamento:", erro.message);
        res.status(500).json({ erro: 'Falha ao criar orçamento e atualizar Lead.' });
    } finally {
        client.release();
    }
});

// ==========================================
// ITENS DO ORÇAMENTO (TC2)
// ==========================================

// Buscar itens de um orçamento específico
router.get('/:id/itens', async (req, res) => {
    try {
        const sql = `
            SELECT TC2.*, TA3.A3_NOME 
            FROM TC2 
            LEFT JOIN TA3 ON TC2.C2_SERVICO = TA3.A3_COD
            WHERE C2_NUM_ORC = $1 ORDER BY C2_ITEM ASC
        `;
        const resultado = await pool.query(sql, [req.params.id]);
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar itens.' });
    }
});

// Adicionar um Item ao Orçamento
router.post('/:id/itens', async (req, res) => {
    try {
        const numOrc = req.params.id;
        const d = req.body;
        
        const qtd = parseFloat(d.quantidade) || 0;
        const vUnit = parseFloat(d.valor_unit) || 0;
        const totalItem = qtd * vUnit;

        const sqlItem = `
            INSERT INTO TC2 (C2_NUM_ORC, C2_SERVICO, C2_DESCRICAO, C2_QUANTIDADE, C2_VALOR_UNIT, C2_TOTAL_ITEM, C2_OBS) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        await pool.query(sqlItem, [numOrc, d.servico_id, d.descricao || '', qtd, vUnit, totalItem, d.obs || '']);
        
        const sqlTotal = `
            UPDATE TC1 SET C1_VALOR_TOTAL = (
                SELECT COALESCE(SUM(C2_TOTAL_ITEM), 0) FROM TC2 WHERE C2_NUM_ORC = $1
            ) WHERE C1_NUMERO = $1
        `;
        await pool.query(sqlTotal, [numOrc]);

        res.status(201).json({ mensagem: "Item inserido" });
    } catch (erro) {
        console.error("🕵️ ERRO DETETADO NO ITEM:", erro.message);
        // Devolve o erro real para o ecrã
        res.status(500).json({ erro: 'Bloqueio do Banco: ' + erro.message });
    }
});

// Remover Item do Orçamento
router.delete('/:id/itens/:idItem', async (req, res) => {
    try {
        const numOrc = req.params.id;
        const idItem = req.params.idItem;

        // 1. Deleta o Item
        await pool.query('DELETE FROM TC2 WHERE C2_ITEM = $1', [idItem]);

        // 2. Recalcula o Total na TC1
        const sqlAtualizaTotal = `
            UPDATE TC1 SET C1_VALOR_TOTAL = (SELECT COALESCE(SUM(C2_TOTAL_ITEM), 0) FROM TC2 WHERE C2_NUM_ORC = $1)
            WHERE C1_NUMERO = $1
        `;
        await pool.query(sqlAtualizaTotal, [numOrc]);

        res.json({ mensagem: 'Item removido e total recalculado.' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao deletar item.' });
    }
});

// Buscar UM orçamento específico para edição
router.get('/:id', async (req, res) => {
    try {
        const sql = `
            SELECT TC1.*, TA1.A1_CGC 
            FROM TC1 
            INNER JOIN TA1 ON TC1.C1_CLIENTE = TA1.A1_COD 
            WHERE C1_NUMERO = $1
        `;
        const resultado = await pool.query(sql, [req.params.id]);
        res.json(resultado.rows[0]);
    } catch (e) { res.status(500).json({ erro: 'Erro ao buscar dados do orçamento.' }); }
});

// ATUALIZAR Cabeçalho do Orçamento (PUT)
router.put('/:id', async (req, res) => {
    try {
        const d = req.body;
        const sql = `
            UPDATE TC1 SET 
                C1_TITULO = $1, C1_COMPLEMENTO = $2, 
                C1_DATA_EMISSAO = $3, C1_VALIDADE = $4, C1_COND_PAGTO = $5 
            WHERE C1_NUMERO = $6 RETURNING *
        `;
        const valores = [d.titulo, d.complemento, d.data_emissao, d.validade, d.cond_pagto, req.params.id];
        const atualizado = await pool.query(sql, valores);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar orçamento.' });
    }
});

module.exports = router;