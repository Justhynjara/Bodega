-- Crear base de datos
CREATE DATABASE IF NOT EXISTS gran_poeta;
USE gran_poeta;

-- ======================
-- TABLA USUARIOS
-- ======================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    perfil ENUM('jefe_bodega','bodeguero')
);

-- ======================
-- TABLA EDITORIALES
-- ======================
CREATE TABLE editoriales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    contacto VARCHAR(100)
);

-- ======================
-- TABLA AUTORES
-- ======================
CREATE TABLE autores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    nacionalidad VARCHAR(50)
);

-- ======================
-- TABLA PRODUCTOS
-- ======================
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150),
    tipo ENUM('libro','revista','enciclopedia'),
    descripcion TEXT,
    editorial_id INT,
    FOREIGN KEY (editorial_id) REFERENCES editoriales(id)
);

-- ======================
-- RELACIÓN PRODUCTO-AUTOR
-- ======================
CREATE TABLE producto_autores (
    producto_id INT,
    autor_id INT,
    PRIMARY KEY (producto_id, autor_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (autor_id) REFERENCES autores(id)
);

-- ======================
-- TABLA BODEGAS
-- ======================
CREATE TABLE bodegas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(100),
    ubicacion VARCHAR(100)
);

-- ======================
-- INVENTARIO
-- ======================
CREATE TABLE inventario_bodega (
    bodega_id INT,
    producto_id INT,
    cantidad INT,
    PRIMARY KEY (bodega_id, producto_id),
    FOREIGN KEY (bodega_id) REFERENCES bodegas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ======================
-- MOVIMIENTOS
-- ======================
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    bodega_origen_id INT,
    bodega_destino_id INT,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bodega_origen_id) REFERENCES bodegas(id),
    FOREIGN KEY (bodega_destino_id) REFERENCES bodegas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ======================
-- DETALLE MOVIMIENTO
-- ======================
CREATE TABLE detalle_movimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id INT,
    producto_id INT,
    cantidad INT,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);