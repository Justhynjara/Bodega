const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.tipo, m.fecha, m.observacion,
             u.nombre AS usuario, b.nombre AS bodega
      FROM movimientos m
      JOIN usuarios u ON m.usuario_id = u.id
      JOIN bodegas b ON m.bodega_id = b.id
      ORDER BY m.fecha DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [movimiento] = await db.query(`
      SELECT m.*, u.nombre AS usuario, b.nombre AS bodega
      FROM movimientos m
      JOIN usuarios u ON m.usuario_id = u.id
      JOIN bodegas b ON m.bodega_id = b.id
      WHERE m.id = ?
    `, [req.params.id]);
    if (movimiento.length === 0) return res.status(404).json({ message: 'No encontrado' });
    const [detalle] = await db.query(`
      SELECT dm.cantidad, dm.precio_unitario, p.titulo, p.tipo
      FROM detalle_movimiento dm
      JOIN productos p ON dm.producto_id = p.id
      WHERE dm.movimiento_id = ?
    `, [req.params.id]);
    res.json({ ...movimiento[0], detalle });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verificarToken, async (req, res) => {
  const { tipo, bodega_id, observacion, detalle } = req.body;
  if (!tipo || !bodega_id || !detalle || detalle.length === 0)
    return res.status(400).json({ message: 'Datos incompletos' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [mov] = await conn.query(
      'INSERT INTO movimientos (tipo, bodega_id, usuario_id, observacion) VALUES (?, ?, ?, ?)',
      [tipo, bodega_id, req.user.id, observacion]
    );
    const movimientoId = mov.insertId;

    for (const item of detalle) {
      await conn.query(
        'INSERT INTO detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [movimientoId, item.producto_id, item.cantidad, item.precio_unitario || 0]
      );
      if (tipo === 'entrada') {
        await conn.query(`
          INSERT INTO inventario_bodega (bodega_id, producto_id, cantidad)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)
        `, [bodega_id, item.producto_id, item.cantidad]);
      } else if (tipo === 'salida') {
        const [stock] = await conn.query(
          'SELECT cantidad FROM inventario_bodega WHERE bodega_id = ? AND producto_id = ?',
          [bodega_id, item.producto_id]
        );
        if (!stock[0] || stock[0].cantidad < item.cantidad) {
          await conn.rollback();
          return res.status(409).json({ message: `Stock insuficiente para producto ID ${item.producto_id}` });
        }
        await conn.query(
          'UPDATE inventario_bodega SET cantidad = cantidad - ? WHERE bodega_id = ? AND producto_id = ?',
          [item.cantidad, bodega_id, item.producto_id]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: 'Movimiento registrado', id: movimientoId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
