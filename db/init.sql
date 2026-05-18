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
    tipo ENUM('entrada','salida') NOT NULL,
    bodega_id INT NOT NULL,
    usuario_id INT NOT NULL,
    observacion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bodega_id) REFERENCES bodegas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ======================
-- DETALLE MOVIMIENTO
-- ======================
CREATE TABLE detalle_movimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
-- ======================
-- DATOS INICIALES
-- ======================
INSERT INTO usuarios (nombre, email, password_hash, perfil) VALUES
('Carlos Rojas', 'carlos@granpoeta.cl', '$2a$10$LhsBMVspalAo72DmWoH4ieyApqqhvaR42c1iZS2xoYETX4uQHylrq', 'jefe_bodega'),
('María Torres', 'maria@granpoeta.cl', '$2a$10$ePp5Y.zWN9jfzeRF63LYIuXatiCRnxs9EO0Q0K9MNJsfWQZcp5cbG', 'bodeguero');

INSERT INTO editoriales (nombre, contacto) VALUES
('Planeta', 'contacto@planeta.cl'),
('Alfaguara', 'contacto@alfaguara.cl'),
('Zigzag', 'contacto@zigzag.cl'),
('LOM Ediciones', 'contacto@lom.cl');

INSERT INTO bodegas (codigo, nombre, ubicacion) VALUES
('BOD-001', 'Bodega Central', 'Av. Providencia 123, Santiago'),
('BOD-002', 'Bodega Norte', 'Av. Recoleta 567, Santiago'),
('BOD-003', 'Bodega Surponiente', 'Gran Avenida 890, Santiago');



-- ======================
-- DATOS DE PRUEBA
-- ======================
INSERT INTO autores (nombre, apellido, nacionalidad) VALUES
('Pablo', 'Neruda', 'Chilena'),
('Isabel', 'Allende', 'Chilena'),
('Jorge', 'Baradit', 'Chilena'),
('Gabriela', 'Mistral', 'Chilena');

INSERT INTO productos (titulo, tipo, descripcion, editorial_id) VALUES
('Canto General', 'libro', 'Obra cumbre de Pablo Neruda', 1),
('La Casa de los Espíritus', 'libro', 'Novela de Isabel Allende', 2),
('Historia Secreta de Chile', 'libro', 'Historia alternativa de Chile', 3),
('Poemas Selectos', 'libro', 'Antología de G. Mistral', 4),
('Revista Qué Pasa', 'revista', 'Edición mensual', 1),
('Enciclopedia Chilena Vol.1', 'enciclopedia', 'Volumen 1', 3);