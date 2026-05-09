const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token requerido' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const soloJefe = (req, res, next) => {
  if (req.user?.perfil !== 'jefe_bodega') {
    return res.status(403).json({ message: 'Acceso solo para jefe de bodega' });
  }
  next();
};

module.exports = { verificarToken, soloJefe };
