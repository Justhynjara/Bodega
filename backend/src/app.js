const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes        = require('./routes/authRoutes');
const productosRoutes   = require('./routes/productosRoutes');
const bodegasRoutes     = require('./routes/bodegasRoutes');
const inventarioRoutes  = require('./routes/inventarioRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const editorialesRoutes = require('./routes/editoriales');
const autoresRoutes     = require('./routes/autores');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',        authRoutes);
app.use('/api/productos',   productosRoutes);
app.use('/api/bodegas',     bodegasRoutes);
app.use('/api/inventario',  inventarioRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/editoriales', editorialesRoutes);
app.use('/api/autores',     autoresRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', proyecto: 'El Gran Poeta' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
