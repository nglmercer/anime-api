const express = require('express');
const router = express.Router();
const { initializeDatabase } = require('../utils/database');
const { executeQuery } = require('../utils/queryHandler');
let db;

initializeDatabase().then(connection => {
    db = connection;

    // --- GET ALL ANIME ---
    router.get('/anime', async (req, res) => {
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
    router.get('/anime/:id', async (req, res) => {
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
    router.post('/anime', async (req, res) => {
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
    router.put('/anime/:id', async (req, res) => {
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
    router.delete('/anime/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Optional: Check if anime exists first
            // const checkExist = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [id]);
            // if (!checkExist.success || checkExist.result[0].length === 0) {
            //     return res.status(404).json({ error: 'Anime no encontrado para eliminar.' });
            // }


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

    // --- GET SEASONS AND EPISODES FOR AN ANIME ---
    router.get('/anime/:animeId/temporadas', async (req, res) => {
        const { animeId } = req.params;
        try {
            // 0. Check if Anime exists
             const animeCheck = await executeQuery(db, 'SELECT id FROM catalogo WHERE id = ?', [animeId]);
             if(!animeCheck.success || animeCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Anime no encontrado.' });
             }

            // 1. Get all seasons for the anime
            // Use correct table name 'temporadas'
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
            // Use correct table name 'capitulos'
            const capitulosQuery = `SELECT * FROM capitulos WHERE temporada_id IN (${placeholders}) ORDER BY temporada_id ASC, numero ASC`;
            const capitulosResult = await executeQuery(db, capitulosQuery, temporadaIds); // <<< FIX TYPO HERE

            if (!capitulosResult.success) { // <<< FIX TYPO HERE
                console.error('Error al obtener capítulos:', capitulosResult.error); // <<< FIX TYPO HERE
                return res.status(500).json({ error: 'Error al obtener capítulos' });
            }

            const [capitulosDb] = capitulosResult.result; // <<< FIX TYPO HERE

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
                        // Avoid exposing catalogocapitulo if it's just the animeId, which is already on the season
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

    // --- UPDATE SEASON (NEW) ---
    // Route makes more sense as /temporadas/:temporadaId
    router.put('/temporadas/:temporadaId', async (req, res) => {
        const { temporadaId } = req.params;
        // Get fields to update from body
        const { numero, nombre, descripcion, portada, nsfw } = req.body;

        try {
            // Build dynamic query
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
            if (portada !== undefined) fieldsToUpdate.portada = portada; // Allow setting portada to null/empty if needed
            if (nsfw !== undefined) fieldsToUpdate.nsfw = Boolean(nsfw);

            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
            }

            const setClause = fieldKeys.map(key => `${key} = ?`).join(', ');
            const params = [...Object.values(fieldsToUpdate), temporadaId];

             // Use correct table name 'temporadas'
            const query = `UPDATE temporadas SET ${setClause} WHERE id = ?`;

            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                const [updateResult] = queryResult.result;
                if (updateResult.affectedRows > 0) {
                   res.json({ message: 'Temporada actualizada exitosamente' });
                } else {
                    // Check if season exists
                    const checkExist = await executeQuery(db, 'SELECT id FROM temporadas WHERE id = ?', [temporadaId]);
                     if (checkExist.success && checkExist.result[0].length === 0) {
                         res.status(404).json({ error: 'Temporada no encontrada para actualizar.' });
                     } else {
                         res.json({ message: 'Temporada actualizada exitosamente (sin cambios detectados).' });
                     }
                }
            } else {
                console.error('Error al actualizar temporada:', queryResult.error);
                if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                    // Need to know which field caused the duplicate error (usually numero + anime_id)
                    return res.status(409).json({ error: `La actualización resultaría en un número de temporada duplicado para el anime asociado.` });
                 }
                res.status(500).json({ error: 'Error al actualizar la temporada', details: queryResult.error?.message });
            }
        } catch (err) {
            console.error('Error inesperado al actualizar temporada:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ error: `La actualización resultaría en un número de temporada duplicado para el anime asociado.` });
             }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });


    // --- CREATE CHAPTER ---
    // Route makes more sense as /temporadas/:temporadaId/capitulos
    router.post('/temporadas/:temporadaId/capitulos', async (req, res) => {
        const { temporadaId } = req.params;
        // Consistent naming from body
        const {
            numero,
            titulo,
            descripcion,
            imagen,
            path,
            duracionMinutos
            // meGustas, noMeGustas, reproducciones usually default to 0 in DB
        } = req.body;

         // Validation
        if (numero === undefined) {
             return res.status(400).json({ error: 'El número del capítulo es requerido.' });
        }
        const num = parseInt(numero);
         if (isNaN(num) || num <= 0) {
             return res.status(400).json({ error: 'El número de capítulo debe ser un entero positivo.' });
        }
        const duracion = duracionMinutos !== undefined ? parseInt(duracionMinutos) : null; // Allow null duration
         if (duracion !== null && (isNaN(duracion) || duracion < 0)) {
            return res.status(400).json({ error: 'La duración debe ser un número positivo o cero.' });
        }

        try {
             // Check if season exists
            const temporadaCheck = await executeQuery(db, 'SELECT id FROM temporadas WHERE id = ?', [temporadaId]);
             if(!temporadaCheck.success || temporadaCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Temporada no encontrada para añadir capítulo.' });
             }

            // Use correct table name 'capitulos' and column names
            const query = `
                INSERT INTO capitulos
                (temporada_id, numero, titulo, descripcion, imagen, path, duracion_minutos)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [temporadaId, num, titulo, descripcion, imagen, path, duracion];
            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                const [insertResult] = queryResult.result;
                res.status(201).json({
                    message: 'Capítulo creado exitosamente',
                    idCapitulo: insertResult.insertId, // Return new ID
                    temporadaId: temporadaId
                });
            } else {
                console.error('Error al crear capítulo:', queryResult.error);
                 if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                     return res.status(409).json({ error: `El capítulo número ${num} ya existe para esta temporada.` });
                 }
                res.status(500).json({ error: 'Error al crear el capítulo', details: queryResult.error?.message });
            }
        } catch (err) {
            console.error('Error inesperado al crear capítulo:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ error: `El capítulo número ${num} ya existe para esta temporada.` });
             }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- UPDATE CHAPTER (NEW) ---
    // Route makes more sense as /capitulos/:capituloId
     router.put('/capitulos/:capituloId', async (req, res) => {
        const { capituloId } = req.params;
        // Get fields from body
        const {
            numero,
            titulo,
            descripcion,
            imagen,
            path,
            duracionMinutos,
            // Add meGustas, noMeGustas, reproducciones if they should be updatable via API
            // meGustas, noMeGustas, reproducciones
        } = req.body;

        try {
            // Build dynamic query
            const fieldsToUpdate = {};
            if (numero !== undefined) {
                const num = parseInt(numero);
                if (isNaN(num) || num <= 0) {
                    return res.status(400).json({ error: 'El número de capítulo debe ser un entero positivo.' });
                }
                fieldsToUpdate.numero = num;
            }
            if (titulo !== undefined) fieldsToUpdate.titulo = titulo;
            if (descripcion !== undefined) fieldsToUpdate.descripcion = descripcion;
            if (imagen !== undefined) fieldsToUpdate.imagen = imagen;
            if (path !== undefined) fieldsToUpdate.path = path;
            if (duracionMinutos !== undefined) {
                 const duracion = parseInt(duracionMinutos);
                 if (isNaN(duracion) || duracion < 0) {
                     return res.status(400).json({ error: 'La duración debe ser un número positivo o cero.' });
                 }
                 fieldsToUpdate.duracion_minutos = duracion;
            }
            // if (meGustas !== undefined) fieldsToUpdate.me_gustas = meGustas; // Be careful allowing direct update of counters
            // if (noMeGustas !== undefined) fieldsToUpdate.no_me_gustas = noMeGustas;
            // if (reproducciones !== undefined) fieldsToUpdate.reproducciones = reproducciones;


            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
            }

            const setClause = fieldKeys.map(key => `${key} = ?`).join(', ');
            const params = [...Object.values(fieldsToUpdate), capituloId];

             // Use correct table name 'capitulos'
            const query = `UPDATE capitulos SET ${setClause} WHERE id = ?`;

            const queryResult = await executeQuery(db, query, params);

             if (queryResult.success) {
                const [updateResult] = queryResult.result;
                if (updateResult.affectedRows > 0) {
                   res.json({ message: 'Capítulo actualizado exitosamente' });
                } else {
                    // Check if chapter exists
                    const checkExist = await executeQuery(db, 'SELECT id FROM capitulos WHERE id = ?', [capituloId]);
                     if (checkExist.success && checkExist.result[0].length === 0) {
                         res.status(404).json({ error: 'Capítulo no encontrado para actualizar.' });
                     } else {
                         res.json({ message: 'Capítulo actualizado exitosamente (sin cambios detectados).' });
                     }
                }
            } else {
                console.error('Error al actualizar capítulo:', queryResult.error);
                 if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                    // Need to know which field caused the duplicate (usually numero + temporada_id)
                    return res.status(409).json({ error: `La actualización resultaría en un número de capítulo duplicado para la temporada asociada.` });
                 }
                res.status(500).json({ error: 'Error al actualizar el capítulo', details: queryResult.error?.message });
            }
        } catch (err) {
            console.error('Error inesperado al actualizar capítulo:', err);
             if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ error: `La actualización resultaría en un número de capítulo duplicado para la temporada asociada.` });
             }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });


    // --- ADD DELETE ROUTES FOR SEASONS AND CHAPTERS (Optional but Recommended) ---

    router.delete('/temporadas/:temporadaId', async (req, res) => {
        const { temporadaId } = req.params;
        try {
            // Use correct table name 'temporadas'
            const queryResult = await executeQuery(db, 'DELETE FROM temporadas WHERE id = ?', [temporadaId]);
            if (queryResult.success) {
                const [deleteResult] = queryResult.result;
                if (deleteResult.affectedRows > 0) {
                    res.json({ message: 'Temporada eliminada exitosamente' });
                } else {
                    res.status(404).json({ error: 'Temporada no encontrada para eliminar' });
                }
            } else {
                console.error('Error al eliminar temporada:', queryResult.error);
                if (queryResult.error?.code === 'ER_ROW_IS_REFERENCED_2') {
                   return res.status(409).json({ error: 'No se puede eliminar la temporada porque tiene capítulos asociados.' });
                }
                res.status(500).json({ error: 'Error al eliminar la temporada', details: queryResult.error?.message });
            }
        } catch (err) {
            console.error('Error inesperado al eliminar temporada:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.delete('/capitulos/:capituloId', async (req, res) => {
        const { capituloId } = req.params;
        try {
             // Use correct table name 'capitulos'
            const queryResult = await executeQuery(db, 'DELETE FROM capitulos WHERE id = ?', [capituloId]);
             if (queryResult.success) {
                const [deleteResult] = queryResult.result;
                if (deleteResult.affectedRows > 0) {
                    res.json({ message: 'Capítulo eliminado exitosamente' });
                } else {
                    res.status(404).json({ error: 'Capítulo no encontrado para eliminar' });
                }
            } else {
                console.error('Error al eliminar capítulo:', queryResult.error);
                // Chapters usually don't have FK constraints pointing *from* them, but check just in case
                res.status(500).json({ error: 'Error al eliminar el capítulo', details: queryResult.error?.message });
            }
        } catch (err) {
            console.error('Error inesperado al eliminar capítulo:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });


}); // End of initializeDatabase().then()

module.exports = router;