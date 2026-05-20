const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'THENA',
    password: 'M29d03l19v97+', // <-- Confirme sua senha aqui
    port: 5432,
});

module.exports = pool;