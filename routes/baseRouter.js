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

module.exports = {
    initializeRouter,
    executeQuery,
    getDb: () => db
};