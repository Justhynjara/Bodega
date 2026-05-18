const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken, soloJefe } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM editoriales ORDER BY nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM editoriales WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'No encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verificarToken, soloJefe, async (req, res) => {
  const { nombre, contacto } = req.body;
  try {
    const [result] = await db.query('INSERT INTO editoriales (nombre, contacto) VALUES (?, ?)', [nombre, contacto]);
    res.status(201).json({ id: result.insertId, message: 'Editorial creada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verificarToken, soloJefe, async (req, res) => {
  const { nombre, contacto } = req.body;
  try {
    await db.query('UPDATE editoriales SET nombre=?, contacto=? WHERE id=?', [nombre, contacto, req.params.id]);
    res.json({ message: 'Editorial actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verificarToken, soloJefe, async (req, res) => {
  try {
    const [check] = await db.query('SELECT COUNT(*) AS total FROM productos WHERE editorial_id = ?', [req.params.id]);
    if (check[0].total > 0) return res.status(409).json({ message: 'No se puede eliminar: la editorial tiene productos asignados' });
    await db.query('DELETE FROM editoriales WHERE id = ?', [req.params.id]);
    res.json({ message: 'Editorial eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
