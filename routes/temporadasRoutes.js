/**
 * Rutas para la gestión de temporadas de anime
 */
const express = require('express');
const router = express.Router();
const { initializeRouter, executeQuery, getDb } = require('./baseRouter');

// Inicializar el router con la conexión a la base de datos
initializeRouter().then(() => {
    const db = getDb();

    // --- GET SEASONS FOR AN ANIME ---
    router.get('/anime/:animeId/temporadas', async (req, res) => {
        const { animeId } = req.params;
        try {
            // 0. Check if Anime exists
            const animeCheck = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [animeId]);
            if(!animeCheck.success || animeCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Anime no encontrado.' });
            }

            // 1. Get all seasons for the anime
            const temporadasQuery = 'SELECT * FROM temporadas WHERE anime_id = ? ORDER BY numero ASC';
            const temporadasResult = await executeQuery(db, temporadasQuery, [animeId]);

            if (!temporadasResult.success) {
                console.error('Error al obtener temporadas:', temporadasResult.error);
                return res.status(500).json({ error: 'Error al obtener temporadas' });
            }

            const [temporadasDb] = temporadasResult.result;

            if (temporadasDb.length === 0) {
                return res.json([]); // Anime exists, but no seasons found
            }

            // 2. Get all chapters for these seasons efficiently
            const temporadaIds = temporadasDb.map(t => t.id);
            if (temporadaIds.length === 0) { // Should not happen if temporadasDb > 0, but safe check
                res.json(temporadasDb.map(temp => ({ ...temp, capitulos: [] }))); // Return seasons with empty chapters
                return;
            }
            const placeholders = temporadaIds.map(() => '?').join(',');
            const capitulosQuery = `SELECT * FROM capitulos WHERE temporada_id IN (${placeholders}) ORDER BY temporada_id ASC, numero ASC`;
            const capitulosResult = await executeQuery(db, capitulosQuery, temporadaIds);

            if (!capitulosResult.success) {
                console.error('Error al obtener capítulos:', capitulosResult.error);
                return res.status(500).json({ error: 'Error al obtener capítulos' });
            }

            const [capitulosDb] = capitulosResult.result;

            // 3. Structure the response
            const temporadasConCapitulos = temporadasDb.map(temp => {
                // Map DB columns (snake_case) to desired JSON keys (camelCase or consistent)
                const temporadaFormateada = {
                    idTemporada: temp.id,
                    numeroTemporada: temp.numero,
                    nombreTemporada: temp.nombre,
                    descripcionTemporada: temp.descripcion,
                    portadaTemporada: temp.portada,
                    animeId: temp.anime_id, // Keep anime_id consistency
                    nsfw: Boolean(temp.nsfw), // Ensure boolean type
                    capitulos: []
                };

                // Filter and map chapters for this season
                temporadaFormateada.capitulos = capitulosDb
                    .filter(cap => cap.temporada_id === temp.id)
                    .map(cap => ({
                        idCapitulo: cap.id,           // Consistent naming
                        numeroCapitulo: cap.numero,        // Consistent naming
                        tituloCapitulo: cap.titulo,        // Consistent naming
                        descripcionCapitulo: cap.descripcion, // Consistent naming
                        imagenCapitulo: cap.imagen,        // Consistent naming
                        pathCapitulo: cap.path,          // Consistent naming
                        duracionMinutos: cap.duracion_minutos, // Consistent naming (from DB)
                        meGustas: cap.me_gustas,         // Consistent naming
                        noMeGustas: cap.no_me_gustas,       // Consistent naming
                        reproducciones: cap.reproducciones, // Consistent naming
                        temporadaId: cap.temporada_id      // Consistent naming
                    }));

                return temporadaFormateada;
            });

            res.json(temporadasConCapitulos);

        } catch (err) {
            console.error(`Error inesperado al obtener temporadas para anime ${animeId}:`, err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- CREATE SEASON ---
    router.post('/anime/:animeId/temporadas', async (req, res) => {
        const { animeId } = req.params;
        // Use consistent naming (camelCase) from request body
        const { numero, nombre, descripcion, portada, nsfw = false } = req.body; // Default nsfw

        // Validation
        if (numero === undefined || !nombre) {
            return res.status(400).json({ error: 'El número y nombre de la temporada son requeridos.' });
        }
        const num = parseInt(numero);
        if (isNaN(num) || num <= 0) {
            return res.status(400).json({ error: 'El número de temporada debe ser un entero positivo.' });
        }

        try {
            // Check if anime exists
            const animeCheck = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [animeId]);
            if(!animeCheck.success || animeCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Anime no encontrado para añadir temporada.' });
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
                    idTemporada: insertResult.insertId, // Return the new ID
                    animeId: animeId
                });
            } else {
                console.error('Error al crear temporada:', queryResult.error);
                if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: `La temporada número ${num} ya existe para este anime.` });
                }
                res.status(500).json({ error: 'Error al crear la temporada', details: queryResult.error?.message });
            }
        } catch (err) {
            console.error('Error inesperado al crear temporada:', err);
            // Catch potential duplicate entry errors not caught by queryHandler
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: `La temporada número ${num} ya existe para este anime.` });
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- GET SEASON BY ID ---
    router.get('/anime/:animeId/temporadas/:temporadaId', async (req, res) => {
        const { animeId, temporadaId } = req.params;
        try {
            // Verificar que el anime existe
            const animeCheck = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [animeId]);
            if(!animeCheck.success || animeCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Anime no encontrado.' });
            }

            // Obtener la temporada específica
            const temporadaQuery = 'SELECT * FROM temporadas WHERE id = ? AND anime_id = ?';
            const temporadaResult = await executeQuery(db, temporadaQuery, [temporadaId, animeId]);

            if (!temporadaResult.success) {
                console.error('Error al obtener temporada:', temporadaResult.error);
                return res.status(500).json({ error: 'Error al obtener temporada' });
            }

            const [temporadaDb] = temporadaResult.result;

            if (temporadaDb.length === 0) {
                return res.status(404).json({ error: 'Temporada no encontrada para este anime.' });
            }

            // Obtener los capítulos de esta temporada
            const capitulosQuery = 'SELECT * FROM capitulos WHERE temporada_id = ? ORDER BY numero ASC';
            const capitulosResult = await executeQuery(db, capitulosQuery, [temporadaId]);

            if (!capitulosResult.success) {
                console.error('Error al obtener capítulos:', capitulosResult.error);
                return res.status(500).json({ error: 'Error al obtener capítulos' });
            }

            const [capitulosDb] = capitulosResult.result;

            // Formatear la respuesta
            const temporada = temporadaDb[0];
            const temporadaFormateada = {
                idTemporada: temporada.id,
                numeroTemporada: temporada.numero,
                nombreTemporada: temporada.nombre,
                descripcionTemporada: temporada.descripcion,
                portadaTemporada: temporada.portada,
                animeId: temporada.anime_id,
                nsfw: Boolean(temporada.nsfw),
                capitulos: capitulosDb.map(cap => ({
                    idCapitulo: cap.id,
                    numeroCapitulo: cap.numero,
                    tituloCapitulo: cap.titulo,
                    descripcionCapitulo: cap.descripcion,
                    imagenCapitulo: cap.imagen,
                    pathCapitulo: cap.path,
                    duracionMinutos: cap.duracion_minutos,
                    meGustas: cap.me_gustas,
                    noMeGustas: cap.no_me_gustas,
                    reproducciones: cap.reproducciones,
                    temporadaId: cap.temporada_id
                }))
            };

            res.json(temporadaFormateada);
        } catch (err) {
            console.error(`Error inesperado al obtener temporada ${temporadaId} para anime ${animeId}:`, err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- UPDATE SEASON ---
    router.put('/anime/:animeId/temporadas/:temporadaId', async (req, res) => {
        const { animeId, temporadaId } = req.params;
        const { numero, nombre, descripcion, portada, nsfw } = req.body;

        try {
            // Verificar que el anime existe
            const animeCheck = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [animeId]);
            if(!animeCheck.success || animeCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Anime no encontrado.' });
            }

            // Verificar que la temporada existe y pertenece al anime
            const temporadaCheck = await executeQuery(db, 'SELECT id FROM temporadas WHERE id = ? AND anime_id = ?', [temporadaId, animeId]);
            if(!temporadaCheck.success || temporadaCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Temporada no encontrada para este anime.' });
            }

            // Construir la consulta de actualización dinámicamente
            const fieldsToUpdate = {};
            if (numero !== undefined) {
                const num = parseInt(numero);
                if (isNaN(num) || num <= 0) {
                    return res.status(400).json({ error: 'El número de temporada debe ser un entero positivo.' });
                }
                fieldsToUpdate.numero = num;
            }
            if (nombre !== undefined) fieldsToUpdate.nombre = nombre;
            if (descripcion !== undefined) fieldsToUpdate.descripcion = descripcion;
            if (portada !== undefined) fieldsToUpdate.portada = portada;
            if (nsfw !== undefined) fieldsToUpdate.nsfw = nsfw;

            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
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
                    return res.status(409).json({ error: 'La actualización resultaría en un valor duplicado para un campo único.' });
                }
                res.status(500).json({
                    error: queryResult.error?.message || 'Error al actualizar temporada',
                    details: queryResult.details
                });
            }
        } catch (err) {
            console.error('Error inesperado al actualizar temporada:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'La actualización resultaría en un valor duplicado para un campo único.' });
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- DELETE SEASON ---
    router.delete('/anime/:animeId/temporadas/:temporadaId', async (req, res) => {
        const { animeId, temporadaId } = req.params;

        try {
            // Verificar que el anime existe
            const animeCheck = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [animeId]);
            if(!animeCheck.success || animeCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Anime no encontrado.' });
            }

            // Verificar que la temporada existe y pertenece al anime
            const temporadaCheck = await executeQuery(db, 'SELECT id FROM temporadas WHERE id = ? AND anime_id = ?', [temporadaId, animeId]);
            if(!temporadaCheck.success || temporadaCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Temporada no encontrada para este anime.' });
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
                    res.status(404).json({ error: 'Temporada no encontrada para eliminar.' });
                }
            } else {
                console.error('Error al eliminar temporada:', queryResult.error);
                // Manejar errores de restricción de clave foránea
                if (queryResult.error?.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: 'No se puede eliminar la temporada porque tiene capítulos asociados.' });
                }
                res.status(500).json({ error: queryResult.error?.message || 'Error al eliminar temporada' });
            }
        } catch (err) {
            console.error('Error inesperado al eliminar temporada:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
});

module.exports = router;