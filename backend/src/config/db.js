const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'mysql',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME     || 'gran_poeta',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.message);
    return;
  }
  console.log('✅ Conectado a MySQL —', process.env.DB_NAME);
  connection.release();
});

module.exports = pool.promise();