const { initializeDatabase } = require('../utils/database');
const { executeQuery } = require('../utils/queryHandler');

let db;

const initializeRouter = async () => {
    if (!db) {
        db = await initializeDatabase();
    }
    return db;
};

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

const handleErrorResponse = (res, statusCode, message, details = null) => {
    const response = { error: message };
    if (details) response.details = details;
    res.status(statusCode).json(response);
};

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

const getAnimeWithSeasonsAndEpisodes = async (db, animeId) => {
    try {
        const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
        
        if (!animeCheck.success) {
            return { success: false, error: animeCheck.error };
        }
        
        if (!animeCheck.exists) {
            return { success: false, error: 'Anime no encontrado' };
        }
        
        const animeQuery = 'SELECT * FROM catalogo WHERE id = ?';
        const animeResult = await executeQuery(db, animeQuery, [animeId]);
        
        if (!animeResult.success) {
            return { success: false, error: 'Error al obtener datos del anime' };
        }
        
        const anime = animeResult.result[0][0];
        
        const temporadasQuery = 'SELECT * FROM temporadas WHERE anime_id = ? ORDER BY numero ASC';
        const temporadasResult = await executeQuery(db, temporadasQuery, [animeId]);
        
        if (!temporadasResult.success) {
            return { success: false, error: 'Error al obtener temporadas' };
        }
        
        const temporadas = temporadasResult.result[0];
        
        if (temporadas.length > 0) {
            const temporadaIds = temporadas.map(t => t.id);
            const capitulosResult = await getCapitulosForTemporadas(db, temporadaIds);
            
            if (!capitulosResult.success) {
                return { success: false, error: capitulosResult.error };
            }
            
            const capitulos = capitulosResult.capitulos;
            
            const temporadasConCapitulos = temporadas.map(temp => {
                const capitulosTemporada = capitulos.filter(cap => cap.temporada_id === temp.id);
                return formatTemporada(temp, capitulosTemporada);
            });
            
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

const getTemporadaWithEpisodes = async (db, animeId, temporadaId) => {
    try {
        const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
        
        if (!animeCheck.success || !animeCheck.exists) {
            return { 
                success: false, 
                error: !animeCheck.success ? animeCheck.error : 'Anime no encontrado' 
            };
        }
        
        const temporadaCheck = await checkEntityExists(db, 'temporadas', 'id', temporadaId, 'anime_id', animeId);
        
        if (!temporadaCheck.success || !temporadaCheck.exists) {
            return { 
                success: false, 
                error: !temporadaCheck.success ? temporadaCheck.error : 'Temporada no encontrada para este anime' 
            };
        }
        
        const temporadaQuery = 'SELECT * FROM temporadas WHERE id = ?';
        const temporadaResult = await executeQuery(db, temporadaQuery, [temporadaId]);
        
        if (!temporadaResult.success) {
            return { success: false, error: 'Error al obtener datos de la temporada' };
        }
        
        const temporada = temporadaResult.result[0][0];
        
        const capitulosQuery = 'SELECT * FROM capitulos WHERE temporada_id = ? ORDER BY numero ASC';
        const capitulosResult = await executeQuery(db, capitulosQuery, [temporadaId]);
        
        if (!capitulosResult.success) {
            return { success: false, error: 'Error al obtener capítulos' };
        }
        
        const capitulos = capitulosResult.result[0];
        
        const temporadaFormateada = formatTemporada(temporada, capitulos);
        
        return { success: true, temporada: temporadaFormateada };
    } catch (error) {
        console.error('Error en getTemporadaWithEpisodes:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
};

const getCapitulo = async (db, animeId, temporadaId, capituloId) => {
    try {
        const animeCheck = await checkEntityExists(db, 'catalogo', 'id', animeId);
        
        if (!animeCheck.success || !animeCheck.exists) {
            return { 
                success: false, 
                error: !animeCheck.success ? animeCheck.error : 'Anime no encontrado' 
            };
        }
        
        const temporadaCheck = await checkEntityExists(db, 'temporadas', 'id', temporadaId, 'anime_id', animeId);
        
        if (!temporadaCheck.success || !temporadaCheck.exists) {
            return { 
                success: false, 
                error: !temporadaCheck.success ? temporadaCheck.error : 'Temporada no encontrada para este anime' 
            };
        }
        
        const capituloQuery = 'SELECT * FROM capitulos WHERE id = ? AND temporada_id = ?';
        const capituloResult = await executeQuery(db, capituloQuery, [capituloId, temporadaId]);
        
        if (!capituloResult.success) {
            return { success: false, error: 'Error al obtener capítulo' };
        }
        
        if (capituloResult.result[0].length === 0) {
            return { success: false, error: 'Capítulo no encontrado para esta temporada' };
        }
        
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