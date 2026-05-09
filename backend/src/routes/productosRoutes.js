const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken, soloJefe } = require('../middlewares/authMiddleware');

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

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT p.*, e.nombre AS editorial FROM productos p LEFT JOIN editoriales e ON p.editorial_id = e.id WHERE p.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verificarToken, soloJefe, async (req, res) => {
  const { titulo, tipo, descripcion, editorial_id } = req.body;
  try {
    const [result] = await db.query('INSERT INTO productos (titulo, tipo, descripcion, editorial_id) VALUES (?, ?, ?, ?)', [titulo, tipo, descripcion, editorial_id]);
    res.status(201).json({ id: result.insertId, message: 'Producto creado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verificarToken, soloJefe, async (req, res) => {
  const { titulo, tipo, descripcion, editorial_id } = req.body;
  try {
    await db.query('UPDATE productos SET titulo=?, tipo=?, descripcion=?, editorial_id=? WHERE id=?', [titulo, tipo, descripcion, editorial_id, req.params.id]);
    res.json({ message: 'Producto actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verificarToken, soloJefe, async (req, res) => {
  try {
    const [stock] = await db.query('SELECT SUM(cantidad) AS total FROM inventario_bodega WHERE producto_id = ?', [req.params.id]);
    if (stock[0].total > 0) return res.status(409).json({ message: 'No se puede eliminar: el producto tiene stock en bodegas' });
    await db.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
