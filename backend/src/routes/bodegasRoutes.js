const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken, soloJefe } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bodegas ORDER BY nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bodegas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'No encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verificarToken, soloJefe, async (req, res) => {
  const { nombre, codigo, ubicacion } = req.body;
  try {
    const [result] = await db.query('INSERT INTO bodegas (nombre, codigo, ubicacion) VALUES (?, ?, ?)', [nombre, codigo, ubicacion]);
    res.status(201).json({ id: result.insertId, message: 'Bodega creada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verificarToken, soloJefe, async (req, res) => {
  const { nombre, codigo, ubicacion } = req.body;
  try {
    await db.query('UPDATE bodegas SET nombre=?, codigo=?, ubicacion=? WHERE id=?', [nombre, codigo, ubicacion, req.params.id]);
    res.json({ message: 'Bodega actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verificarToken, soloJefe, async (req, res) => {
  try {
    const [stock] = await db.query('SELECT SUM(cantidad) AS total FROM inventario_bodega WHERE bodega_id = ?', [req.params.id]);
    if (stock[0].total > 0) return res.status(409).json({ message: 'No se puede eliminar: la bodega tiene stock' });
    await db.query('DELETE FROM bodegas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bodega eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
