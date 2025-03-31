/**
 * Rutas para la gestión de animes
 */
const express = require('express');
const router = express.Router();
const { initializeRouter, executeQuery, getDb } = require('./baseRouter');

// Inicializar el router con la conexión a la base de datos
initializeRouter().then(() => {
    const db = getDb();

    // --- GET ALL ANIME ---
    router.get('/', async (req, res) => {
        try {
            const queryResult = await executeQuery(db, 'SELECT * FROM catalogo');
            if (queryResult.success) {
                const [results] = queryResult.result;
                res.json(results);
            } else {
                console.error('Error al obtener animes:', queryResult.error);
                res.status(500).json({ error: queryResult.error?.message || 'Error al obtener animes' });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- GET ANIME BY ID ---
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const queryResult = await executeQuery(db, 'SELECT * FROM catalogo WHERE id = ?', [id]);

            if (queryResult.success) {
                const [results] = queryResult.result;
                if (results.length > 0) {
                    res.json(results[0]);
                } else {
                    res.status(404).json({ error: 'Anime no encontrado' });
                }
            } else {
                console.error('Error al obtener anime:', queryResult.error);
                res.status(500).json({ error: queryResult.error?.message || 'Error al obtener anime' });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- CREATE ANIME ---
    router.post('/', async (req, res) => {
        try {
            // Use consistent naming (camelCase in JS, snake_case in DB)
            const { nombre, estado, imagenFondo, descripcion, nsfw, trailer, recomendacion } = req.body;

            // Basic Validation Example (Add more as needed)
            if (!nombre || estado === undefined) {
                 return res.status(400).json({ error: 'Nombre y estado son requeridos.' });
            }

            const queryResult = await executeQuery(
                db,
                'INSERT INTO catalogo (nombre, estado, imagen_fondo, descripcion, nsfw, trailer, recomendacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [nombre, estado, imagenFondo, descripcion, nsfw ?? false, trailer, recomendacion ?? false] // Provide defaults for booleans if needed
            );

            if (queryResult.success) {
                 const [insertResult] = queryResult.result;
                res.status(201).json({ message: 'Anime creado exitosamente', id: insertResult.insertId }); // Return the new ID
            } else {
                console.error('Error al crear anime:', queryResult.error);
                res.status(500).json({
                    error: queryResult.error?.message || 'Error al crear anime',
                    details: queryResult.details // Keep details if queryHandler provides them
                });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
             // Handle specific DB errors like duplicate entry if possible
             if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ error: 'Ya existe un anime con ese nombre u otro campo único.' });
             }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- UPDATE ANIME ---
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // Get only the fields provided in the body
            const { nombre, estado, imagenFondo, descripcion, nsfw, trailer, recomendacion } = req.body;

            // Build the update query dynamically
            const fieldsToUpdate = {};
            if (nombre !== undefined) fieldsToUpdate.nombre = nombre;
            if (estado !== undefined) fieldsToUpdate.estado = estado;
            if (imagenFondo !== undefined) fieldsToUpdate.imagen_fondo = imagenFondo;
            if (descripcion !== undefined) fieldsToUpdate.descripcion = descripcion;
            if (nsfw !== undefined) fieldsToUpdate.nsfw = nsfw;
            if (trailer !== undefined) fieldsToUpdate.trailer = trailer;
            if (recomendacion !== undefined) fieldsToUpdate.recomendacion = recomendacion;

            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
            }

            const setClause = fieldKeys.map(key => `${key} = ?`).join(', ');
            const params = [...Object.values(fieldsToUpdate), id];

            const query = `UPDATE catalogo SET ${setClause} WHERE id = ?`;

            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                 const [updateResult] = queryResult.result;
                 if (updateResult.affectedRows > 0) {
                    res.json({ message: 'Anime actualizado exitosamente' });
                 } else {
                    // Check if anime exists before declaring not found
                    const checkExist = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [id]);
                     if (checkExist.success && checkExist.result[0].length === 0) {
                         res.status(404).json({ error: 'Anime no encontrado para actualizar.' });
                     } else {
                         // This case might mean the data sent was the same as existing data
                         res.json({ message: 'Anime actualizado exitosamente (sin cambios detectados).' });
                     }
                 }
            } else {
                console.error('Error al actualizar anime:', queryResult.error);
                res.status(500).json({
                    error: queryResult.error?.message || 'Error al actualizar anime',
                    details: queryResult.details
                });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
             if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ error: 'La actualización resultaría en un valor duplicado para un campo único.' });
             }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- DELETE ANIME ---
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const queryResult = await executeQuery(
                db,
                'DELETE FROM catalogo WHERE id = ?',
                [id]
            );

            if (queryResult.success) {
                 const [deleteResult] = queryResult.result;
                 if (deleteResult.affectedRows > 0) {
                     res.json({ message: 'Anime eliminado exitosamente' });
                 } else {
                     res.status(404).json({ error: 'Anime no encontrado para eliminar.' }); // If check wasn't done before
                 }
            } else {
                console.error('Error al eliminar anime:', queryResult.error);
                 // Handle foreign key constraint errors if necessary (e.g., cannot delete anime if seasons exist)
                 if (queryResult.error?.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: 'No se puede eliminar el anime porque tiene temporadas asociadas.' });
                 }
                res.status(500).json({ error: queryResult.error?.message || 'Error al eliminar anime' });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
});

module.exports = router;