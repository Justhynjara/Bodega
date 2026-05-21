-- ============================================================
-- EL GRAN POETA — Base de datos
-- ============================================================
CREATE DATABASE IF NOT EXISTS gran_poeta;
USE gran_poeta;

-- ============================================================
-- USUARIOS
-- perfiles: jefe_bodega | bodeguero | vendedor
-- bodega_id: solo aplica para vendedor (asignado a una bodega)
-- ============================================================
CREATE TABLE usuarios (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100)  NOT NULL,
    email        VARCHAR(100)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    perfil       ENUM('jefe_bodega','bodeguero','vendedor') NOT NULL,
    bodega_id    INT           DEFAULT NULL,
    FOREIGN KEY (bodega_id) REFERENCES bodegas(id)
);

-- ============================================================
-- EDITORIALES
-- ============================================================
CREATE TABLE editoriales (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    contacto VARCHAR(100)
);

-- ============================================================
-- AUTORES
-- ============================================================
CREATE TABLE autores (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    apellido     VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(50)
);

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE TABLE productos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    titulo       VARCHAR(150) NOT NULL,
    tipo         ENUM('libro','revista','enciclopedia') NOT NULL,
    descripcion  TEXT,
    editorial_id INT,
    FOREIGN KEY (editorial_id) REFERENCES editoriales(id)
);

-- ============================================================
-- PRODUCTO — AUTOR (relación muchos a muchos)
-- ============================================================
CREATE TABLE producto_autores (
    producto_id INT NOT NULL,
    autor_id    INT NOT NULL,
    PRIMARY KEY (producto_id, autor_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (autor_id)    REFERENCES autores(id)
);

-- ============================================================
-- BODEGAS
-- ============================================================
CREATE TABLE bodegas (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    codigo    VARCHAR(50)  UNIQUE NOT NULL,
    nombre    VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100)
);

-- ============================================================
-- INVENTARIO POR BODEGA
-- cantidad: unidades disponibles en esa bodega
-- ============================================================
CREATE TABLE inventario_bodega (
    bodega_id   INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad    INT NOT NULL DEFAULT 0,
    PRIMARY KEY (bodega_id, producto_id),
    FOREIGN KEY (bodega_id)   REFERENCES bodegas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ============================================================
-- MOVIMIENTOS
-- tipos:
--   entrada   → ingreso de stock a una bodega
--   salida    → egreso de stock de una bodega (bodeguero)
--   venta     → venta registrada por un vendedor (resta stock)
--   devolucion→ devolución registrada por un vendedor (suma stock)
-- ============================================================
CREATE TABLE movimientos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    tipo        ENUM('entrada','salida','venta','devolucion') NOT NULL,
    bodega_id   INT  NOT NULL,
    usuario_id  INT  NOT NULL,
    observacion TEXT,
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bodega_id)  REFERENCES bodegas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- DETALLE DE MOVIMIENTO
-- precio_unitario: precio de venta (aplica en ventas)
-- ============================================================
CREATE TABLE detalle_movimiento (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id   INT            NOT NULL,
    producto_id     INT            NOT NULL,
    cantidad        INT            NOT NULL,
    precio_unitario DECIMAL(10,2)  DEFAULT 0,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id),
    FOREIGN KEY (producto_id)   REFERENCES productos(id)
);

-- ============================================================
-- BODEGAS (datos iniciales)
-- Se insertan primero porque usuarios.bodega_id las referencia
-- ============================================================
INSERT INTO bodegas (codigo, nombre, ubicacion) VALUES
('BOD-001', 'Bodega Central',     'Av. Providencia 123, Santiago'),
('BOD-002', 'Bodega Norte',       'Av. Recoleta 567, Santiago'),
('BOD-003', 'Bodega Surponiente', 'Gran Avenida 890, Santiago');

-- ============================================================
-- USUARIOS (datos iniciales)
-- Contraseña de todos: password123
-- Hash generado con bcryptjs rounds=10
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, perfil, bodega_id) VALUES
('Carlos Rojas',  'carlos@granpoeta.cl',   '$2a$10$LhsBMVspalAo72DmWoH4ieyApqqhvaR42c1iZS2xoYETX4uQHylrq', 'jefe_bodega', NULL),
('María Torres',  'maria@granpoeta.cl',    '$2a$10$LhsBMVspalAo72DmWoH4ieyApqqhvaR42c1iZS2xoYETX4uQHylrq', 'bodeguero',   NULL),
('Juan Vendedor', 'juan@granpoeta.cl',     '$2a$10$LhsBMVspalAo72DmWoH4ieyApqqhvaR42c1iZS2xoYETX4uQHylrq', 'vendedor',    1),
('Ana Vendedora', 'ana@granpoeta.cl',      '$2a$10$LhsBMVspalAo72DmWoH4ieyApqqhvaR42c1iZS2xoYETX4uQHylrq', 'vendedor',    2),
('Luis Vendedor', 'luis@granpoeta.cl',     '$2a$10$LhsBMVspalAo72DmWoH4ieyApqqhvaR42c1iZS2xoYETX4uQHylrq', 'vendedor',    3);

-- ============================================================
-- EDITORIALES (datos iniciales)
-- ============================================================
INSERT INTO editoriales (nombre, contacto) VALUES
('Planeta',       'contacto@planeta.cl'),
('Alfaguara',     'contacto@alfaguara.cl'),
('Zigzag',        'contacto@zigzag.cl'),
('LOM Ediciones', 'contacto@lom.cl');

-- ============================================================
-- AUTORES (datos de prueba)
-- ============================================================
INSERT INTO autores (nombre, apellido, nacionalidad) VALUES
('Pablo',    'Neruda',  'Chilena'),
('Isabel',   'Allende', 'Chilena'),
('Jorge',    'Baradit', 'Chilena'),
('Gabriela', 'Mistral', 'Chilena');

-- ============================================================
-- PRODUCTOS (datos de prueba)
-- ============================================================
INSERT INTO productos (titulo, tipo, descripcion, editorial_id) VALUES
('Canto General',              'libro',        'Obra cumbre de Pablo Neruda',       1),
('La Casa de los Espíritus',   'libro',        'Novela de Isabel Allende',           2),
('Historia Secreta de Chile',  'libro',        'Historia alternativa de Chile',      3),
('Poemas Selectos',            'libro',        'Antología de Gabriela Mistral',      4),
('Revista Qué Pasa',           'revista',      'Edición mensual',                    1),
('Enciclopedia Chilena Vol.1', 'enciclopedia', 'Volumen 1',                          3);

-- ============================================================
-- STOCK INICIAL (10 unidades de cada producto en cada bodega)
-- ============================================================
INSERT INTO inventario_bodega (bodega_id, producto_id, cantidad) VALUES
(1,1,10),(1,2,10),(1,3,10),(1,4,10),(1,5,10),(1,6,10),
(2,1,10),(2,2,10),(2,3,10),(2,4,10),(2,5,10),(2,6,10),
(3,1,10),(3,2,10),(3,3,10),(3,4,10),(3,5,10),(3,6,10);
