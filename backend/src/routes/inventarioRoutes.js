const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ib.bodega_id, ib.producto_id, ib.cantidad,
             b.nombre AS bodega, b.codigo AS bodega_codigo,
             p.titulo, p.tipo
      FROM inventario_bodega ib
      JOIN bodegas b ON ib.bodega_id = b.id
      JOIN productos p ON ib.producto_id = p.id
      ORDER BY b.nombre, p.titulo
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/bodega/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ib.cantidad, p.id AS producto_id, p.titulo, p.tipo
      FROM inventario_bodega ib
      JOIN productos p ON ib.producto_id = p.id
      WHERE ib.bodega_id = ?
      ORDER BY p.titulo
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
