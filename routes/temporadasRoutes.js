/**
 * Rutas para la gestión de temporadas de anime
 */
const express = require('express');
const { executeQuery, checkEntityExists, handleErrorResponse, formatTemporada, getCapitulosForTemporadas, getTemporadaWithEpisodes } = require('./baseRouter');

// Función para configurar las rutas con la conexión a la base de datos
const setupRoutes = (router, db) => {

    // --- GET SEASONS FOR AN ANIME ---
    router.get('/anime/:animeId/temporadas', async (req, res) => {
        const { animeId } = req.params;
        try {
            // 0. Check if Anime exists
            const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
            if(!animeCheck.success || !animeCheck.exists) {
                return handleErrorResponse(res, 404, 'Anime no encontrado.');
            }

            // 1. Get all seasons for the anime
            const temporadasQuery = 'SELECT * FROM temporadas WHERE anime_id = ? ORDER BY numero ASC';
            const temporadasResult = await executeQuery(db, temporadasQuery, [animeId]);

            if (!temporadasResult.success) {
                console.error('Error al obtener temporadas:', temporadasResult.error);
                return handleErrorResponse(res, 500, 'Error al obtener temporadas');
            }

            const [temporadasDb] = temporadasResult.result;

            if (temporadasDb.length === 0) {
                return res.json([]); // Anime exists, but no seasons found
            }

            // 2. Get all chapters for these seasons efficiently using the common function
            const temporadaIds = temporadasDb.map(t => t.id);
            if (temporadaIds.length === 0) { // Should not happen if temporadasDb > 0, but safe check
                res.json(temporadasDb.map(temp => formatTemporada(temp, []))); // Return seasons with empty chapters
                return;
            }
            
            const capitulosResult = await getCapitulosForTemporadas(db, temporadaIds);

            if (!capitulosResult.success) {
                console.error('Error al obtener capítulos:', capitulosResult.error);
                return handleErrorResponse(res, 500, 'Error al obtener capítulos');
            }

            const capitulos = capitulosResult.capitulos;

            // 3. Structure the response using the common format function
            const temporadasConCapitulos = temporadasDb.map(temp => {
                // Filter chapters for this season
                const capitulosTemporada = capitulos.filter(cap => cap.temporada_id === temp.id);
                // Use the common format function
                return formatTemporada(temp, capitulosTemporada);
            });

            res.json(temporadasConCapitulos);

        } catch (err) {
            console.error(`Error inesperado al obtener temporadas para anime ${animeId}:`, err);
            handleErrorResponse(res, 500, 'Error interno del servidor');
        }
    });

    // --- CREATE SEASON ---
    router.post('/anime/:animeId/temporadas', async (req, res) => {
        const { animeId } = req.params;
        // Use consistent naming (camelCase) from request body
        const { numero, nombre, descripcion, portada, nsfw = false } = req.body; // Default nsfw

        // Validation
        if (numero === undefined || !nombre) {
            return handleErrorResponse(res, 400, 'El número y nombre de la temporada son requeridos.');
        }
        const num = parseInt(numero);
        if (isNaN(num) || num <= 0) {
            return handleErrorResponse(res, 400, 'El número de temporada debe ser un entero positivo.');
        }

        try {
            // Verificar que el anime existe usando checkEntityExists
            const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
            if (!animeCheck.success || !animeCheck.exists) {
                return handleErrorResponse(res, 404, 'Anime no encontrado para añadir temporada.');
            }

            // Use correct table name 'temporadas' and column names
            const query = `
                INSERT INTO temporadas (anime_id, numero, nombre, descripcion, portada, nsfw)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [animeId, num, nombre, descripcion, portada, nsfw];
            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                const [insertResult] = queryResult.result;
                res.status(201).json({
                    message: 'Temporada creada exitosamente',
                    temporadaId: insertResult.insertId, // Return the new ID
                    animeId: animeId
                });
            } else {
                console.error('Error al crear temporada:', queryResult.error);
                if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                    return handleErrorResponse(res, 409, `La temporada número ${num} ya existe para este anime.`);
                }
                handleErrorResponse(res, 500, 'Error al crear la temporada', queryResult.error?.message);   
            }
        } catch (err) {
            console.error('Error inesperado al crear temporada:', err);
            // Catch potential duplicate entry errors not caught by queryHandler
            if (err.code === 'ER_DUP_ENTRY') {
                return handleErrorResponse(res, 409, `La temporada número ${num} ya existe para este anime.`);
            }
            handleErrorResponse(res, 500, 'Error interno del servidor');
        }
    });

    // --- GET SEASON BY ID ---
    router.get('/anime/:animeId/temporadas/:temporadaId', async (req, res) => {
        const { animeId, temporadaId } = req.params;
        try {
            // Usar la función getTemporadaWithEpisodes que ya implementa todas las verificaciones
            const result = await getTemporadaWithEpisodes(db, animeId, temporadaId);
            
            if (!result.success) {
                return handleErrorResponse(res, 404, result.error);
            }
            
            res.json(result.temporada);
        } catch (err) {
            console.error(`Error inesperado al obtener temporada ${temporadaId} para anime ${animeId}:`, err);
            handleErrorResponse(res, 500, 'Error interno del servidor');
        }
    });

    // --- UPDATE SEASON ---
    router.put('/anime/:animeId/temporadas/:temporadaId', async (req, res) => {
        const { animeId, temporadaId } = req.params;
        const { numero, nombre, descripcion, portada, nsfw } = req.body;

        try {
            // Verificar que el anime existe usando checkEntityExists
            const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
            if (!animeCheck.success || !animeCheck.exists) {
                return handleErrorResponse(res, 404, 'Anime no encontrado para añadir temporada.');
            }

            // Verificar que la temporada existe y pertenece al anime
            const temporadaCheck = await checkEntityExists(db, 'temporadas', 'id', temporadaId, 'anime_id', animeId);
            if (!temporadaCheck.success || !temporadaCheck.exists) {
                return handleErrorResponse(res, 404, 'Temporada no encontrada para este anime.');
            }

            // Construir la consulta de actualización dinámicamente
            const fieldsToUpdate = {};
            if (numero !== undefined) {
                const num = parseInt(numero);
                if (isNaN(num) || num <= 0) {
                    return handleErrorResponse(res, 400, 'El número de temporada debe ser un entero positivo.');
                }
                fieldsToUpdate.numero = num;
            }
            if (nombre !== undefined) fieldsToUpdate.nombre = nombre;
            if (descripcion !== undefined) fieldsToUpdate.descripcion = descripcion;
            if (portada !== undefined) fieldsToUpdate.portada = portada;
            if (nsfw !== undefined) fieldsToUpdate.nsfw = nsfw;

            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return handleErrorResponse(res, 400, 'No se proporcionaron campos para actualizar.');
            }

            const setClause = fieldKeys.map(key => `${key} = ?`).join(', ');
            const params = [...Object.values(fieldsToUpdate), temporadaId];

            const query = `UPDATE temporadas SET ${setClause} WHERE id = ?`;

            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                const [updateResult] = queryResult.result;
                if (updateResult.affectedRows > 0) {
                    res.json({ message: 'Temporada actualizada exitosamente' });
                } else {
                    res.json({ message: 'Temporada actualizada exitosamente (sin cambios detectados).' });
                }
            } else {
                console.error('Error al actualizar temporada:', queryResult.error);
                if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                    return handleErrorResponse(res, 409, 'La actualización resultaría en un valor duplicado para un campo único.');
                }
                handleErrorResponse(res, 500, queryResult.error?.message || 'Error al actualizar temporada', queryResult.details);
            }
        } catch (err) {
            console.error('Error inesperado al actualizar temporada:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return handleErrorResponse(res, 409, 'La actualización resultaría en un valor duplicado para un campo único.');
            }
            handleErrorResponse(res, 500, 'Error interno del servidor');
        }
    });

    // --- DELETE SEASON ---
    router.delete('/anime/:animeId/temporadas/:temporadaId', async (req, res) => {
        const { animeId, temporadaId } = req.params;

        try {
            // Verificar que el anime existe usando checkEntityExists
            const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
            if (!animeCheck.success || !animeCheck.exists) {
                return handleErrorResponse(res, 404, 'Anime no encontrado.');
            }

            // Verificar que la temporada existe y pertenece al anime
            const temporadaCheck = await checkEntityExists(db, 'temporadas', 'id', temporadaId, 'anime_id', animeId);
            if (!temporadaCheck.success || !temporadaCheck.exists) {
                return handleErrorResponse(res, 404, 'Temporada no encontrada para este anime.');
            }

            // Eliminar la temporada
            const queryResult = await executeQuery(
                db,
                'DELETE FROM temporadas WHERE id = ?',
                [temporadaId]
            );

            if (queryResult.success) {
                const [deleteResult] = queryResult.result;
                if (deleteResult.affectedRows > 0) {
                    res.json({ message: 'Temporada eliminada exitosamente' });
                } else {
                    handleErrorResponse(res, 404, 'Temporada no encontrada para eliminar.');
                }
            } else {
                console.error('Error al eliminar temporada:', queryResult.error);
                // Manejar errores de restricción de clave foránea
                if (queryResult.error?.code === 'ER_ROW_IS_REFERENCED_2') {
                    return handleErrorResponse(res, 409, 'No se puede eliminar la temporada porque tiene capítulos asociados.');
                }
                handleErrorResponse(res, 500, queryResult.error?.message || 'Error al eliminar temporada');
            }
        } catch (err) {
            console.error('Error inesperado al eliminar temporada:', err);
            handleErrorResponse(res, 500, 'Error interno del servidor');
        }
    });
};

// Exportar la función de configuración de rutas
module.exports = { setupRoutes };