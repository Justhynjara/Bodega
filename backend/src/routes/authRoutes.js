const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
require('dotenv').config();

// ── POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña requeridos' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciales incorrectas' });

    // bodega_id incluido en el token para que ventasRoutes pueda leerlo
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, perfil: usuario.perfil, bodega_id: usuario.bodega_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      token,
      usuario: {
        id:        usuario.id,
        nombre:    usuario.nombre,
        email:     usuario.email,
        perfil:    usuario.perfil,
        bodega_id: usuario.bodega_id
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
});

// ── POST /api/auth/registro (solo jefe puede crear usuarios desde el sistema)
router.post('/registro', async (req, res) => {
  const { nombre, email, password, perfil, bodega_id } = req.body;
  if (!nombre || !email || !password || !perfil)
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  if (!['jefe_bodega','bodeguero','vendedor'].includes(perfil))
    return res.status(400).json({ message: 'Perfil inválido' });

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, perfil, bodega_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, password_hash, perfil, bodega_id || null]
    );
    res.status(201).json({ message: 'Usuario creado', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'El email ya está registrado' });
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
});

module.exports = router;
