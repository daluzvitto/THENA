const express = require('express');
const router = express.Router();
const pool = require('../db'); // Chama a conexão com o banco

// Buscar Clientes
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM TA1 ORDER BY A1_COD DESC');
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha ao buscar clientes.' });
    }
});

// Criar Cliente (POST)
router.post('/', async (req, res) => {
    try {
        const d = req.body;
        const sql = `
            INSERT INTO TA1 (
                A1_TIPO, A1_NOME, A1_NREDUZ, A1_CGC, A1_FONE, A1_EMAIL, 
                A1_CANAL, A1_CEP, A1_ENDERE, A1_NUM, A1_BAIRRO, A1_CIDADE, 
                A1_UF, A1_CATEG, A1_ORIGEM, A1_POTENC, A1_CONPAG, A1_OBS, A1_STATUS
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            ) RETURNING *
        `;

        const valores = [
            d.a1_tipo || 'PF',
            d.a1_nome || 'Sem Nome',
            d.a1_nreduz || '',
            d.a1_cgc || '', 
            d.a1_fone || '',
            d.a1_email || '',
            d.a1_canal || '',
            d.a1_cep || '',
            d.a1_endere || '',
            d.a1_num || '',
            d.a1_bairro || '',
            d.a1_cidade || '',
            d.a1_uf || '',
            d.a1_categ || 'Cliente Final',
            d.a1_origem || 'Indicação',
            d.a1_potenc || 'B - Médio',
            d.a1_conpag || '',
            d.a1_obs || '',
            d.a1_status || 'Ativo'
        ];
        
        const novo = await pool.query(sql, valores);
        res.status(201).json(novo.rows[0]);
    } catch (erro) {
        console.error("🕵️ ERRO AO CRIAR CLIENTE:", erro.message);
        res.status(500).json({ erro: 'Bloqueio do Banco: ' + erro.message });
    }
});

// Atualizar Cliente (PUT)
router.put('/:id', async (req, res) => {
    try {
        const d = req.body;
        const sql = `
            UPDATE TA1 SET 
                A1_TIPO = $1, A1_NOME = $2, A1_NREDUZ = $3, A1_CGC = $4, 
                A1_FONE = $5, A1_EMAIL = $6, A1_CANAL = $7, A1_CEP = $8, 
                A1_ENDERE = $9, A1_NUM = $10, A1_BAIRRO = $11, A1_CIDADE = $12, 
                A1_UF = $13, A1_CATEG = $14, A1_ORIGEM = $15, A1_POTENC = $16, 
                A1_CONPAG = $17, A1_OBS = $18, A1_STATUS = $19
            WHERE A1_COD = $20 RETURNING *
        `;
            
        const valores = [
            d.a1_tipo || 'PF',
            d.a1_nome || '', 
            d.a1_nreduz || '',
            d.a1_cgc || '', 
            d.a1_fone || '', 
            d.a1_email || '', 
            d.a1_canal || '',
            d.a1_cep || '',
            d.a1_endere || '', 
            d.a1_num || '',
            d.a1_bairro || '', 
            d.a1_cidade || '', 
            d.a1_uf || '', 
            d.a1_categ || 'Cliente Final', 
            d.a1_origem || 'Indicação', 
            d.a1_potenc || 'B - Médio', 
            d.a1_conpag || '',
            d.a1_obs || '',
            d.a1_status || 'Ativo',
            req.params.id // Parâmetro $20
        ];
        
        const atualizado = await pool.query(sql, valores);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        console.error("🕵️ ERRO AO ATUALIZAR CLIENTE:", erro.message);
        res.status(500).json({ erro: 'Bloqueio do Banco: ' + erro.message });
    }
});

// Inativar/Ativar Cliente
router.patch('/:id/status', async (req, res) => {
    try {
        const atualizado = await pool.query('UPDATE TA1 SET A1_STATUS = $1 WHERE A1_COD = $2 RETURNING *', [req.body.novoStatus, req.params.id]);
        res.json(atualizado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao mudar status' });
    }
});

module.exports = router;