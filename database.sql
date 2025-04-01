-- database.sql CORREGIDO --

-- Create database if it doesn't exist (Opcional, tu script Node.js ya lo hace)
-- CREATE DATABASE IF NOT EXISTS anime_db;

-- Ensure we are using the correct database
USE anime_db;

-- Create tables only if they don't exist
-- Definiciones ajustadas para coincidir con el validador

CREATE TABLE IF NOT EXISTS catalogo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE, -- <<< CORREGIDO: Añadido UNIQUE aquí
    imagen_fondo VARCHAR(255),
    estado INT DEFAULT 1,                -- Permite NULL (validador espera nullable: YES)
    descripcion TEXT,                    -- Permite NULL (validador espera nullable: YES)
    nsfw BOOLEAN DEFAULT 0,              -- BOOLEAN es TINYINT(1), permite NULL (validador espera nullable: YES)
    trailer VARCHAR(255),                -- Permite NULL (validador espera nullable: YES)
    recomendacion BOOLEAN DEFAULT 0      -- BOOLEAN es TINYINT(1), permite NULL (validador espera nullable: YES)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS temporadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anime_id INT NOT NULL,              -- <<< CORREGIDO: Añadido NOT NULL aquí
    numero INT NOT NULL,
    nombre VARCHAR(255),                 -- Permite NULL (validador espera nullable: YES)
    descripcion TEXT,                    -- Permite NULL (validador espera nullable: YES)
    portada VARCHAR(255),                -- Permite NULL (validador espera nullable: YES)
    nsfw BOOLEAN DEFAULT 0,              -- BOOLEAN es TINYINT(1), permite NULL (validador espera nullable: YES)
    -- La Foreign Key crea implícitamente un índice (MUL key)
    FOREIGN KEY (anime_id) REFERENCES catalogo(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS capitulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temporada_id INT NOT NULL,          -- <<< CORREGIDO: Añadido NOT NULL aquí
    numero INT NOT NULL,
    titulo VARCHAR(255),                 -- Permite NULL (validador espera nullable: YES)
    descripcion TEXT,                    -- Permite NULL (validador espera nullable: YES)
    imagen VARCHAR(255),                 -- Permite NULL (validador espera nullable: YES)
    path VARCHAR(255),                   -- Permite NULL (validador espera nullable: YES)
    duracion_minutos INT,                -- Permite NULL (validador espera nullable: YES)
    me_gustas INT DEFAULT 0,             -- Permite NULL (validador espera nullable: YES)
    no_me_gustas INT DEFAULT 0,          -- Permite NULL (validador espera nullable: YES)
    reproducciones INT DEFAULT 0,        -- Permite NULL (validador espera nullable: YES)
    animeId INT NOT NULL,
    -- La Foreign Key crea implícitamente un índice (MUL key)
    FOREIGN KEY (temporada_id) REFERENCES temporadas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lenguaje (
    id INT AUTO_INCREMENT PRIMARY KEY,
    capitulo_id INT NOT NULL,           -- <<< CORREGIDO: Añadido NOT NULL aquí
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    estado INT DEFAULT 1,                -- Permite NULL (validador espera nullable: YES)
    -- La Foreign Key crea implícitamente un índice (MUL key)
    FOREIGN KEY (capitulo_id) REFERENCES capitulos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --- Comandos ALTER para Reparar Estructuras Existentes ---
-- Estos comandos aseguran que las restricciones existan incluso si las tablas
-- se crearon previamente sin ellas. Tu script de reparación ignora los errores
-- si las restricciones/claves ya existen (ej. ER_DUP_KEYNAME).

-- Asegurar que 'catalogo.nombre' sea UNIQUE (necesario si la tabla ya existía sin UNIQUE)
-- El nombre 'uq_catalogo_nombre' es más explícito que solo 'nombre'.
ALTER TABLE catalogo ADD CONSTRAINT uq_catalogo_nombre UNIQUE (nombre);

-- Asegurar la clave única compuesta para temporadas (anime_id, numero)
ALTER TABLE temporadas ADD UNIQUE KEY `anime_temporada_numero` (`anime_id`, `numero`);

-- Asegurar la clave única compuesta para capitulos (temporada_id, numero)
ALTER TABLE capitulos ADD UNIQUE KEY `temporada_capitulo_numero` (`temporada_id`, `numero`);

-- Modificar columnas para asegurar NOT NULL (necesario si las tablas ya existían permitiendo NULL)
-- !! ADVERTENCIA IMPORTANTE !!: Estos comandos FALLARÁN si las columnas correspondientes
-- contienen actualmente valores NULL. Debes limpiar los datos manualmente
-- (ELIMINAR filas con NULL o ACTUALIZAR los NULL a IDs válidos) ANTES de ejecutar
-- la aplicación si sospechas que existen datos NULL inválidos.

ALTER TABLE temporadas MODIFY COLUMN anime_id INT NOT NULL;
ALTER TABLE capitulos MODIFY COLUMN temporada_id INT NOT NULL;
ALTER TABLE lenguaje MODIFY COLUMN capitulo_id INT NOT NULL;

-- Añadir columna animeId a la tabla capitulos
ALTER TABLE capitulos ADD COLUMN animeId INT NOT NULL AFTER temporada_id;
-- En caso de error porque la columna ya existe, este comando fallará de manera segura
-- y el sistema continuará con la siguiente instrucción

-- --- Fin del Script ---