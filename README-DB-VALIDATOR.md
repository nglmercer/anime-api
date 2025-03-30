# Herramientas de Verificación de Base de Datos

Este documento describe las herramientas de verificación y diagnóstico de base de datos implementadas para detectar y solucionar problemas en la estructura de la base de datos.

## Problema Detectado

Se ha identificado un error en la aplicación relacionado con la columna `descripcion` en la tabla `catalogo`. El error específico es:

```
Error SQL detallado: Error: Unknown column 'descripcion' in 'field list'
Consulta SQL: INSERT INTO catalogo (nombre, estado, imagen_fondo, descripcion, nsfw, trailer, recomendacion) VALUES (?, ?, ?, ?, ?, ?, ?)
```

## Herramientas de Diagnóstico

Se han implementado varias herramientas para diagnosticar y solucionar problemas en la base de datos:

### 1. Diagnóstico Completo

Ejecuta un diagnóstico completo de la estructura de la base de datos y ofrece opciones para reparar problemas:

```bash
npm run db:check
```

Este comando:
- Verifica la conexión a MySQL
- Comprueba la existencia de la base de datos
- Valida la estructura de todas las tablas
- Verifica las consultas SQL comunes
- Ofrece opciones para reparar problemas detectados

### 2. Diagnóstico Rápido

Ejecuta un diagnóstico más simple de la base de datos:

```bash
npm run db:diagnostic
```

## Módulos Implementados

Se han implementado los siguientes módulos para mejorar la detección y manejo de errores:

### 1. dbValidator.js

Módulo para validar la estructura de la base de datos y detectar errores:

- `validateDatabaseStructure`: Verifica la estructura de las tablas en la base de datos
- `validateQuery`: Valida una consulta SQL antes de ejecutarla
- `repairDatabaseStructure`: Repara la estructura de la base de datos según el archivo SQL

### 2. queryHandler.js

Módulo para manejar consultas SQL con validación previa:

- `executeQuery`: Ejecuta una consulta SQL con validación previa
- `executeTransaction`: Ejecuta una transacción con múltiples consultas

### 3. dbChecker.js

Módulo para verificar y diagnosticar errores en la base de datos:

- `checkDatabaseStructure`: Verifica la estructura de la base de datos
- `checkQuery`: Verifica una consulta SQL antes de ejecutarla
- `repairDatabaseStructure`: Intenta reparar la estructura de la base de datos
- `runDiagnostic`: Ejecuta un diagnóstico completo de la base de datos

## Integración en la Aplicación

Estas herramientas se han integrado en la aplicación de la siguiente manera:

1. El archivo `database.js` ahora valida la estructura de la base de datos al inicializar la conexión
2. El archivo `server.js` utiliza el módulo `queryHandler.js` para validar las consultas SQL antes de ejecutarlas
3. Se han agregado scripts en `package.json` para ejecutar diagnósticos de la base de datos

## Solución de Problemas Comunes

### Error "Unknown column"

Si aparece un error de "Unknown column" (columna desconocida):

1. Ejecuta el diagnóstico completo: `npm run db:check`
2. Verifica si hay discrepancias entre las columnas definidas en `database.sql` y las que se están utilizando en las consultas
3. Si el diagnóstico detecta problemas, selecciona la opción de reparación

### Errores de Conexión

Si hay problemas para conectar a la base de datos:

1. Verifica que MySQL esté en ejecución
2. Comprueba las credenciales en los archivos de configuración
3. Ejecuta el diagnóstico completo: `npm run db:check`

## Mantenimiento

Para mantener la integridad de la base de datos:

1. Ejecuta regularmente el diagnóstico: `npm run db:check`
2. Asegúrate de que cualquier cambio en la estructura de la base de datos se refleje en `database.sql`
3. Utiliza siempre los módulos de validación al ejecutar consultas SQL