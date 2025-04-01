/**
 * Archivo base para configuración de rutas
 * Proporciona acceso a la base de datos y funciones comunes para todos los routers
 */
const { initializeDatabase } = require('../utils/database');
const { executeQuery } = require('../utils/queryHandler');

// Variable para almacenar la conexión a la base de datos
let db;

// Inicializar la conexión a la base de datos
const initializeRouter = async () => {
    if (!db) {
        db = await initializeDatabase();
    }
    return db;
};

/**
 * Verifica si un registro existe en la base de datos
 * @param {Object} db - Conexión a la base de datos
 * @param {string} table - Nombre de la tabla a consultar
 * @param {string} field - Campo por el que se filtrará (generalmente 'id')
 * @param {any} value - Valor a buscar
 * @param {string} [additionalField] - Campo adicional para filtrar (opcional)
 * @param {any} [additionalValue] - Valor adicional para filtrar (opcional)
 * @returns {Promise<Object>} - Objeto con el resultado de la verificación
 */
const checkEntityExists = async (db, table, field, value, additionalField = null, additionalValue = null) => {
    try {
        let query = `SELECT ${field} FROM ${table} WHERE ${field} = ?`;
        let params = [value];
        
        if (additionalField && additionalValue !== null) {
            query += ` AND ${additionalField} = ?`;
            params.push(additionalValue);
        }
        
        const result = await executeQuery(db, query, params);
        
        if (!result.success) {
            return { success: false, error: `Error al verificar existencia en ${table}`, details: result.error };
        }
        
        const exists = result.result[0].length > 0;
        return { 
            success: true, 
            exists, 
            data: exists ? result.result[0][0] : null 
        };
    } catch (error) {
        console.error(`Error en checkEntityExists (${table}):`, error);
        return { success: false, error: 'Error interno del servidor' };
    }
};

/**
 * Maneja respuestas de error comunes
 * @param {Object} res - Objeto de respuesta Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} message - Mensaje de error
 * @param {Object} [details] - Detalles adicionales del error (opcional)
 */
const handleErrorResponse = (res, statusCode, message, details = null) => {
    const response = { error: message };
    if (details) response.details = details;
    res.status(statusCode).json(response);
};

/**
 * Formatea un capítulo para la respuesta API
 * @param {Object} capitulo - Objeto de capítulo de la base de datos
 * @returns {Object} - Capítulo formateado
 */
const formatCapitulo = (capitulo) => ({
    capituloId: capitulo.id,
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
});

/**
 * Formatea una temporada para la respuesta API
 * @param {Object} temporada - Objeto de temporada de la base de datos
 * @param {Array} [capitulos=[]] - Array de capítulos de esta temporada (opcional)
 * @returns {Object} - Temporada formateada
 */
const formatTemporada = (temporada, capitulos = []) => ({
    temporadaId: temporada.id,
    numeroTemporada: temporada.numero,
    nombreTemporada: temporada.nombre,
    descripcionTemporada: temporada.descripcion,
    portadaTemporada: temporada.portada,
    animeId: temporada.anime_id,
    nsfw: Boolean(temporada.nsfw),
    capitulos: capitulos.map(formatCapitulo)
});

/**
 * Obtiene todos los capítulos para un conjunto de temporadas
 * @param {Object} db - Conexión a la base de datos
 * @param {Array} temporadaIds - Array de IDs de temporadas
 * @returns {Promise<Object>} - Objeto con los capítulos agrupados por temporada
 */
