const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken, soloJefe } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM autores ORDER BY apellido, nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM autores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verificarToken, soloJefe, async (req, res) => {
  const { nombre, apellido, nacionalidad } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO autores (nombre, apellido, nacionalidad) VALUES (?, ?, ?)',
      [nombre, apellido, nacionalidad]
    );
    res.status(201).json({ id: result.insertId, message: 'Autor creado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verificarToken, soloJefe, async (req, res) => {
  const { nombre, apellido, nacionalidad } = req.body;
  try {
    await db.query('UPDATE autores SET nombre=?, apellido=?, nacionalidad=? WHERE id=?',
      [nombre, apellido, nacionalidad, req.params.id]);
    res.json({ message: 'Autor actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verificarToken, soloJefe, async (req, res) => {
  try {
    const [check] = await db.query('SELECT COUNT(*) AS total FROM producto_autores WHERE autor_id = ?', [req.params.id]);
    if (check[0].total > 0) return res.status(409).json({ message: 'No se puede eliminar: el autor tiene productos asignados' });
    await db.query('DELETE FROM autores WHERE id = ?', [req.params.id]);
    res.json({ message: 'Autor eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
