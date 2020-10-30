const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
});

pool.on('connection', async(poolConnection) => {
    console.log('pool on new connection');
});

process.on('SIGINT', async () => {
    pool.end();
});

module.exports = pool;