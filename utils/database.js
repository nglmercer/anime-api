const mysql = require('mysql2/promise');
const { validateDatabaseStructure, repairDatabaseStructure } = require('./dbValidator');
const path = require('path');

async function initializeDatabase() {
    const password = '1234';

    try {
        console.log('Iniciando conexión a la base de datos...');
        // First check if we can connect to MySQL
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: password
        });

        // Check if database exists
        const [dbs] = await connection.query('SHOW DATABASES LIKE "anime_db"');
        if (dbs.length === 0) {
            await connection.query('CREATE DATABASE anime_db');
            console.log('Database created successfully');
            
            // Import SQL file to create tables
            const fs = require('fs').promises;
            const sql = await fs.readFile('./database.sql', 'utf8');
            
            // Split SQL statements and execute them one by one
            const statements = sql.split(';').filter(statement => statement.trim().length > 0);
            
            for (const statement of statements) {
                try {
                    await connection.query(statement);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                }
            }
            console.log('Tables created successfully');
        }

        await connection.end();

        // Connect to specific database
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: password,
            database: 'anime_db'
        });

        // Check tables
        const [tables] = await db.query('SHOW TABLES');
        const requiredTables = ['catalogo', 'temporada', 'capitulo', 'lenguaje'];
        const existingTables = tables.map(table => Object.values(table)[0]);

        for (const table of requiredTables) {
            if (!existingTables.includes(table)) {
                console.error(`Missing table: ${table}`);
                // Try to create missing table
                const fs = require('fs').promises;
                const sql = await fs.readFile('./database.sql', 'utf8');
                const statements = sql.split(';').filter(statement => statement.trim().length > 0);
                
                for (const statement of statements) {
                    try {
                        await db.query(statement);
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            throw error;
                        }
                    }
                }
                console.log(`Attempted to create missing table: ${table}`);
            }
        }

        console.log('Verificando estructura de la base de datos...');
        // Validar estructura de la base de datos
        const validationResult = await validateDatabaseStructure(db);
        
        if (!validationResult.valid) {
            console.warn('Se encontraron problemas en la estructura de la base de datos:');
            validationResult.errors.forEach(error => console.warn(`- ${error}`));
            
            console.log('Intentando reparar la estructura de la base de datos...');
            const repairResult = await repairDatabaseStructure(db);
            
            if (repairResult.success) {
                console.log('Reparación completada con éxito');
            } else {
                console.error('Error durante la reparación:', repairResult.error);
            }
            
            // Volver a validar después de la reparación
            const revalidationResult = await validateDatabaseStructure(db);
            if (!revalidationResult.valid) {
                console.error('Persisten problemas en la estructura de la base de datos después de la reparación:');
                revalidationResult.errors.forEach(error => console.error(`- ${error}`));
                console.error('Es posible que necesite corregir manualmente el archivo database.sql');
            } else {
                console.log('Estructura de la base de datos validada correctamente después de la reparación');
            }
        } else {
            console.log('Estructura de la base de datos validada correctamente');
        }
        
        console.log('Database verification successful');
        return db;
    } catch (error) {
        console.error('Database initialization failed:', error);
        console.error('Detalles del error:', error.stack);
        process.exit(1);
    }
}

module.exports = { initializeDatabase };