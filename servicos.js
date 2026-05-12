const express = require('express');
const router = express.Router();
const pool = require('../db');

// Buscar Serviços
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM TA3 ORDER BY A3_NOME ASC');
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha no BD' });
    }
});

// Criar Serviço
router.post('/', async (req, res) => {
    try {
        const dados = req.body;
        const sql = `INSERT INTO TA3 (A3_NOME, A3_DESCRIC, A3_UNIDADE, A3_VALOR_BASE) VALUES ($1, $2, $3, $4) RETURNING *`;
        const valores = [dados.a3_nome, dados.a3_descric, dados.a3_unidade, dados.a3_valor_base];
        const novo = await pool.query(sql, valores);
        res.status(201).json(novo.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao gravar serviço' });
    }
});

// Atualizar Serviço
router.put('/:id', async (req, res) => {
    try {
        const dados = req.body;
        const sql = `UPDATE TA3 SET A3_NOME=$1, A3_DESCRIC=$2, A3_UNIDADE=$3, A3_VALOR_BASE=$4 WHERE A3_COD=$5 RETURNING *`;
        const valores = [dados.a3_nome, dados.a3_descric, dados.a3_unidade, dados.a3_valor_base, req.params.id];
        const atualizado = await pool.query(sql, valores);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// Inativar/Ativar Serviço
router.patch('/:id/status', async (req, res) => {
    try {
        const atualizado = await pool.query('UPDATE TA3 SET A3_STATUS = $1 WHERE A3_COD = $2 RETURNING *', [req.body.novoStatus, req.params.id]);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao mudar status' });
    }
});

module.exports = router;