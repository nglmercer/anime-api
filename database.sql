CREATE DATABASE IF NOT EXISTS anime_db;
USE anime_db;

CREATE TABLE catalogo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    imagen_fondo VARCHAR(255),
    estado INT DEFAULT 1,
    descripcion TEXT,
    nsfw BOOLEAN DEFAULT 0,
    trailer VARCHAR(255),
    recomendacion BOOLEAN DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE temporada (
    id INT AUTO_INCREMENT PRIMARY KEY,
    catalogo_id INT,
    nombre VARCHAR(255) NOT NULL,
    portada VARCHAR(255),
    numero INT NOT NULL,
    FOREIGN KEY (catalogo_id) REFERENCES catalogo(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE capitulo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    temporada_id INT,
    reproducciones INT DEFAULT 0,
    FOREIGN KEY (temporada_id) REFERENCES temporada(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lenguaje (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    estado INT DEFAULT 1,
    capitulo_id INT,
    FOREIGN KEY (capitulo_id) REFERENCES capitulo(id) ON DELETE CASCADE
) ENGINE=InnoDB;