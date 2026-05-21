const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloVendedor } = require('../middlewares/authMiddleware');

// ── GET /api/ventas ── historial del vendedor en su bodega
router.get('/', verificarToken, soloVendedor, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.tipo, m.fecha, m.observacion,
             b.nombre AS bodega,
             GROUP_CONCAT(CONCAT(p.titulo,' x',dm.cantidad) SEPARATOR ', ') AS productos,
             SUM(dm.cantidad * dm.precio_unitario) AS total
      FROM movimientos m
      JOIN bodegas b ON m.bodega_id = b.id
      JOIN detalle_movimiento dm ON dm.movimiento_id = m.id
      JOIN productos p ON p.id = dm.producto_id
      WHERE m.usuario_id = ?
        AND m.tipo IN ('venta','devolucion')
      GROUP BY m.id
      ORDER BY m.fecha DESC
      LIMIT 100
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/ventas/stock ── stock disponible en la bodega del vendedor
router.get('/stock', verificarToken, soloVendedor, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ib.producto_id, ib.cantidad,
             p.titulo, p.tipo,
             e.nombre AS editorial
      FROM inventario_bodega ib
      JOIN productos p  ON p.id = ib.producto_id
      LEFT JOIN editoriales e ON e.id = p.editorial_id
      WHERE ib.bodega_id = ?
        AND ib.cantidad > 0
      ORDER BY p.titulo
    `, [req.user.bodega_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/ventas ── registrar venta
// Body: { detalle: [{producto_id, cantidad, precio_unitario}], observacion? }
router.post('/', verificarToken, soloVendedor, async (req, res) => {
  const { detalle, observacion } = req.body;
  if (!detalle || !detalle.length)
    return res.status(400).json({ message: 'Debes agregar al menos un producto' });

  const bodega_id = req.user.bodega_id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar stock para cada producto
    for (const item of detalle) {
      const [stock] = await conn.query(
        'SELECT cantidad FROM inventario_bodega WHERE bodega_id = ? AND producto_id = ?',
        [bodega_id, item.producto_id]
      );
      if (!stock[0] || stock[0].cantidad < item.cantidad) {
        await conn.rollback();
        const [prod] = await conn.query('SELECT titulo FROM productos WHERE id = ?', [item.producto_id]);
        return res.status(409).json({
          message: `Stock insuficiente para "${prod[0]?.titulo}". Disponible: ${stock[0]?.cantidad || 0}`
        });
      }
    }

    // Crear movimiento de venta
    const [mov] = await conn.query(
      'INSERT INTO movimientos (tipo, bodega_id, usuario_id, observacion) VALUES (?, ?, ?, ?)',
      ['venta', bodega_id, req.user.id, observacion || null]
    );

    // Insertar detalle y descontar stock
    for (const item of detalle) {
      await conn.query(
        'INSERT INTO detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [mov.insertId, item.producto_id, item.cantidad, item.precio_unitario || 0]
      );
      await conn.query(
        'UPDATE inventario_bodega SET cantidad = cantidad - ? WHERE bodega_id = ? AND producto_id = ?',
        [item.cantidad, bodega_id, item.producto_id]
      );
    }

    await conn.commit();
    res.status(201).json({ id: mov.insertId, message: 'Venta registrada' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── POST /api/ventas/devolucion ── registrar devolución (suma stock)
// Body: { detalle: [{producto_id, cantidad, precio_unitario}], observacion? }
router.post('/devolucion', verificarToken, soloVendedor, async (req, res) => {
  const { detalle, observacion } = req.body;
  if (!detalle || !detalle.length)
    return res.status(400).json({ message: 'Debes agregar al menos un producto' });

  const bodega_id = req.user.bodega_id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mov] = await conn.query(
      'INSERT INTO movimientos (tipo, bodega_id, usuario_id, observacion) VALUES (?, ?, ?, ?)',
      ['devolucion', bodega_id, req.user.id, observacion || null]
    );

    for (const item of detalle) {
      await conn.query(
        'INSERT INTO detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [mov.insertId, item.producto_id, item.cantidad, item.precio_unitario || 0]
      );
      // Devolucion suma stock
      await conn.query(`
        INSERT INTO inventario_bodega (bodega_id, producto_id, cantidad)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)
      `, [bodega_id, item.producto_id, item.cantidad]);
    }

    await conn.commit();
    res.status(201).json({ id: mov.insertId, message: 'Devolución registrada' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
