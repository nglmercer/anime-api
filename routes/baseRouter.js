/**
 * Archivo base para configuración de rutas
 * Proporciona acceso a la base de datos para todos los routers
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
 * Obtiene un anime por ID incluyendo sus temporadas y capítulos
 * @param {Object} db - Conexión a la base de datos
 * @param {number|string} animeId - ID del anime a consultar
 * @returns {Promise<Object>} - Objeto con el anime, sus temporadas y capítulos
 */
const getAnimeWithSeasonsAndEpisodes = async (db, animeId) => {
    try {
        // 1. Obtener información del anime
        const animeQuery = 'SELECT * FROM catalogo WHERE id = ?';
        const animeResult = await executeQuery(db, animeQuery, [animeId]);
        
        if (!animeResult.success || animeResult.result[0].length === 0) {
            return { success: false, error: 'Anime no encontrado' };
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
            const placeholders = temporadaIds.map(() => '?').join(',');
            const capitulosQuery = `SELECT * FROM capitulos WHERE temporada_id IN (${placeholders}) ORDER BY temporada_id ASC, numero ASC`;
            const capitulosResult = await executeQuery(db, capitulosQuery, temporadaIds);
            
            if (!capitulosResult.success) {
                return { success: false, error: 'Error al obtener capítulos' };
            }
            
            const capitulos = capitulosResult.result[0];
            
            // 4. Estructurar la respuesta con temporadas y capítulos anidados
            const temporadasConCapitulos = temporadas.map(temp => {
                // Formatear temporada
                const temporadaFormateada = {
                    temporadaId: temp.id,
                    numeroTemporada: temp.numero,
                    nombreTemporada: temp.nombre,
                    descripcionTemporada: temp.descripcion,
                    portadaTemporada: temp.portada,
                    animeId: temp.anime_id,
                    nsfw: Boolean(temp.nsfw),
                    capitulos: []
                };
                
                // Filtrar y formatear capítulos para esta temporada
                temporadaFormateada.capitulos = capitulos
                    .filter(cap => cap.temporada_id === temp.id)
                    .map(cap => ({
                        capituloId: cap.id,
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
                    }));
                
                return temporadaFormateada;
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

module.exports = {
    initializeRouter,
    executeQuery,
    getDb: () => db,
    getAnimeWithSeasonsAndEpisodes
};