const getCapitulosForTemporadas = async (db, temporadaIds) => {
    try {
        if (!temporadaIds || temporadaIds.length === 0) {
            return { success: true, capitulos: [] };
        }
        
        const placeholders = temporadaIds.map(() => '?').join(',');
        const query = `SELECT * FROM capitulos WHERE temporada_id IN (${placeholders}) ORDER BY temporada_id ASC, numero ASC`;
        const result = await executeQuery(db, query, temporadaIds);
        
        if (!result.success) {
            return { success: false, error: 'Error al obtener capítulos', details: result.error };
        }
        
        return { success: true, capitulos: result.result[0] };
    } catch (error) {
        console.error('Error en getCapitulosForTemporadas:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
};

/**
 * Obtiene un anime por ID incluyendo sus temporadas y capítulos
 * @param {Object} db - Conexión a la base de datos
 * @param {number|string} animeId - ID del anime a consultar
 * @returns {Promise<Object>} - Objeto con el anime, sus temporadas y capítulos
 */
const getAnimeWithSeasonsAndEpisodes = async (db, animeId) => {
    try {
        // 1. Verificar y obtener información del anime
        const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
        
        if (!animeCheck.success) {
            return { success: false, error: animeCheck.error };
        }
        
        if (!animeCheck.exists) {
            return { success: false, error: 'Anime no encontrado' };
        }
        
        // Obtener datos completos del anime
        const animeQuery = 'SELECT * FROM catalogo WHERE id = ?';
        const animeResult = await executeQuery(db, animeQuery, [animeId]);
        
        if (!animeResult.success) {
            return { success: false, error: 'Error al obtener datos del anime' };
        }
        
        const anime = animeResult.result[0][0];
        
        // 2. Obtener todas las temporadas del anime
        const temporadasQuery = 'SELECT * FROM temporadas WHERE anime_id = ? ORDER BY numero ASC';
        const temporadasResult = await executeQuery(db, temporadasQuery, [animeId]);
        
        if (!temporadasResult.success) {
            return { success: false, error: 'Error al obtener temporadas' };
        }
        
        const temporadas = temporadasResult.result[0];
        
        // 3. Si hay temporadas, obtener todos los capítulos de esas temporadas
        if (temporadas.length > 0) {
            const temporadaIds = temporadas.map(t => t.id);
            const capitulosResult = await getCapitulosForTemporadas(db, temporadaIds);
            
            if (!capitulosResult.success) {
                return { success: false, error: capitulosResult.error };
            }
            
            const capitulos = capitulosResult.capitulos;
            
            // 4. Estructurar la respuesta con temporadas y capítulos anidados
            const temporadasConCapitulos = temporadas.map(temp => {
                // Filtrar capítulos para esta temporada
                const capitulosTemporada = capitulos.filter(cap => cap.temporada_id === temp.id);
                // Usar la función de formateo
                return formatTemporada(temp, capitulosTemporada);
            });
            
            // Añadir temporadas al objeto anime
            anime.temporadas = temporadasConCapitulos;
        } else {
            anime.temporadas = [];
        }
        
        return { success: true, anime };
    } catch (error) {
        console.error('Error en getAnimeWithSeasonsAndEpisodes:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
};

/**
 * Obtiene una temporada por ID con sus capítulos
 * @param {Object} db - Conexión a la base de datos
 * @param {number|string} animeId - ID del anime
 * @param {number|string} temporadaId - ID de la temporada
 * @returns {Promise<Object>} - Objeto con la temporada y sus capítulos
 */
const getTemporadaWithEpisodes = async (db, animeId, temporadaId) => {
    try {
        // 1. Verificar que el anime existe
        const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
        
        if (!animeCheck.success || !animeCheck.exists) {
            return { 
                success: false, 
                error: !animeCheck.success ? animeCheck.error : 'Anime no encontrado' 
            };
        }
        
        // 2. Verificar que la temporada existe y pertenece al anime
        const temporadaCheck = await checkEntityExists(db, 'temporadas', 'id', temporadaId, 'anime_id', animeId);
        
        if (!temporadaCheck.success || !temporadaCheck.exists) {
            return { 
                success: false, 
                error: !temporadaCheck.success ? temporadaCheck.error : 'Temporada no encontrada para este anime' 
            };
        }
        
        // 3. Obtener datos completos de la temporada
        const temporadaQuery = 'SELECT * FROM temporadas WHERE id = ?';
        const temporadaResult = await executeQuery(db, temporadaQuery, [temporadaId]);
        
        if (!temporadaResult.success) {
            return { success: false, error: 'Error al obtener datos de la temporada' };
        }
        
        const temporada = temporadaResult.result[0][0];
        
        // 4. Obtener capítulos de la temporada
        const capitulosQuery = 'SELECT * FROM capitulos WHERE temporada_id = ? ORDER BY numero ASC';
        const capitulosResult = await executeQuery(db, capitulosQuery, [temporadaId]);
        
        if (!capitulosResult.success) {
            return { success: false, error: 'Error al obtener capítulos' };
        }
        
        const capitulos = capitulosResult.result[0];
        
        // 5. Formatear la respuesta
        const temporadaFormateada = formatTemporada(temporada, capitulos);
        
        return { success: true, temporada: temporadaFormateada };
    } catch (error) {
        console.error('Error en getTemporadaWithEpisodes:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
};

/**
 * Obtiene un capítulo por ID
 * @param {Object} db - Conexión a la base de datos
 * @param {number|string} animeId - ID del anime
 * @param {number|string} temporadaId - ID de la temporada
 * @param {number|string} capituloId - ID del capítulo
 * @returns {Promise<Object>} - Objeto con el capítulo
 */
const getCapitulo = async (db, animeId, temporadaId, capituloId) => {
    try {
        // 1. Verificar que el anime existe
        const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
        
        if (!animeCheck.success || !animeCheck.exists) {
            return { 
                success: false, 
                error: !animeCheck.success ? animeCheck.error : 'Anime no encontrado' 
            };
        }
        
        // 2. Verificar que la temporada existe y pertenece al anime
        const temporadaCheck = await checkEntityExists(db, 'temporadas', 'id', temporadaId, 'anime_id', animeId);
        
        if (!temporadaCheck.success || !temporadaCheck.exists) {
            return { 
                success: false, 
                error: !temporadaCheck.success ? temporadaCheck.error : 'Temporada no encontrada para este anime' 
            };
        }
        
        // 3. Verificar que el capítulo existe y pertenece a la temporada
        const capituloQuery = 'SELECT * FROM capitulos WHERE id = ? AND temporada_id = ?';
        const capituloResult = await executeQuery(db, capituloQuery, [capituloId, temporadaId]);
        
        if (!capituloResult.success) {
            return { success: false, error: 'Error al obtener capítulo' };
        }
        
        if (capituloResult.result[0].length === 0) {
            return { success: false, error: 'Capítulo no encontrado para esta temporada' };
        }
        
        // 4. Formatear la respuesta
        const capitulo = capituloResult.result[0][0];
        const capituloFormateado = formatCapitulo(capitulo);
        
        return { success: true, capitulo: capituloFormateado };
    } catch (error) {
        console.error('Error en getCapitulo:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
};

module.exports = {
    initializeRouter,
    executeQuery,
    getDb: () => db,
    getAnimeWithSeasonsAndEpisodes,
    getTemporadaWithEpisodes,
    getCapitulo,
    checkEntityExists,
    handleErrorResponse,
    formatCapitulo,
    formatTemporada,
    getCapitulosForTemporadas
};