/**
 * Script para diagnosticar y reparar problemas en la base de datos
 * Ejecutar con: node diagnose-db.js
 */
const mysql = require('mysql2/promise');
const { checkDatabaseStructure, repairDatabaseStructure } = require('./utils/dbChecker');
const { validateQuery } = require('./utils/dbValidator');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'anime_db'
};

/**
 * Función principal para ejecutar el diagnóstico
 */
async function main() {
    console.log('=== DIAGNÓSTICO DE BASE DE DATOS ===');
    console.log('Fecha y hora:', new Date().toLocaleString());
    console.log('-----------------------------------');
    
    let connection;
    
    try {
        // Conectar a MySQL
        console.log('\n1. Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        console.log('✅ Conexión a MySQL establecida');
        
        // Verificar si existe la base de datos
        console.log('\n2. Verificando existencia de la base de datos...');
        const [dbs] = await connection.query('SHOW DATABASES LIKE "anime_db"');
        
        if (dbs.length === 0) {
            console.log('⚠️ Base de datos "anime_db" no encontrada');
            console.log('   Creando base de datos...');
            await connection.query('CREATE DATABASE anime_db');
            console.log('✅ Base de datos creada correctamente');
        } else {
            console.log('✅ Base de datos "anime_db" encontrada');
        }
        
        // Cerrar conexión inicial
        await connection.end();
        
        // Conectar a la base de datos específica
        console.log('\n3. Conectando a la base de datos "anime_db"...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida a "anime_db"');
        
        // Verificar estructura de tablas
        console.log('\n4. Verificando estructura de tablas...');
        const structureResult = await checkDatabaseStructure(connection);
        
        if (structureResult.valid) {
            console.log('✅ Estructura de tablas correcta');
        } else {
            console.log('❌ Problemas encontrados en la estructura:');
            structureResult.errors.forEach(error => console.log(`   - ${error}`));
            
            // Mostrar detalles por tabla
            console.log('\n   Detalles por tabla:');
            for (const [tableName, tableInfo] of Object.entries(structureResult.tables)) {
                if (tableInfo.exists && tableInfo.valid) {
                    console.log(`   ✅ Tabla '${tableName}': Correcta`);
                } else if (tableInfo.exists && !tableInfo.valid) {
                    console.log(`   ⚠️ Tabla '${tableName}': Problemas con columnas: ${tableInfo.missingColumns.join(', ')}`);
                } else {
                    console.log(`   ❌ Tabla '${tableName}': No existe o error: ${tableInfo.error}`);
                }
            }
            
            // Preguntar si se desea reparar
            console.log('\n¿Desea intentar reparar la estructura? (s/n)');
            process.stdin.once('data', async (data) => {
                const answer = data.toString().trim().toLowerCase();
                
                if (answer === 's' || answer === 'si' || answer === 'y' || answer === 'yes') {
                    console.log('\nIniciando reparación...');
                    const repairResult = await repairDatabaseStructure(connection);
                    
                    if (repairResult.success) {
                        console.log('✅ Reparación completada');
                        
                        // Verificar nuevamente
                        console.log('\nVerificando estructura después de la reparación...');
                        const recheck = await checkDatabaseStructure(connection);
                        
                        if (recheck.valid) {
                            console.log('✅ Todos los problemas han sido resueltos');
                        } else {
                            console.log('⚠️ Algunos problemas persisten después de la reparación:');
                            recheck.errors.forEach(error => console.log(`   - ${error}`));
                        }
                    } else {
                        console.log('❌ Error durante la reparación:', repairResult.error);
                    }
                    
                    finalizarDiagnostico(connection);
                } else {
                    console.log('Reparación cancelada');
                    finalizarDiagnostico(connection);
                }
            });
        }
        
        // Si no hay errores, verificar consultas comunes
        if (structureResult.valid) {
            console.log('\n5. Verificando consultas SQL comunes...');
            
            // Verificar consulta de inserción
            const insertQuery = 'INSERT INTO catalogo (nombre, estado, imagen_fondo, descripcion, nsfw, trailer, recomendacion) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const insertResult = await validateQuery(connection, insertQuery);
            
            if (insertResult.valid) {
                console.log('✅ Consulta de inserción válida');
            } else {
                console.log(`❌ Problema en consulta de inserción: ${insertResult.error}`);
            }
            
            // Verificar consulta de actualización
            const updateQuery = 'UPDATE catalogo SET nombre = ?, estado = ?, imagen_fondo = ?, descripcion = ?, nsfw = ?, trailer = ?, recomendacion = ? WHERE id = ?';
            const updateResult = await validateQuery(connection, updateQuery);
            
            if (updateResult.valid) {
                console.log('✅ Consulta de actualización válida');
            } else {
                console.log(`❌ Problema en consulta de actualización: ${updateResult.error}`);
            }
            
            console.log('\n=== DIAGNÓSTICO FINALIZADO ===');
            await connection.end();
            process.exit(0);
        }
    } catch (error) {
        console.error('\n❌ Error durante el diagnóstico:', error.message);
        console.error('Detalles del error:', error.stack);
        
        if (connection) {
            await connection.end();
        }
        
        console.log('\n=== DIAGNÓSTICO FINALIZADO CON ERRORES ===');
        process.exit(1);
    }
}

/**
 * Finaliza el diagnóstico y cierra la conexión
 */
async function finalizarDiagnostico(connection) {
    try {
        if (connection) {
            await connection.end();
        }
        console.log('\n=== DIAGNÓSTICO FINALIZADO ===');
        process.exit(0);
    } catch (error) {
        console.error('Error al finalizar:', error);
        process.exit(1);
    }
}

// Ejecutar el diagnóstico
main();