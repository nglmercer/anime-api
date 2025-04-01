/**
 * Rutas para la gestión de capítulos de anime
 */
const express = require('express');
const router = express.Router();
const { initializeRouter, executeQuery, getDb } = require('./baseRouter');

// Inicializar el router con la conexión a la base de datos
initializeRouter().then(() => {
    const db = getDb();

    // --- GET ALL CHAPTERS FOR A SEASON ---
    router.get('/anime/:animeId/temporadas/:temporadaId/capitulos', async (req, res) => {
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

            // Obtener todos los capítulos de la temporada
            const capitulosQuery = 'SELECT * FROM capitulos WHERE temporada_id = ? ORDER BY numero ASC';
            const capitulosResult = await executeQuery(db, capitulosQuery, [temporadaId]);

            if (!capitulosResult.success) {
                console.error('Error al obtener capítulos:', capitulosResult.error);
                return res.status(500).json({ error: 'Error al obtener capítulos' });
            }

            const [capitulosDb] = capitulosResult.result;

            // Formatear la respuesta
            const capitulos = capitulosDb.map(cap => ({
                ...cap,
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
                temporadaId: cap.temporada_id,
                animeId: cap.animeId,
                
            }));

            res.json(capitulos);
        } catch (err) {
            console.error(`Error inesperado al obtener capítulos para temporada ${temporadaId}:`, err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- GET CHAPTER BY ID ---
    router.get('/anime/:animeId/temporadas/:temporadaId/capitulos/:capituloId', async (req, res) => {
        const { animeId, temporadaId, capituloId } = req.params;
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

            // Obtener el capítulo específico
            const capituloQuery = 'SELECT * FROM capitulos WHERE id = ? AND temporada_id = ?';
            const capituloResult = await executeQuery(db, capituloQuery, [capituloId, temporadaId]);

            if (!capituloResult.success) {
                console.error('Error al obtener capítulo:', capituloResult.error);
                return res.status(500).json({ error: 'Error al obtener capítulo' });
            }

            const [capituloDb] = capituloResult.result;

            if (capituloDb.length === 0) {
                return res.status(404).json({ error: 'Capítulo no encontrado para esta temporada.' });
            }

            // Formatear la respuesta
            const capitulo = capituloDb[0];
            const capituloFormateado = {
                idCapitulo: capitulo.id,
                numeroCapitulo: capitulo.numero,
                tituloCapitulo: capitulo.titulo,
                descripcionCapitulo: capitulo.descripcion,
                imagenCapitulo: capitulo.imagen,
                pathCapitulo: capitulo.path,
                duracionMinutos: capitulo.duracion_minutos,
                meGustas: capitulo.me_gustas,
                noMeGustas: capitulo.no_me_gustas,
                reproducciones: capitulo.reproducciones,
                temporadaId: capitulo.temporada_id
            };

            res.json(capituloFormateado);
        } catch (err) {
            console.error(`Error inesperado al obtener capítulo ${capituloId}:`, err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- CREATE CHAPTER ---
    router.post('/anime/:animeId/temporadas/:temporadaId/capitulos', async (req, res) => {
        const { animeId, temporadaId } = req.params;
        const { 
            numero, 
            titulo, 
            descripcion, 
            imagen, 
            path, 
            duracion_minutos = 0, 
            me_gustas = 0, 
            no_me_gustas = 0, 
            reproducciones = 0 
        } = req.body;
        
        // Convertir descripción de array a string si es necesario
        const descripcionStr = Array.isArray(descripcion) ? descripcion.join(' ') : descripcion;

        // Validación básica
        if (numero === undefined || !titulo) {
            return res.status(400).json({ error: 'El número y título del capítulo son requeridos.' });
        }
        const num = parseInt(numero);
        if (isNaN(num) || num <= 0) {
            return res.status(400).json({ error: 'El número de capítulo debe ser un entero positivo.' });
        }
        // Validar que el número no exceda el límite máximo de INT en MySQL
        if (num > 2147483647) {
            return res.status(400).json({ error: 'El número de capítulo es demasiado grande. El valor máximo permitido es 2,147,483,647.' });
        }

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

            // Crear el capítulo
            const query = `
                INSERT INTO capitulos (
                    temporada_id, 
                    numero, 
                    titulo, 
                    descripcion, 
                    imagen, 
                    path, 
                    duracion_minutos, 
                    me_gustas, 
                    no_me_gustas, 
                    reproducciones,
                    animeId
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                temporadaId, 
                num, 
                titulo, 
                descripcionStr, 
                imagen, 
                path, 
                duracion_minutos, 
                me_gustas, 
                no_me_gustas, 
                reproducciones,
                animeId
            ];
            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                const [insertResult] = queryResult.result;
                res.status(201).json({
                    message: 'Capítulo creado exitosamente',
                    idCapitulo: insertResult.insertId,
                    temporadaId: temporadaId,
                    animeId: animeId
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

    // --- UPDATE CHAPTER ---
    router.put('/anime/:animeId/temporadas/:temporadaId/capitulos/:capituloId', async (req, res) => {
        const { animeId, temporadaId, capituloId } = req.params;
        const { 
            numero, 
            titulo, 
            descripcion, 
            imagen, 
            path, 
            duracion_minutos, 
            me_gustas, 
            no_me_gustas, 
            reproducciones 
        } = req.body;

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

            // Verificar que el capítulo existe y pertenece a la temporada
            const capituloCheck = await executeQuery(db, 'SELECT id FROM capitulos WHERE id = ? AND temporada_id = ?', [capituloId, temporadaId]);
            if(!capituloCheck.success || capituloCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Capítulo no encontrado para esta temporada.' });
            }

            // Construir la consulta de actualización dinámicamente
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
            if (duracion_minutos !== undefined) fieldsToUpdate.duracion_minutos = duracion_minutos;
            if (me_gustas !== undefined) fieldsToUpdate.me_gustas = me_gustas;
            if (no_me_gustas !== undefined) fieldsToUpdate.no_me_gustas = no_me_gustas;
            if (reproducciones !== undefined) fieldsToUpdate.reproducciones = reproducciones;

            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
            }

            const setClause = fieldKeys.map(key => `${key} = ?`).join(', ');
            const params = [...Object.values(fieldsToUpdate), capituloId];

            const query = `UPDATE capitulos SET ${setClause} WHERE id = ?`;

            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                const [updateResult] = queryResult.result;
                if (updateResult.affectedRows > 0) {
                    res.json({ message: 'Capítulo actualizado exitosamente' });
                } else {
                    res.json({ message: 'Capítulo actualizado exitosamente (sin cambios detectados).' });
                }
            } else {
                console.error('Error al actualizar capítulo:', queryResult.error);
                if (queryResult.error?.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'La actualización resultaría en un valor duplicado para un campo único.' });
                }
                res.status(500).json({
                    error: queryResult.error?.message || 'Error al actualizar capítulo',
                    details: queryResult.details
                });
            }
        } catch (err) {
            console.error('Error inesperado al actualizar capítulo:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'La actualización resultaría en un valor duplicado para un campo único.' });
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- DELETE CHAPTER ---
    router.delete('/anime/:animeId/temporadas/:temporadaId/capitulos/:capituloId', async (req, res) => {
        const { animeId, temporadaId, capituloId } = req.params;

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

            // Verificar que el capítulo existe y pertenece a la temporada
            const capituloCheck = await executeQuery(db, 'SELECT id FROM capitulos WHERE id = ? AND temporada_id = ?', [capituloId, temporadaId]);
            if(!capituloCheck.success || capituloCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Capítulo no encontrado para esta temporada.' });
            }

            // Eliminar el capítulo
            const queryResult = await executeQuery(
                db,
                'DELETE FROM capitulos WHERE id = ?',
                [capituloId]
            );

            if (queryResult.success) {
                const [deleteResult] = queryResult.result;
                if (deleteResult.affectedRows > 0) {
                    res.json({ message: 'Capítulo eliminado exitosamente' });
                } else {
                    res.status(404).json({ error: 'Capítulo no encontrado para eliminar.' });
                }
            } else {
                console.error('Error al eliminar capítulo:', queryResult.error);
                res.status(500).json({ error: queryResult.error?.message || 'Error al eliminar capítulo' });
            }
        } catch (err) {
            console.error('Error inesperado al eliminar capítulo:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // --- UPDATE CHAPTER STATS ---
    router.patch('/anime/:animeId/temporadas/:temporadaId/capitulos/:capituloId/stats', async (req, res) => {
        const { animeId, temporadaId, capituloId } = req.params;
        const { me_gustas, no_me_gustas, reproducciones } = req.body;

        try {
            // Verificar que el capítulo existe y pertenece a la temporada correcta
            const capituloCheck = await executeQuery(
                db,
                `SELECT c.id FROM capitulos c 
                 JOIN temporadas t ON c.temporada_id = t.id 
                 WHERE c.id = ? AND c.temporada_id = ? AND t.anime_id = ?`,
                [capituloId, temporadaId, animeId]
            );

            if(!capituloCheck.success || capituloCheck.result[0].length === 0) {
                return res.status(404).json({ error: 'Capítulo no encontrado para esta temporada y anime.' });
            }

            // Construir la consulta de actualización dinámicamente
            const fieldsToUpdate = {};
            if (me_gustas !== undefined) fieldsToUpdate.me_gustas = me_gustas;
            if (no_me_gustas !== undefined) fieldsToUpdate.no_me_gustas = no_me_gustas;
            if (reproducciones !== undefined) fieldsToUpdate.reproducciones = reproducciones;

            const fieldKeys = Object.keys(fieldsToUpdate);
            if (fieldKeys.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron estadísticas para actualizar.' });
            }

            const setClause = fieldKeys.map(key => `${key} = ?`).join(', ');
            const params = [...Object.values(fieldsToUpdate), capituloId];

            const query = `UPDATE capitulos SET ${setClause} WHERE id = ?`;

            const queryResult = await executeQuery(db, query, params);

            if (queryResult.success) {
                res.json({ message: 'Estadísticas del capítulo actualizadas exitosamente' });
            } else {
                console.error('Error al actualizar estadísticas del capítulo:', queryResult.error);
                res.status(500).json({
                    error: queryResult.error?.message || 'Error al actualizar estadísticas del capítulo',
                    details: queryResult.details
                });
            }
        } catch (err) {
            console.error('Error inesperado al actualizar estadísticas del capítulo:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
});

module.exports = router;