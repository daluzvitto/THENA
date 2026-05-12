const express = require('express');
const router = express.Router();
const pool = require('../db');

// Buscar Fornecedores
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM TA2 ORDER BY A2_COD DESC');
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha no BD' });
    }
});

// Criar Fornecedor
router.post('/', async (req, res) => {
    try {
        const dados = req.body;
        const check = await pool.query('SELECT A2_COD FROM TA2 WHERE A2_CGC = $1', [dados.a2_cgc]);
        if (check.rows.length > 0) return res.status(400).json({ erro: 'CNPJ já cadastrado!' });

        const sql = `INSERT INTO TA2 (A2_TIPO, A2_NOME, A2_NREDUZ, A2_CGC, A2_FONE, A2_EMAIL, A2_CEP, A2_ENDERE, A2_NUM, A2_BAIRRO, A2_CIDADE, A2_UF, A2_CATEG, A2_BANCO, A2_AGENCIA, A2_CONTA, A2_OBS) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`;
        const valores = [dados.a2_tipo, dados.a2_nome, dados.a2_nreduz, dados.a2_cgc, dados.a2_fone, dados.a2_email, dados.a2_cep, dados.a2_endere, dados.a2_num, dados.a2_bairro, dados.a2_cidade, dados.a2_uf, dados.a2_categ, dados.a2_banco, dados.a2_agencia, dados.a2_conta, dados.a2_obs];
        
        const novo = await pool.query(sql, valores);
        res.status(201).json(novo.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao gravar' });
    }
});

// Atualizar Fornecedor
router.put('/:id', async (req, res) => {
    try {
        const dados = req.body;
        const check = await pool.query('SELECT A2_COD FROM TA2 WHERE A2_CGC = $1 AND A2_COD != $2', [dados.a2_cgc, req.params.id]);
        if (check.rows.length > 0) return res.status(400).json({ erro: 'CNPJ pertence a outro fornecedor!' });

        const sql = `UPDATE TA2 SET A2_TIPO=$1, A2_NOME=$2, A2_NREDUZ=$3, A2_CGC=$4, A2_FONE=$5, A2_EMAIL=$6, A2_CEP=$7, A2_ENDERE=$8, A2_NUM=$9, A2_BAIRRO=$10, A2_CIDADE=$11, A2_UF=$12, A2_CATEG=$13, A2_BANCO=$14, A2_AGENCIA=$15, A2_CONTA=$16, A2_OBS=$17 WHERE A2_COD=$18 RETURNING *`;
        const valores = [dados.a2_tipo, dados.a2_nome, dados.a2_nreduz, dados.a2_cgc, dados.a2_fone, dados.a2_email, dados.a2_cep, dados.a2_endere, dados.a2_num, dados.a2_bairro, dados.a2_cidade, dados.a2_uf, dados.a2_categ, dados.a2_banco, dados.a2_agencia, dados.a2_conta, dados.a2_obs, req.params.id];
        
        const atualizado = await pool.query(sql, valores);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// Inativar/Ativar Fornecedor
router.patch('/:id/status', async (req, res) => {
    try {
        const atualizado = await pool.query('UPDATE TA2 SET A2_STATUS = $1 WHERE A2_COD = $2 RETURNING *', [req.body.novoStatus, req.params.id]);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao mudar status' });
    }
});

module.exports = router;