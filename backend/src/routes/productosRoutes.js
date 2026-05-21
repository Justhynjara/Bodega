const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloJefe } = require('../middlewares/authMiddleware');

// ── GET /api/productos ── listar todos
router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, e.nombre AS editorial
      FROM productos p
      LEFT JOIN editoriales e ON p.editorial_id = e.id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/productos/:id ── obtener uno
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, e.nombre AS editorial
      FROM productos p
      LEFT JOIN editoriales e ON p.editorial_id = e.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/productos ── crear producto + stock inicial opcional
// Body: { titulo, tipo, descripcion, editorial_id, bodega_id?, cantidad? }
router.post('/', verificarToken, soloJefe, async (req, res) => {
  const { titulo, tipo, descripcion, editorial_id, bodega_id, cantidad } = req.body;
  if (!titulo || !tipo) return res.status(400).json({ message: 'Título y tipo son obligatorios' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insertar producto
    const [result] = await conn.query(
      'INSERT INTO productos (titulo, tipo, descripcion, editorial_id) VALUES (?, ?, ?, ?)',
      [titulo, tipo, descripcion || null, editorial_id || null]
    );
    const productoId = result.insertId;

    // 2. Si se indicó bodega y cantidad, registrar stock inicial
    if (bodega_id && cantidad && cantidad > 0) {
      // Insertar en inventario
      await conn.query(`
        INSERT INTO inventario_bodega (bodega_id, producto_id, cantidad)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)
      `, [bodega_id, productoId, cantidad]);

      // Registrar movimiento de entrada
      const [mov] = await conn.query(
        'INSERT INTO movimientos (tipo, bodega_id, usuario_id, observacion) VALUES (?, ?, ?, ?)',
        ['entrada', bodega_id, req.user.id, 'Stock inicial al crear producto']
      );
      await conn.query(
        'INSERT INTO detalle_movimiento (movimiento_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [mov.insertId, productoId, cantidad, 0]
      );
    }

    await conn.commit();
    res.status(201).json({ id: productoId, message: 'Producto creado' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── PUT /api/productos/:id ── actualizar
router.put('/:id', verificarToken, soloJefe, async (req, res) => {
  const { titulo, tipo, descripcion, editorial_id } = req.body;
  try {
    await db.query(
      'UPDATE productos SET titulo=?, tipo=?, descripcion=?, editorial_id=? WHERE id=?',
      [titulo, tipo, descripcion, editorial_id, req.params.id]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/productos/:id ── eliminar (solo si no tiene stock)
router.delete('/:id', verificarToken, soloJefe, async (req, res) => {
  try {
    const [stock] = await db.query(
      'SELECT COALESCE(SUM(cantidad),0) AS total FROM inventario_bodega WHERE producto_id = ?',
      [req.params.id]
    );
    if (stock[0].total > 0)
      return res.status(409).json({ message: `No se puede eliminar: el producto tiene ${stock[0].total} unidades en stock` });

    await db.query('DELETE FROM producto_autores WHERE producto_id = ?', [req.params.id]);
    await db.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
