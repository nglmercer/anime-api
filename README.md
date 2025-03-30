# Anime API

A REST API for managing anime data with MySQL database.

## Data Structure

### Anime Object (Catalogo)
```json
{
    "id": "number",
    "nombre": "string",
    "imagenFondo": "string (URL)",
    "estado": "number (1=active, 0=inactive)"
}
{
    "id": "number",
    "catalogo_id": "number",
    "nombre": "string",
    "portada": "string (URL)",
    "numero": "number"
}
{
    "id": "number",
    "numero": "number",
    "temporada_id": "number",
    "reproducciones": "number"
}
{
    "id": "number",
    "nombre": "string",
    "codigo": "string (language code)",
    "ruta": "string (path to audio)",
    "estado": "number",
    "capitulo_id": "number"
}
