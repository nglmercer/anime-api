/**
 * Archivo principal de rutas
 * Configura y exporta todas las rutas de la API
 */
const express = require('express');
const router = express.Router();

// Importar las rutas específicas
const animeRoutes = require('./animeRoutes');
const temporadasRoutes = require('./temporadasRoutes');
const capitulosRoutes = require('./capitulosRoutes');

// Configurar las rutas
router.use('/anime', animeRoutes);
router.use('/', temporadasRoutes); // Ya incluye prefijos como /anime/:animeId/temporadas
router.use('/', capitulosRoutes); // Ya incluye prefijos completos

module.exports = router;