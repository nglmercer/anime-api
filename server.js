const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./utils/database');
const { executeQuery } = require('./utils/queryHandler');
const PORT = 3001;

const app = express();
// permitimos cors en desarrollo *
app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database before starting server
let db;
initializeDatabase().then(connection => {
    db = connection;

    // Anime CRUD endpoints
    app.get('/api/anime', async (req, res) => {
        try {
            const queryResult = await executeQuery(db, 'SELECT * FROM catalogo');
            if (queryResult.success) {
                const [results] = queryResult.result;
                res.json(results);
            } else {
                console.error('Error al obtener animes:', queryResult.error);
                res.status(500).json({ error: queryResult.error });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
    
    app.get('/api/anime/:id', async (req, res) => {
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
                res.status(500).json({ error: queryResult.error });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
    
    app.post('/api/anime', async (req, res) => {
        try {
            const { nombreCatalogo, estadoCatalogo, imagenFondoCatalogo, descripcionCatalogo, nsfwCatalogo, trailerCatalogo, recomendacionCatalogo } = req.body;
            
            const queryResult = await executeQuery(
                db, 
                'INSERT INTO catalogo (nombre, estado, imagen_fondo, descripcion, nsfw, trailer, recomendacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [nombreCatalogo, estadoCatalogo, imagenFondoCatalogo, descripcionCatalogo, nsfwCatalogo, trailerCatalogo, recomendacionCatalogo]
            );
            
            if (queryResult.success) {
                res.status(201).json({ message: 'Anime created successfully' });
            } else {
                console.error('Error al crear anime:', queryResult.error);
                if (queryResult.details && queryResult.details.suggestion) {
                    console.error('Sugerencia:', queryResult.details.suggestion);
                }
                res.status(500).json({ 
                    error: queryResult.error,
                    details: queryResult.details
                });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    app.put('/api/anime/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { nombreCatalogo, estadoCatalogo, imagenFondoCatalogo, descripcionCatalogo, nsfwCatalogo, trailerCatalogo, recomendacionCatalogo } = req.body;
            
            const queryResult = await executeQuery(
                db, 
                'UPDATE catalogo SET nombre = ?, estado = ?, imagen_fondo = ?, descripcion = ?, nsfw = ?, trailer = ?, recomendacion = ? WHERE id = ?',
                [nombreCatalogo, estadoCatalogo, imagenFondoCatalogo, descripcionCatalogo, nsfwCatalogo, trailerCatalogo, recomendacionCatalogo, id]
            );
            
            if (queryResult.success) {
                res.json({ message: 'Anime updated successfully' });
            } else {
                console.error('Error al actualizar anime:', queryResult.error);
                if (queryResult.details && queryResult.details.suggestion) {
                    console.error('Sugerencia:', queryResult.details.suggestion);
                }
                res.status(500).json({ 
                    error: queryResult.error,
                    details: queryResult.details
                });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    app.delete('/api/anime/:id', async (req, res) => {
        try {
            const { id } = req.params;
            
            const queryResult = await executeQuery(
                db, 
                'DELETE FROM catalogo WHERE id = ?', 
                [id]
            );
            
            if (queryResult.success) {
                res.json({ message: 'Anime deleted successfully' });
            } else {
                console.error('Error al eliminar anime:', queryResult.error);
                res.status(500).json({ error: queryResult.error });
            }
        } catch (err) {
            console.error('Error inesperado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});