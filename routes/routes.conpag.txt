const express = require('express');
const router = express.Router();
const pool = require('../db'); // Chama a conexão com o banco

// 1. Criar nova condição (POST)
router.post('/', async (req, res) => {
    const { a4_nome, a4_tipo, a4_regra } = req.body;
    
    try {
        // PostgreSQL usa $1, $2, $3 em vez de ?, ?, ?
        const query = `
            INSERT INTO TA4 (a4_nome, a4_tipo, a4_regra, a4_status) 
            VALUES ($1, $2, $3, 'Ativo')
        `;
        // No módulo pg do Postgres, o comando geralmente é pool.query em vez de db.execute
        await pool.query(query, [a4_nome, a4_tipo, a4_regra]); 
        
        res.status(201).json({ mensagem: "Sucesso!" });
    } catch (erro) {
        console.error("ERRO AO GRAVAR CONPAG:", erro); // <- Isto vai mostrar o erro real no terminal!
        res.status(500).json({ erro: "Erro ao gravar no banco." });
    }
});

// 2. Listar condições (GET)
router.get('/', async (req, res) => {
    try {
        const query = `SELECT * FROM TA4 ORDER BY a4_cod ASC`;
        // Dependendo de como configurou o 'pg', pode ser apenas await pool.query(query)
        const resultado = await pool.query(query);
        // O Postgres retorna os dados dentro da propriedade .rows
        res.status(200).json(resultado.rows ? resultado.rows : resultado[0] || resultado);
    } catch (erro) {
        console.error("ERRO AO BUSCAR CONPAG:", erro);
        res.status(500).json({ erro: "Erro ao buscar dados." });
    }
});

// 3. Atualizar (PUT)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { a4_nome, a4_tipo, a4_regra } = req.body;
    try {
        const query = `UPDATE TA4 SET a4_nome = $1, a4_tipo = $2, a4_regra = $3 WHERE a4_cod = $4`;
        await pool.query(query, [a4_nome, a4_tipo, a4_regra, id]);
        res.status(200).json({ mensagem: "Atualizado!" });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao atualizar." });
    }
});

// 4. Mudar Status (PATCH)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { novoStatus } = req.body;
    try {
        await pool.query(`UPDATE TA4 SET a4_status = $1 WHERE a4_cod = $2`, [novoStatus, id]);
        res.status(200).json({ mensagem: "Status alterado." });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao mudar status." });
    }
});

module.exports = router;