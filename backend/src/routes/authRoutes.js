const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const usuario = rows[0];
    const passwordOk = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordOk) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, perfil: usuario.perfil } });
  } catch (err) {
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
});

router.post('/registro', async (req, res) => {
  const { nombre, email, password, perfil } = req.body;
  if (!nombre || !email || !password || !perfil) return res.status(400).json({ message: 'Todos los campos son requeridos' });
  if (!['jefe_bodega', 'bodeguero'].includes(perfil)) return res.status(400).json({ message: 'Perfil inválido' });

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, perfil) VALUES (?, ?, ?, ?)',
      [nombre, email, password_hash, perfil]
    );
    res.status(201).json({ message: 'Usuario creado', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El email ya está registrado' });
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
});

module.exports = router;
