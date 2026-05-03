const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const db = require('../config/db');

// Obtener productos (protegido)
router.get('/', verificarToken, (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;